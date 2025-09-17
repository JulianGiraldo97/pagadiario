// Database utility functions for Sistema de Paga Diario
import { createClient as createServerClient } from './server';
import type {
  Profile,
  Client,
  Debt,
  Route,
  RouteAssignment,
  Payment,
  CollectorDailyRoute,
  DailyCollectionSummary,
  ClientDebtSummary,
  CreateClientForm,
  CreateDebtForm,
  CreateRouteForm,
  RecordPaymentForm
} from '../types';

// Profile operations
export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return data;
}

export async function getAllCollectors(): Promise<Profile[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'collector')
    .order('full_name');

  if (error) {
    console.error('Error fetching collectors:', error);
    return [];
  }

  return data || [];
}

// Client operations
export async function getAllClients(): Promise<Client[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching clients:', error);
    return [];
  }

  return data || [];
}

export async function createClient(clientData: CreateClientForm): Promise<Client | null> {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error('User not authenticated');
    return null;
  }

  const { data, error } = await supabase
    .from('clients')
    .insert({
      ...clientData,
      created_by: user.id
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating client:', error);
    return null;
  }

  return data;
}

export async function updateClient(id: string, clientData: Partial<CreateClientForm>): Promise<Client | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('clients')
    .update(clientData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating client:', error);
    return null;
  }

  return data;
}

export async function deleteClient(id: string): Promise<boolean> {
  const supabase = createServerClient();
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting client:', error);
    return false;
  }

  return true;
}

// Debt operations
export async function createDebt(debtData: CreateDebtForm): Promise<Debt | null> {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error('User not authenticated');
    return null;
  }

  const { data, error } = await supabase
    .from('debts')
    .insert({
      ...debtData,
      created_by: user.id
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating debt:', error);
    return null;
  }

  return data;
}

export async function getClientDebts(clientId: string): Promise<Debt[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('debts')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching client debts:', error);
    return [];
  }

  return data || [];
}

// Route operations
export async function createRoute(routeData: CreateRouteForm): Promise<Route | null> {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error('User not authenticated');
    return null;
  }

  // Start transaction
  const { data: route, error: routeError } = await supabase
    .from('routes')
    .insert({
      collector_id: routeData.collector_id,
      route_date: routeData.route_date,
      created_by: user.id
    })
    .select()
    .single();

  if (routeError) {
    console.error('Error creating route:', routeError);
    return null;
  }

  // Create route assignments
  const assignments = routeData.client_ids.map((clientId, index) => ({
    route_id: route.id,
    client_id: clientId,
    visit_order: index + 1
  }));

  const { error: assignmentError } = await supabase
    .from('route_assignments')
    .insert(assignments);

  if (assignmentError) {
    console.error('Error creating route assignments:', assignmentError);
    // Rollback route creation
    await supabase.from('routes').delete().eq('id', route.id);
    return null;
  }

  return route;
}

export async function getCollectorDailyRoute(
  collectorId: string,
  routeDate?: string
): Promise<CollectorDailyRoute[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .rpc('get_collector_daily_route', {
      collector_id_param: collectorId,
      route_date_param: routeDate || new Date().toISOString().split('T')[0]
    });

  if (error) {
    console.error('Error fetching collector daily route:', error);
    return [];
  }

  return data || [];
}

// Payment operations
export async function recordPayment(paymentData: RecordPaymentForm): Promise<Payment | null> {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error('User not authenticated');
    return null;
  }

  let evidencePhotoUrl: string | undefined;

  // Upload evidence photo if provided
  if (paymentData.evidence_photo) {
    const fileName = `${Date.now()}-${paymentData.evidence_photo.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('evidence-photos')
      .upload(fileName, paymentData.evidence_photo);

    if (uploadError) {
      console.error('Error uploading evidence photo:', uploadError);
    } else {
      const { data: { publicUrl } } = supabase.storage
        .from('evidence-photos')
        .getPublicUrl(uploadData.path);
      evidencePhotoUrl = publicUrl;
    }
  }

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
    console.error('Error recording payment:', error);
    return null;
  }

  return data;
}

// Report operations
export async function getDailyCollectionSummary(
  routeDate?: string
): Promise<DailyCollectionSummary[]> {
  const supabase = createServerClient();
  let query = supabase
    .from('daily_collection_summary')
    .select('*')
    .order('route_date', { ascending: false });

  if (routeDate) {
    query = query.eq('route_date', routeDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching daily collection summary:', error);
    return [];
  }

  return data || [];
}

export async function getClientDebtSummary(): Promise<ClientDebtSummary[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('client_debt_summary')
    .select('*')
    .order('client_name');

  if (error) {
    console.error('Error fetching client debt summary:', error);
    return [];
  }

  return data || [];
}

// Utility functions
export async function updateOverduePayments(): Promise<boolean> {
  const supabase = createServerClient();
  const { error } = await supabase.rpc('update_overdue_payments');

  if (error) {
    console.error('Error updating overdue payments:', error);
    return false;
  }

  return true;
}