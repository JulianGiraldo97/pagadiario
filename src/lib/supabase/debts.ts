// Debt and Payment Schedule management functions
import { supabase } from './client';
import type {
  Debt,
  PaymentSchedule,
  CreateDebtForm,
  DebtFrequency,
  PaymentScheduleStatus
} from '../types';

export interface DebtWithSchedule extends Debt {
  payment_schedule?: PaymentSchedule[];
  client?: {
    id: string;
    name: string;
    address: string;
    phone?: string;
  };
}

export interface PaymentScheduleItem {
  due_date: string;
  amount: number;
  installment_number: number;
}

/**
 * Generate payment schedule based on debt parameters
 */
export function generatePaymentSchedule(
  totalAmount: number,
  installmentAmount: number,
  frequency: DebtFrequency,
  startDate: string
): PaymentScheduleItem[] {
  const schedule: PaymentScheduleItem[] = [];
  let remainingAmount = totalAmount;
  let currentDate = new Date(startDate);
  let installmentNumber = 1;

  while (remainingAmount > 0) {
    const paymentAmount = Math.min(installmentAmount, remainingAmount);
    
    schedule.push({
      due_date: currentDate.toISOString().split('T')[0],
      amount: paymentAmount,
      installment_number: installmentNumber
    });

    remainingAmount -= paymentAmount;
    installmentNumber++;

    // Calculate next payment date based on frequency
    if (frequency === 'daily') {
      currentDate.setDate(currentDate.getDate() + 1);
    } else if (frequency === 'weekly') {
      currentDate.setDate(currentDate.getDate() + 7);
    }
  }

  return schedule;
}

/**
 * Create a new debt with automatic payment schedule generation
 */
export async function createDebtWithSchedule(debtData: CreateDebtForm): Promise<DebtWithSchedule | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error('User not authenticated');
    return null;
  }

  try {
    // Start transaction by creating the debt first
    const { data: debt, error: debtError } = await supabase
      .from('debts')
      .insert({
        ...debtData,
        created_by: user.id
      })
      .select()
      .single();

    if (debtError) {
      console.error('Error creating debt:', debtError);
      return null;
    }

    // Generate payment schedule
    const schedule = generatePaymentSchedule(
      debtData.total_amount,
      debtData.installment_amount,
      debtData.frequency,
      debtData.start_date
    );

    // Insert payment schedule items
    const scheduleInserts = schedule.map(item => ({
      debt_id: debt.id,
      due_date: item.due_date,
      amount: item.amount
    }));

    const { data: paymentSchedule, error: scheduleError } = await supabase
      .from('payment_schedule')
      .insert(scheduleInserts)
      .select();

    if (scheduleError) {
      console.error('Error creating payment schedule:', scheduleError);
      // Rollback debt creation
      await supabase.from('debts').delete().eq('id', debt.id);
      return null;
    }

    return {
      ...debt,
      payment_schedule: paymentSchedule
    };
  } catch (error) {
    console.error('Error in createDebtWithSchedule:', error);
    return null;
  }
}

/**
 * Get all debts for a specific client with payment schedules
 */
export async function getClientDebtsWithSchedule(clientId: string): Promise<DebtWithSchedule[]> {
  
  const { data, error } = await supabase
    .from('debts')
    .select(`
      *,
      payment_schedule (
        id,
        due_date,
        amount,
        status,
        created_at
      ),
      clients (
        id,
        name,
        address,
        phone
      )
    `)
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching client debts with schedule:', error);
    return [];
  }

  return data?.map(debt => ({
    ...debt,
    client: debt.clients
  })) || [];
}

/**
 * Get all active debts with their payment schedules
 */
export async function getAllActiveDebtsWithSchedule(): Promise<DebtWithSchedule[]> {
  
  const { data, error } = await supabase
    .from('debts')
    .select(`
      *,
      payment_schedule (
        id,
        due_date,
        amount,
        status,
        created_at
      ),
      clients (
        id,
        name,
        address,
        phone
      )
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching active debts with schedule:', error);
    return [];
  }

  return data?.map(debt => ({
    ...debt,
    client: debt.clients
  })) || [];
}

/**
 * Update debt status (e.g., mark as completed or cancelled)
 */
export async function updateDebtStatus(debtId: string, status: 'active' | 'completed' | 'cancelled'): Promise<boolean> {
  
  const { error } = await supabase
    .from('debts')
    .update({ status })
    .eq('id', debtId);

  if (error) {
    console.error('Error updating debt status:', error);
    return false;
  }

  return true;
}

/**
 * Get payment schedule for a specific debt
 */
export async function getDebtPaymentSchedule(debtId: string): Promise<PaymentSchedule[]> {
  
  const { data, error } = await supabase
    .from('payment_schedule')
    .select('*')
    .eq('debt_id', debtId)
    .order('due_date');

  if (error) {
    console.error('Error fetching payment schedule:', error);
    return [];
  }

  return data || [];
}

/**
 * Update payment schedule status (e.g., mark as paid)
 */
export async function updatePaymentScheduleStatus(
  scheduleId: string, 
  status: PaymentScheduleStatus
): Promise<boolean> {
  
  const { error } = await supabase
    .from('payment_schedule')
    .update({ status })
    .eq('id', scheduleId);

  if (error) {
    console.error('Error updating payment schedule status:', error);
    return false;
  }

  return true;
}

/**
 * Get overdue payments across all debts
 */
export async function getOverduePayments(): Promise<PaymentSchedule[]> {
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('payment_schedule')
    .select(`
      *,
      debts (
        id,
        client_id,
        clients (
          id,
          name,
          address,
          phone
        )
      )
    `)
    .eq('status', 'pending')
    .lt('due_date', today);

  if (error) {
    console.error('Error fetching overdue payments:', error);
    return [];
  }

  return data || [];
}

/**
 * Calculate debt summary for a client
 */
export async function calculateClientDebtSummary(clientId: string) {
  const debts = await getClientDebtsWithSchedule(clientId);
  
  const summary = {
    total_debts: debts.length,
    active_debts: debts.filter(d => d.status === 'active').length,
    total_active_debt: 0,
    pending_amount: 0,
    overdue_amount: 0,
    paid_amount: 0
  };

  const today = new Date().toISOString().split('T')[0];

  debts.forEach(debt => {
    if (debt.status === 'active') {
      summary.total_active_debt += debt.total_amount;
      
      debt.payment_schedule?.forEach(schedule => {
        if (schedule.status === 'pending') {
          summary.pending_amount += schedule.amount;
          if (schedule.due_date < today) {
            summary.overdue_amount += schedule.amount;
          }
        } else if (schedule.status === 'paid') {
          summary.paid_amount += schedule.amount;
        }
      });
    }
  });

  return summary;
}