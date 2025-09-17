// Client-side database operations for client management
import { supabase } from './client';
import type { Client, CreateClientForm } from '../types';

export interface ClientsResponse {
  data: Client[] | null;
  error: string | null;
}

export interface ClientResponse {
  data: Client | null;
  error: string | null;
}

export interface DeleteResponse {
  success: boolean;
  error: string | null;
}

// Get all clients with optional search
export async function getClients(searchTerm?: string): Promise<ClientsResponse> {
  try {
    let query = supabase
      .from('clients')
      .select('*')
      .order('name');

    if (searchTerm && searchTerm.trim()) {
      const term = `%${searchTerm.trim()}%`;
      query = query.or(`name.ilike.${term},address.ilike.${term},phone.ilike.${term}`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching clients:', error);
      return { data: null, error: error.message };
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Unexpected error fetching clients:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Error inesperado al obtener clientes' 
    };
  }
}

// Get a single client by ID
export async function getClient(id: string): Promise<ClientResponse> {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching client:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error fetching client:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Error inesperado al obtener cliente' 
    };
  }
}

// Create a new client
export async function createClient(clientData: CreateClientForm): Promise<ClientResponse> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { data: null, error: 'Usuario no autenticado' };
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
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error creating client:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Error inesperado al crear cliente' 
    };
  }
}

// Update an existing client
export async function updateClient(id: string, clientData: Partial<CreateClientForm>): Promise<ClientResponse> {
  try {
    const { data, error } = await supabase
      .from('clients')
      .update({
        ...clientData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating client:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error updating client:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Error inesperado al actualizar cliente' 
    };
  }
}

// Delete a client
export async function deleteClient(id: string): Promise<DeleteResponse> {
  try {
    // First check if client has any debts
    const { data: debts, error: debtsError } = await supabase
      .from('debts')
      .select('id')
      .eq('client_id', id)
      .limit(1);

    if (debtsError) {
      console.error('Error checking client debts:', debtsError);
      return { success: false, error: debtsError.message };
    }

    if (debts && debts.length > 0) {
      return { 
        success: false, 
        error: 'No se puede eliminar el cliente porque tiene deudas asociadas' 
      };
    }

    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting client:', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Unexpected error deleting client:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error inesperado al eliminar cliente' 
    };
  }
}

// Get clients count for dashboard
export async function getClientsCount(): Promise<{ count: number; error: string | null }> {
  try {
    const { count, error } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Error getting clients count:', error);
      return { count: 0, error: error.message };
    }

    return { count: count || 0, error: null };
  } catch (error) {
    console.error('Unexpected error getting clients count:', error);
    return { 
      count: 0, 
      error: error instanceof Error ? error.message : 'Error inesperado al contar clientes' 
    };
  }
}