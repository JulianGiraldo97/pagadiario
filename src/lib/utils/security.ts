// Security utilities for input validation and sanitization

import { UserRole } from '@/lib/types'

// Input validation patterns
export const VALIDATION_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[\d\s\-\+\(\)]+$/,
  name: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
  address: /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-\#\,\.]+$/,
  amount: /^\d+(\.\d{1,2})?$/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
}

// Security logging levels
export enum SecurityLogLevel {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL'
}

// Security event types
export enum SecurityEventType {
  LOGIN_ATTEMPT = 'LOGIN_ATTEMPT',
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  LOGOUT = 'LOGOUT',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  ROLE_VIOLATION = 'ROLE_VIOLATION',
  INVALID_INPUT = 'INVALID_INPUT',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  DATA_ACCESS = 'DATA_ACCESS',
  DATA_MODIFICATION = 'DATA_MODIFICATION',
  FILE_UPLOAD = 'FILE_UPLOAD'
}

// Security logging interface
export interface SecurityLogEntry {
  timestamp: string
  level: SecurityLogLevel
  event: SecurityEventType
  userId?: string
  userRole?: UserRole
  ip?: string
  userAgent?: string
  path?: string
  details?: Record<string, any>
  success?: boolean
}

// Security logger class
export class SecurityLogger {
  private static instance: SecurityLogger
  private logs: SecurityLogEntry[] = []

  private constructor() {}

  static getInstance(): SecurityLogger {
    if (!SecurityLogger.instance) {
      SecurityLogger.instance = new SecurityLogger()
    }
    return SecurityLogger.instance
  }

  log(entry: Omit<SecurityLogEntry, 'timestamp'>): void {
    const logEntry: SecurityLogEntry = {
      ...entry,
      timestamp: new Date().toISOString()
    }

    this.logs.push(logEntry)
    
    // Console logging for development
    const logMessage = `[${logEntry.level}] ${logEntry.event} - User: ${logEntry.userId || 'anonymous'} - ${JSON.stringify(logEntry.details || {})}`
    
    switch (logEntry.level) {
      case SecurityLogLevel.CRITICAL:
      case SecurityLogLevel.ERROR:
        console.error(logMessage)
        break
      case SecurityLogLevel.WARNING:
        console.warn(logMessage)
        break
      default:
        console.log(logMessage)
    }

    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoringService(logEntry)
    }
  }

  private sendToMonitoringService(entry: SecurityLogEntry): void {
    // Implementation would send to external monitoring service
    // For now, just ensure critical events are logged
    if (entry.level === SecurityLogLevel.CRITICAL) {
      console.error('CRITICAL SECURITY EVENT:', entry)
    }
  }

  getRecentLogs(limit: number = 100): SecurityLogEntry[] {
    return this.logs.slice(-limit)
  }

  clearLogs(): void {
    this.logs = []
  }
}

// Input sanitization functions
export function sanitizeString(input: string, maxLength: number = 255): string {
  if (typeof input !== 'string') {
    throw new Error('Input must be a string')
  }
  
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>\"'&]/g, '') // Remove potentially dangerous characters
    .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
}

export function sanitizeEmail(email: string): string {
  const sanitized = sanitizeString(email.toLowerCase(), 254)
  if (!VALIDATION_PATTERNS.email.test(sanitized)) {
    throw new Error('Invalid email format')
  }
  return sanitized
}

export function sanitizeName(name: string): string {
  const sanitized = sanitizeString(name, 100)
  if (!VALIDATION_PATTERNS.name.test(sanitized)) {
    throw new Error('Name contains invalid characters')
  }
  return sanitized
}

export function sanitizeAddress(address: string): string {
  const sanitized = sanitizeString(address, 500)
  if (!VALIDATION_PATTERNS.address.test(sanitized)) {
    throw new Error('Address contains invalid characters')
  }
  return sanitized
}

export function sanitizePhone(phone: string): string {
  const sanitized = sanitizeString(phone, 20)
  if (!VALIDATION_PATTERNS.phone.test(sanitized)) {
    throw new Error('Phone number contains invalid characters')
  }
  return sanitized
}

export function sanitizeAmount(amount: string | number): number {
  const amountStr = typeof amount === 'number' ? amount.toString() : amount
  const sanitized = sanitizeString(amountStr, 20)
  
  if (!VALIDATION_PATTERNS.amount.test(sanitized)) {
    throw new Error('Invalid amount format')
  }
  
  const numericAmount = parseFloat(sanitized)
  if (isNaN(numericAmount) || numericAmount < 0) {
    throw new Error('Amount must be a positive number')
  }
  
  return numericAmount
}

