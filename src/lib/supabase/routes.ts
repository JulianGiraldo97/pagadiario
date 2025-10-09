// Client-side route operations for Sistema de Paga Diario
import { supabase } from './client';
import type {
  Route,
  RouteWithAssignments,
  RouteAssignmentWithDetails,
  Profile,
  ClientWithDebt,
  CreateRouteForm
} from '../types';

// Route operations
export async function createRoute(routeData: CreateRouteForm): Promise<{ data: Route | null; error: string | null }> {
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { data: null, error: 'Usuario no autenticado' };
    }

    // Check for existing route for the same collector and date
    const { data: existingRoute } = await supabase
      .from('routes')
      .select('id')
      .eq('collector_id', routeData.collector_id)
      .eq('route_date', routeData.route_date)
      .single();

    if (existingRoute) {
      return { data: null, error: 'Ya existe una ruta asignada para este cobrador en la fecha seleccionada' };
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
      return { data: null, error: routeError.message };
    }

    // Get pending installments for all clients in the route
    const { data: pendingInstallments, error: installmentsError } = await supabase
      .rpc('get_pending_installments_for_clients', {
        client_ids_param: routeData.client_ids
      });

    if (installmentsError) {
      console.warn('Warning: Could not fetch pending installments:', installmentsError.message);
      // Continue without payment schedules rather than failing
    }

    // Create a map of client_id -> payment_schedule_id for quick lookup
    const clientScheduleMap = new Map<string, string>();
    if (pendingInstallments) {
      pendingInstallments.forEach((item: any) => {
        clientScheduleMap.set(item.client_id, item.payment_schedule_id);
      });
    }

    // Create route assignments with payment_schedule_id
    const assignments = routeData.client_ids.map((clientId, index) => ({
      route_id: route.id,
      client_id: clientId,
      payment_schedule_id: clientScheduleMap.get(clientId) || null, // Assign the current pending installment
      visit_order: index + 1
    }));

    const { error: assignmentError } = await supabase
      .from('route_assignments')
      .insert(assignments);

    if (assignmentError) {
      // Rollback route creation
      await supabase.from('routes').delete().eq('id', route.id);
      return { data: null, error: assignmentError.message };
    }

    return { data: route, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
  }
}

export async function getAllRoutes(): Promise<{ data: RouteWithAssignments[]; error: string | null }> {
  
  try {
    const { data, error } = await supabase
      .from('routes')
      .select(`
        *,
        collector:profiles!routes_collector_id_fkey(id, full_name, email),
        assignments:route_assignments(
          id,
          client_id,
          visit_order,
          client:clients(id, name, address, phone)
        )
      `)
      .order('route_date', { ascending: false });

    if (error) {
      return { data: [], error: error.message };
    }

    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error: error instanceof Error ? error.message : 'Error desconocido' };
  }
}

export async function deleteRoute(routeId: string): Promise<{ success: boolean; error: string | null }> {
  
  try {
    // Check if route can be deleted (only pending routes)
    const { data: route } = await supabase
      .from('routes')
      .select('status')
      .eq('id', routeId)
      .single();

    if (!route) {
      return { success: false, error: 'Ruta no encontrada' };
    }

    if (route.status !== 'pending') {
      return { success: false, error: 'Solo se pueden eliminar rutas pendientes' };
    }

    const { error } = await supabase
      .from('routes')
      .delete()
      .eq('id', routeId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
  }
}

// Note: getAllCollectors function moved to collectors.ts

export async function getClientsWithActiveDebts(): Promise<{ data: ClientWithDebt[]; error: string | null }> {
  
  try {
    const { data, error } = await supabase.rpc('get_clients_with_active_debts');

    if (error) {
      return { data: [], error: error.message };
    }

    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error: error instanceof Error ? error.message : 'Error desconocido' };
  }
}

