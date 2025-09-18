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

    // Then get the assignments with related data
    const { data, error } = await supabase
      .from('route_assignments')
      .select(`
        *,
        client:clients(id, name, address, phone),
        payment_schedule:payment_schedule(id, due_date, amount, status),
        payment:payments(id, amount_paid, payment_status, evidence_photo_url, notes, recorded_at)
      `)
      .eq('route_id', route.id)
      .order('visit_order');

    if (error) {
      return { data: [], error: error.message };
    }

    return { data: data || [], error: null };
  } catch (error) {
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