export function validateUUID(uuid: string): boolean {
  return VALIDATION_PATTERNS.uuid.test(uuid)
}

// Role-based access control utilities
export function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    collector: 1,
    admin: 2
  }
  
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

export function requireRole(userRole: UserRole | undefined, requiredRole: UserRole): void {
  if (!userRole) {
    throw new Error('User role not found')
  }
  
  if (!hasPermission(userRole, requiredRole)) {
    SecurityLogger.getInstance().log({
      level: SecurityLogLevel.WARNING,
      event: SecurityEventType.ROLE_VIOLATION,
      userRole,
      details: { requiredRole, actualRole: userRole }
    })
    throw new Error(`Access denied. Required role: ${requiredRole}`)
  }
}

// File upload security
export function validateFileUpload(file: File): void {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  const maxSize = 5 * 1024 * 1024 // 5MB
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.')
  }
  
  if (file.size > maxSize) {
    throw new Error('File size too large. Maximum size is 5MB.')
  }
  
  // Check for suspicious file names
  const suspiciousPatterns = [/\.php$/i, /\.js$/i, /\.exe$/i, /\.bat$/i, /\.sh$/i]
  if (suspiciousPatterns.some(pattern => pattern.test(file.name))) {
    throw new Error('Suspicious file name detected.')
  }
}

// Form validation utilities
export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
}

export function validateClientForm(data: any): ValidationResult {
  const errors: Record<string, string> = {}
  
  try {
    if (!data.name || data.name.trim().length === 0) {
      errors.name = 'Name is required'
    } else {
      sanitizeName(data.name)
    }
  } catch (error) {
    errors.name = error instanceof Error ? error.message : 'Invalid name'
  }
  
  try {
    if (!data.address || data.address.trim().length === 0) {
      errors.address = 'Address is required'
    } else {
      sanitizeAddress(data.address)
    }
  } catch (error) {
    errors.address = error instanceof Error ? error.message : 'Invalid address'
  }
  
  if (data.phone && data.phone.trim().length > 0) {
    try {
      sanitizePhone(data.phone)
    } catch (error) {
      errors.phone = error instanceof Error ? error.message : 'Invalid phone number'
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

export function validateDebtForm(data: any): ValidationResult {
  const errors: Record<string, string> = {}
  
  if (!data.client_id || !validateUUID(data.client_id)) {
    errors.client_id = 'Valid client ID is required'
  }
  
  try {
    sanitizeAmount(data.total_amount)
    if (data.total_amount <= 0) {
      errors.total_amount = 'Total amount must be greater than 0'
    }
  } catch (error) {
    errors.total_amount = error instanceof Error ? error.message : 'Invalid total amount'
  }
  
  try {
    sanitizeAmount(data.installment_amount)
    if (data.installment_amount <= 0) {
      errors.installment_amount = 'Installment amount must be greater than 0'
    }
  } catch (error) {
    errors.installment_amount = error instanceof Error ? error.message : 'Invalid installment amount'
  }
  
  if (!['daily', 'weekly'].includes(data.frequency)) {
    errors.frequency = 'Frequency must be daily or weekly'
  }
  
  if (!data.start_date) {
    errors.start_date = 'Start date is required'
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

export function validatePaymentForm(data: any): ValidationResult {
  const errors: Record<string, string> = {}
  
  if (!data.route_assignment_id || !validateUUID(data.route_assignment_id)) {
    errors.route_assignment_id = 'Valid route assignment ID is required'
  }
  
  if (!['paid', 'not_paid', 'client_absent'].includes(data.payment_status)) {
    errors.payment_status = 'Invalid payment status'
  }
  
  if (data.payment_status === 'paid') {
    try {
      sanitizeAmount(data.amount_paid)
      if (data.amount_paid <= 0) {
        errors.amount_paid = 'Payment amount must be greater than 0'
      }
    } catch (error) {
      errors.amount_paid = error instanceof Error ? error.message : 'Invalid payment amount'
    }
  }
  
  if (data.notes && data.notes.trim().length > 0) {
    try {
      sanitizeString(data.notes, 1000)
    } catch (error) {
      errors.notes = 'Notes contain invalid characters'
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

// Export singleton instance
export const securityLogger = SecurityLogger.getInstance()