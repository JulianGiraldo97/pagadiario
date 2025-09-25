// Payment operations for Sistema de Paga Diario
import { supabase } from './client';
import type { Payment, RecordPaymentForm } from '../types';

// Record a payment
export async function recordPayment(paymentData: RecordPaymentForm): Promise<{ data: Payment | null; error: string | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { data: null, error: 'Usuario no autenticado' };
    }

    let evidencePhotoUrl: string | undefined;

    // Upload evidence photo if provided
    if (paymentData.evidence_photo) {
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${paymentData.evidence_photo.name}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('evidence-photos')
        .upload(fileName, paymentData.evidence_photo, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        return { data: null, error: `Error al subir la foto: ${uploadError.message}` };
      }

      const { data: { publicUrl } } = supabase.storage
        .from('evidence-photos')
        .getPublicUrl(uploadData.path);
      
      evidencePhotoUrl = publicUrl;
    }

    // Check if payment already exists for this assignment
    const { data: existingPayments } = await supabase
      .from('payments')
      .select('id')
      .eq('route_assignment_id', paymentData.route_assignment_id);

    if (existingPayments && existingPayments.length > 0) {
      return { data: null, error: 'Ya existe un registro de pago para esta visita' };
    }

    // Insert payment record
    const { data, error } = await supabase
      .from('payments')
      .insert({
        route_assignment_id: paymentData.route_assignment_id,
        payment_schedule_id: paymentData.payment_schedule_id,
        amount_paid: paymentData.amount_paid,
        payment_status: paymentData.payment_status,
        evidence_photo_url: evidencePhotoUrl,
        notes: paymentData.notes,
        recorded_by: user.id
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    // Update payment schedule status if payment was made
    if (paymentData.payment_status === 'paid' && paymentData.payment_schedule_id) {
      await supabase
        .from('payment_schedule')
        .update({ status: 'paid' })
        .eq('id', paymentData.payment_schedule_id);
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
  }
}

// Update an existing payment
export async function updatePayment(
  paymentId: string, 
  paymentData: Partial<RecordPaymentForm>
): Promise<{ data: Payment | null; error: string | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { data: null, error: 'Usuario no autenticado' };
    }

    // Get existing payment to check ownership
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('recorded_by, evidence_photo_url')
      .eq('id', paymentId)
      .single();

    if (!existingPayment) {
      return { data: null, error: 'Pago no encontrado' };
    }

    if (existingPayment.recorded_by !== user.id) {
      return { data: null, error: 'No tienes permisos para modificar este pago' };
    }

    let evidencePhotoUrl = existingPayment.evidence_photo_url;

    // Upload new evidence photo if provided
    if (paymentData.evidence_photo) {
      // Delete old photo if exists
      if (existingPayment.evidence_photo_url) {
        const oldPath = existingPayment.evidence_photo_url.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('evidence-photos')
            .remove([oldPath]);
        }
      }

      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${paymentData.evidence_photo.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('evidence-photos')
        .upload(fileName, paymentData.evidence_photo, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        return { data: null, error: `Error al subir la foto: ${uploadError.message}` };
      }

      const { data: { publicUrl } } = supabase.storage
        .from('evidence-photos')
        .getPublicUrl(uploadData.path);
      
      evidencePhotoUrl = publicUrl;
    }

    // Update payment record
    const updateData: any = {};
    if (paymentData.amount_paid !== undefined) updateData.amount_paid = paymentData.amount_paid;
    if (paymentData.payment_status !== undefined) updateData.payment_status = paymentData.payment_status;
    if (paymentData.notes !== undefined) updateData.notes = paymentData.notes;
    if (evidencePhotoUrl !== existingPayment.evidence_photo_url) updateData.evidence_photo_url = evidencePhotoUrl;

    const { data, error } = await supabase
      .from('payments')
      .update(updateData)
      .eq('id', paymentId)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    // Update payment schedule status if payment status changed
    if (paymentData.payment_status !== undefined && paymentData.payment_schedule_id) {
      const scheduleStatus = paymentData.payment_status === 'paid' ? 'paid' : 'pending';
      await supabase
        .from('payment_schedule')
        .update({ status: scheduleStatus })
        .eq('id', paymentData.payment_schedule_id);
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
  }
}

// Get payment by route assignment
export async function getPaymentByAssignment(assignmentId: string): Promise<{ data: Payment | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('route_assignment_id', assignmentId);

    if (error) {
      return { data: null, error: error.message };
    }

    // Return the first payment found, or null if none
    return { data: data && data.length > 0 ? data[0] : null, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
  }
}

// Delete payment (admin only or same user within time limit)
export async function deletePayment(paymentId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    // Get payment details
    const { data: payment } = await supabase
      .from('payments')
      .select('recorded_by, recorded_at, evidence_photo_url')
      .eq('id', paymentId)
      .single();

    if (!payment) {
      return { success: false, error: 'Pago no encontrado' };
    }

    // Check if user can delete (same user within 24 hours or admin)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'admin';
    const isOwner = payment.recorded_by === user.id;
    const recordedAt = new Date(payment.recorded_at);
    const now = new Date();
    const hoursDiff = (now.getTime() - recordedAt.getTime()) / (1000 * 60 * 60);
    const canDeleteByTime = hoursDiff <= 24;

    if (!isAdmin && (!isOwner || !canDeleteByTime)) {
      return { success: false, error: 'No tienes permisos para eliminar este pago' };
    }

    // Delete evidence photo if exists
    if (payment.evidence_photo_url) {
      const photoPath = payment.evidence_photo_url.split('/').pop();
      if (photoPath) {
        await supabase.storage
          .from('evidence-photos')
          .remove([photoPath]);
      }
    }

    // Delete payment record
    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', paymentId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
  }
}

// Get all payments for a collector's route on a specific date
export async function getCollectorPayments(routeDate?: string): Promise<{ data: Payment[]; error: string | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { data: [], error: 'Usuario no autenticado' };
    }

    const targetDate = routeDate || new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        route_assignment:route_assignments!inner(
          id,
          client:clients(name, address),
          route:routes!inner(
            collector_id,
            route_date
          )
        )
      `)
      .eq('route_assignment.route.collector_id', user.id)
      .eq('route_assignment.route.route_date', targetDate)
      .order('recorded_at', { ascending: false });

    if (error) {
      return { data: [], error: error.message };
    }

    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error: error instanceof Error ? error.message : 'Error desconocido' };
  }
}