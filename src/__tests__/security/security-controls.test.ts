import { 
  validateClientForm, 
  validateDebtForm, 
  validatePaymentForm,
  validateFileUpload,
  sanitizeName,
  sanitizeAddress,
  sanitizePhone,
  sanitizeAmount,
  sanitizeString,
  hasPermission,
  requireRole,
  SecurityLogger,
  SecurityLogLevel,
  SecurityEventType,
  VALIDATION_PATTERNS
} from '@/lib/utils/security'
import { UserRole } from '@/lib/types'

describe('Security Controls', () => {
  let securityLogger: SecurityLogger

  beforeEach(() => {
    securityLogger = SecurityLogger.getInstance()
    securityLogger.clearLogs()
  })

  describe('Input Validation', () => {
    describe('validateClientForm', () => {
      it('should validate correct client data', () => {
        const validData = {
          name: 'Juan Pérez',
          address: 'Calle 123 #45-67',
          phone: '+57 300 123 4567'
        }
        
        const result = validateClientForm(validData)
        expect(result.isValid).toBe(true)
        expect(Object.keys(result.errors)).toHaveLength(0)
      })

      it('should reject invalid client data', () => {
        const invalidData = {
          name: '',
          address: '',
          phone: 'invalid-phone'
        }
        
        const result = validateClientForm(invalidData)
        expect(result.isValid).toBe(false)
        expect(result.errors.name).toBeDefined()
        expect(result.errors.address).toBeDefined()
        expect(result.errors.phone).toBeDefined()
      })

      it('should reject names with invalid characters', () => {
        const invalidData = {
          name: 'Juan<script>alert("xss")</script>',
          address: 'Valid address',
          phone: ''
        }
        
        const result = validateClientForm(invalidData)
        expect(result.isValid).toBe(false)
        expect(result.errors.name).toBeDefined()
      })
    })

    describe('validateDebtForm', () => {
      it('should validate correct debt data', () => {
        const validData = {
          client_id: '123e4567-e89b-12d3-a456-426614174000',
          total_amount: 1000000,
          installment_amount: 50000,
          frequency: 'daily',
          start_date: '2024-01-01'
        }
        
        const result = validateDebtForm(validData)
        expect(result.isValid).toBe(true)
        expect(Object.keys(result.errors)).toHaveLength(0)
      })

      it('should reject invalid debt data', () => {
        const invalidData = {
          client_id: 'invalid-uuid',
          total_amount: -1000,
          installment_amount: 0,
          frequency: 'invalid',
          start_date: ''
        }
        
        const result = validateDebtForm(invalidData)
        expect(result.isValid).toBe(false)
        expect(result.errors.client_id).toBeDefined()
        expect(result.errors.total_amount).toBeDefined()
        expect(result.errors.installment_amount).toBeDefined()
        expect(result.errors.frequency).toBeDefined()
        expect(result.errors.start_date).toBeDefined()
      })
    })

    describe('validatePaymentForm', () => {
      it('should validate correct payment data', () => {
        const validData = {
          route_assignment_id: '123e4567-e89b-12d3-a456-426614174000',
          payment_status: 'paid',
          amount_paid: 50000,
          notes: 'Payment received successfully'
        }
        
        const result = validatePaymentForm(validData)
        expect(result.isValid).toBe(true)
        expect(Object.keys(result.errors)).toHaveLength(0)
      })

      it('should reject invalid payment data', () => {
        const invalidData = {
          route_assignment_id: 'invalid-uuid',
          payment_status: 'invalid_status',
          amount_paid: -100,
          notes: ''
        }
        
        const result = validatePaymentForm(invalidData)
        expect(result.isValid).toBe(false)
        expect(result.errors.route_assignment_id).toBeDefined()
        expect(result.errors.payment_status).toBeDefined()
      })
    })
  })

  describe('Input Sanitization', () => {
    it('should sanitize names correctly', () => {
      expect(sanitizeName('  Juan Pérez  ')).toBe('Juan Pérez')
      expect(() => sanitizeName('Juan123')).toThrow() // Numbers not allowed in names
      expect(() => sanitizeName('Juan<script>alert("xss")</script>')).toThrow() // Script injection
    })

    it('should sanitize addresses correctly', () => {
      expect(sanitizeAddress('  Calle 123 #45-67  ')).toBe('Calle 123 #45-67')
      expect(() => sanitizeAddress('Address<script>alert("xss")</script>')).toThrow() // Script injection
    })

    it('should sanitize phone numbers correctly', () => {
      expect(sanitizePhone('+57 300 123 4567')).toBe('+57 300 123 4567')
      expect(() => sanitizePhone('invalid-phone')).toThrow()
    })

    it('should sanitize amounts correctly', () => {
      expect(sanitizeAmount('1000.50')).toBe(1000.50)
      expect(sanitizeAmount(1000)).toBe(1000)
      expect(() => sanitizeAmount('-100')).toThrow()
      expect(() => sanitizeAmount('invalid')).toThrow()
    })

    it('should sanitize strings correctly', () => {
      expect(sanitizeString('  Valid string  ', 20)).toBe('Valid string')
      expect(sanitizeString('String with <script>', 50)).toBe('String with script')
      expect(sanitizeString('Very long string that exceeds limit', 10)).toBe('Very long ')
    })
  })

  describe('File Upload Validation', () => {
    it('should validate correct image files', () => {
      const validFile = new File([''], 'test.jpg', { type: 'image/jpeg' })
      Object.defineProperty(validFile, 'size', { value: 1024 * 1024 }) // 1MB
      
      expect(() => validateFileUpload(validFile)).not.toThrow()
    })

    it('should reject invalid file types', () => {
      const invalidFile = new File([''], 'test.txt', { type: 'text/plain' })
      expect(() => validateFileUpload(invalidFile)).toThrow('Invalid file type')
    })

    it('should reject oversized files', () => {
      const oversizedFile = new File([''], 'test.jpg', { type: 'image/jpeg' })
      Object.defineProperty(oversizedFile, 'size', { value: 10 * 1024 * 1024 }) // 10MB
      
      expect(() => validateFileUpload(oversizedFile)).toThrow('File size too large')
    })

    it('should reject suspicious file names', () => {
      const suspiciousFile = new File([''], 'malicious.php', { type: 'image/jpeg' })
      expect(() => validateFileUpload(suspiciousFile)).toThrow('Suspicious file name')
    })
  })

  describe('Role-Based Access Control', () => {
    it('should check permissions correctly', () => {
      expect(hasPermission('admin', 'admin')).toBe(true)
      expect(hasPermission('admin', 'collector')).toBe(true)
      expect(hasPermission('collector', 'collector')).toBe(true)
      expect(hasPermission('collector', 'admin')).toBe(false)
    })

    it('should require roles correctly', () => {
      expect(() => requireRole('admin', 'admin')).not.toThrow()
      expect(() => requireRole('admin', 'collector')).not.toThrow()
      expect(() => requireRole('collector', 'collector')).not.toThrow()
      expect(() => requireRole('collector', 'admin')).toThrow('Access denied')
      expect(() => requireRole(undefined, 'admin')).toThrow('User role not found')
    })
  })

  describe('Security Logging', () => {
    it('should log security events correctly', () => {
      securityLogger.log({
        level: SecurityLogLevel.INFO,
        event: SecurityEventType.LOGIN_SUCCESS,
        userId: 'test-user-id',
        userRole: 'admin',
        success: true,
        details: { action: 'test_login' }
      })

      const logs = securityLogger.getRecentLogs(1)
      expect(logs).toHaveLength(1)
      expect(logs[0].event).toBe(SecurityEventType.LOGIN_SUCCESS)
      expect(logs[0].userId).toBe('test-user-id')
      expect(logs[0].success).toBe(true)
    })

    it('should clear logs correctly', () => {
      securityLogger.log({
        level: SecurityLogLevel.INFO,
        event: SecurityEventType.DATA_ACCESS,
        userId: 'test-user-id'
      })

      expect(securityLogger.getRecentLogs().length).toBeGreaterThan(0)
      
      securityLogger.clearLogs()
      expect(securityLogger.getRecentLogs()).toHaveLength(0)
    })

    it('should limit log entries correctly', () => {
      // Add multiple log entries
      for (let i = 0; i < 150; i++) {
        securityLogger.log({
          level: SecurityLogLevel.INFO,
          event: SecurityEventType.DATA_ACCESS,
          userId: `user-${i}`
        })
      }

      const logs = securityLogger.getRecentLogs(100)
      expect(logs).toHaveLength(100)
      
      // Should return the most recent entries
      expect(logs[logs.length - 1].userId).toBe('user-149')
    })
  })

  describe('Validation Patterns', () => {
    it('should validate email patterns correctly', () => {
      expect(VALIDATION_PATTERNS.email.test('user@example.com')).toBe(true)
      expect(VALIDATION_PATTERNS.email.test('invalid-email')).toBe(false)
      expect(VALIDATION_PATTERNS.email.test('user@')).toBe(false)
    })

    it('should validate phone patterns correctly', () => {
      expect(VALIDATION_PATTERNS.phone.test('+57 300 123 4567')).toBe(true)
      expect(VALIDATION_PATTERNS.phone.test('300-123-4567')).toBe(true)
      expect(VALIDATION_PATTERNS.phone.test('invalid-phone')).toBe(false)
    })

    it('should validate name patterns correctly', () => {
      expect(VALIDATION_PATTERNS.name.test('Juan Pérez')).toBe(true)
      expect(VALIDATION_PATTERNS.name.test('María José')).toBe(true)
      expect(VALIDATION_PATTERNS.name.test('Juan123')).toBe(false)
      expect(VALIDATION_PATTERNS.name.test('Juan<script>')).toBe(false)
    })

    it('should validate UUID patterns correctly', () => {
      expect(VALIDATION_PATTERNS.uuid.test('123e4567-e89b-12d3-a456-426614174000')).toBe(true)
      expect(VALIDATION_PATTERNS.uuid.test('invalid-uuid')).toBe(false)
      expect(VALIDATION_PATTERNS.uuid.test('123e4567-e89b-12d3-a456')).toBe(false)
    })
  })
})

// Mock File constructor for Node.js environment
if (typeof File === 'undefined') {
  global.File = class File {
    name: string
    type: string
    size: number

    constructor(bits: any[], name: string, options: { type: string }) {
      this.name = name
      this.type = options.type
      this.size = 0
    }
  } as any
}