// Get collector's daily route
export async function getCollectorDailyRoute(date?: string): Promise<{ data: RouteAssignmentWithDetails[]; error: string | null }> {
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { data: [], error: 'Usuario no autenticado' };
    }

    const routeDate = date || new Date().toISOString().split('T')[0];

    // console.log('Getting collector daily route for:', { userId: user.id, routeDate });

    // Try using the database function first
    try {
      const { data: functionData, error: functionError } = await supabase.rpc('get_collector_daily_route', {
        collector_id_param: user.id,
        route_date_param: routeDate
      });

      if (!functionError && functionData && functionData.length > 0) {
        // console.log('Database function returned data:', functionData);
        
        // Transform the data to match the expected format
        const transformedData = functionData.map((item: any) => ({
          id: item.route_assignment_id,
          route_id: '', // Not provided by the function, but not needed for display
          client_id: item.client_id,
          payment_schedule_id: item.payment_schedule_id,
          visit_order: item.visit_order,
          client: {
            id: item.client_id,
            name: item.client_name,
            address: item.client_address,
            phone: item.client_phone
          },
          payment_schedule: item.payment_schedule_id ? {
            id: item.payment_schedule_id,
            due_date: new Date().toISOString().split('T')[0], // Default to today
            amount: item.amount_due,
            status: 'pending'
          } : null,
          payment: item.payment_status && item.payment_status !== 'pending' ? {
            id: '', // Not provided by function
            amount_paid: item.amount_due || 0,
            payment_status: item.payment_status,
            evidence_photo_url: null,
            notes: null,
            recorded_at: new Date().toISOString()
          } : null
        }));

        // console.log('Transformed data:', transformedData);
        return { data: transformedData, error: null };
      }
    } catch (functionErr) {
      // console.warn('Database function failed, falling back to direct query:', functionErr);
    }

    // Fallback to direct query if function fails or returns no data
    // console.log('Using fallback direct query method');
    
    // First get the route for the collector and date
    const { data: routes, error: routeError } = await supabase
      .from('routes')
      .select('id')
      .eq('collector_id', user.id)
      .eq('route_date', routeDate);

    if (routeError) {
      return { data: [], error: routeError.message };
    }

    if (!routes || routes.length === 0) {
      return { data: [], error: null }; // No route assigned for this date
    }

    const route = routes[0];
    // console.log('Found route:', route);

    // Then get the assignments with related data
    const { data: assignments, error: assignmentsError } = await supabase
      .from('route_assignments')
      .select(`
        *,
        client:clients(id, name, address, phone),
        payment_schedule:payment_schedule(id, due_date, amount, status),
        payment:payments(id, amount_paid, payment_status, evidence_photo_url, notes, recorded_at)
      `)
      .eq('route_id', route.id)
      .order('visit_order');

    if (assignmentsError) {
      return { data: [], error: assignmentsError.message };
    }

    // console.log('Direct query assignments:', assignments);
    return { data: assignments || [], error: null };

  } catch (error) {
    // console.error('Error in getCollectorDailyRoute:', error);
    return { data: [], error: error instanceof Error ? error.message : 'Error desconocido' };
  }
}

// Get collector's route progress for a specific date
export async function getCollectorRouteProgress(date?: string): Promise<{ 
  data: { 
    total: number; 
    visited: number; 
    paid: number; 
    notPaid: number; 
    absent: number;
    totalCollected: number;
    totalExpected: number;
  }; 
  error: string | null 
}> {
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { 
        data: { total: 0, visited: 0, paid: 0, notPaid: 0, absent: 0, totalCollected: 0, totalExpected: 0 }, 
        error: 'Usuario no autenticado' 
      };
    }

    const routeDate = date || new Date().toISOString().split('T')[0];

    // Get route for the date
    const { data: routes, error: routeError } = await supabase
      .from('routes')
      .select('id')
      .eq('collector_id', user.id)
      .eq('route_date', routeDate);

    if (routeError) {
      return { 
        data: { total: 0, visited: 0, paid: 0, notPaid: 0, absent: 0, totalCollected: 0, totalExpected: 0 }, 
        error: routeError.message 
      };
    }

    if (!routes || routes.length === 0) {
      return { 
        data: { total: 0, visited: 0, paid: 0, notPaid: 0, absent: 0, totalCollected: 0, totalExpected: 0 }, 
        error: null 
      };
    }

    const route = routes[0];

    // Get assignments with payment info
    const { data: assignments, error } = await supabase
      .from('route_assignments')
      .select(`
        id,
        payment_schedule_id,
        payment_schedule!inner(amount),
        payment:payments(amount_paid, payment_status)
      `)
      .eq('route_id', route.id);

    if (error) {
      return { 
        data: { total: 0, visited: 0, paid: 0, notPaid: 0, absent: 0, totalCollected: 0, totalExpected: 0 }, 
        error: error.message 
      };
    }

    const total = assignments?.length || 0;
    let visited = 0;
    let paid = 0;
    let notPaid = 0;
    let absent = 0;
    let totalCollected = 0;
    let totalExpected = 0;

    assignments?.forEach((assignment: any) => {
      // Handle payment_schedule as array (Supabase returns arrays for foreign key relationships)
      const paymentSchedule = Array.isArray(assignment.payment_schedule) 
        ? assignment.payment_schedule[0] 
        : assignment.payment_schedule;
      
      const expectedAmount = paymentSchedule?.amount || 0;
      totalExpected += expectedAmount;

      // Handle payment as array
      const payment = Array.isArray(assignment.payment) 
        ? assignment.payment[0] 
        : assignment.payment;

      if (payment) {
        visited++;
        const status = payment.payment_status;
        
        if (status === 'paid') {
          paid++;
          totalCollected += payment.amount_paid || 0;
        } else if (status === 'not_paid') {
          notPaid++;
        } else if (status === 'client_absent') {
          absent++;
        }
      }
    });

    return { 
      data: { total, visited, paid, notPaid, absent, totalCollected, totalExpected }, 
      error: null 
    };
  } catch (error) {
    return { 
      data: { total: 0, visited: 0, paid: 0, notPaid: 0, absent: 0, totalCollected: 0, totalExpected: 0 }, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    };
  }
}