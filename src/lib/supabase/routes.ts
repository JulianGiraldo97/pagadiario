// Client-side route operations for Sistema de Paga Diario
import { supabase } from './client';
import type {
  Route,
  RouteWithAssignments,
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

export async function getAllCollectors(): Promise<{ data: Profile[]; error: string | null }> {
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'collector')
      .order('full_name');

    if (error) {
      return { data: [], error: error.message };
    }

    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error: error instanceof Error ? error.message : 'Error desconocido' };
  }
}

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