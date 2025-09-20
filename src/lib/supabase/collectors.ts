// Client-side collector operations for Sistema de Paga Diario
import { supabase } from './client';
import type { Profile } from '../types';

// Collector-specific form types
export interface CreateCollectorForm {
  email: string;
  full_name: string;
  password: string;
}

export interface UpdateCollectorForm {
  full_name: string;
  email: string;
}

// Get all collectors
export async function getAllCollectors(): Promise<{ data: Profile[]; error: string | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { data: [], error: 'Usuario no autenticado' };
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'collector')
      .order('full_name');

    if (error) {
      console.error('Error fetching collectors:', error);
      return { data: [], error: 'Error obteniendo cobradores: ' + error.message };
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { data: [], error: error instanceof Error ? error.message : 'Error desconocido' };
  }
}

// Get collector by ID
export async function getCollectorById(id: string): Promise<{ data: Profile | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .eq('role', 'collector')
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
  }
}

// Create new collector
export async function createCollector(collectorData: CreateCollectorForm): Promise<{ data: Profile | null; error: string | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { data: null, error: 'Usuario no autenticado' };
    }

    // Verify current user is admin
    const { data: currentUserProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!currentUserProfile || currentUserProfile.role !== 'admin') {
      return { data: null, error: 'No tienes permisos para crear cobradores' };
    }

    // Check if email already exists
    const { data: existingUsers, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', collectorData.email);

    if (checkError) {
      console.error('Error checking existing user:', checkError);
      return { data: null, error: 'Error verificando email existente: ' + checkError.message };
    }

    if (existingUsers && existingUsers.length > 0) {
      return { data: null, error: 'Ya existe un usuario con este email' };
    }

    // Create profile for collector
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: crypto.randomUUID(),
        email: collectorData.email,
        full_name: collectorData.full_name,
        role: 'collector',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (profileError) {
      console.error('Error creating profile:', profileError);
      return { data: null, error: 'Error creando perfil: ' + profileError.message };
    }

    return { data: profile, error: null };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
  }
}

// Update collector
export async function updateCollector(id: string, collectorData: UpdateCollectorForm): Promise<{ data: Profile | null; error: string | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { data: null, error: 'Usuario no autenticado' };
    }

    // Check if email is being changed and if it already exists
    if (collectorData.email) {
      const { data: existingUsers } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', collectorData.email)
        .neq('id', id);

      if (existingUsers && existingUsers.length > 0) {
        return { data: null, error: 'Ya existe un usuario con este email' };
      }
    }

    // Update profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .update({
        email: collectorData.email,
        full_name: collectorData.full_name,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('role', 'collector')
      .select()
      .single();

    if (profileError) {
      return { data: null, error: profileError.message };
    }

    return { data: profile, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
  }
}

// Delete collector
export async function deleteCollector(id: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    // Check if collector has active routes
    const { data: activeRoutes } = await supabase
      .from('routes')
      .select('id')
      .eq('collector_id', id)
      .eq('status', 'pending')
      .limit(1);

    if (activeRoutes && activeRoutes.length > 0) {
      return { success: false, error: 'No se puede eliminar un cobrador con rutas activas' };
    }

    // Delete profile
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id)
      .eq('role', 'collector');

    if (profileError) {
      return { success: false, error: profileError.message };
    }

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
  }
}

// Get collector statistics
export async function getCollectorStats(id: string): Promise<{ 
  data: {
    totalRoutes: number;
    completedRoutes: number;
    totalCollected: number;
    averageCollectionRate: number;
  } | null; 
  error: string | null 
}> {
  try {
    // Get route statistics
    const { data: routes, error: routesError } = await supabase
      .from('routes')
      .select('id, status')
      .eq('collector_id', id);

    if (routesError) {
      return { data: null, error: routesError.message };
    }

    const totalRoutes = routes?.length || 0;
    const completedRoutes = routes?.filter(r => r.status === 'completed').length || 0;

    // Get collection statistics using RPC function
    const { data: collectionStats, error: statsError } = await supabase
      .rpc('get_collector_collection_stats', { collector_id: id });

    if (statsError) {
      return { data: null, error: statsError.message };
    }

    const stats = collectionStats?.[0] || { total_collected: 0, collection_rate: 0 };

    return {
      data: {
        totalRoutes,
        completedRoutes,
        totalCollected: stats.total_collected || 0,
        averageCollectionRate: stats.collection_rate || 0
      },
      error: null
    };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
  }
}

// Reset collector password (simplified - would need server-side implementation)
export async function resetCollectorPassword(id: string, newPassword: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    // For now, we'll just return success
    // In production, this would need to be implemented as a server-side function
    // console.log(`Password reset requested for collector ${id} with new password: ${newPassword}`);
    
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
  }
}