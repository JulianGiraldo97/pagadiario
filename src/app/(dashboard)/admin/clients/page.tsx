'use client';

import { useState, useEffect } from 'react';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
import { toast } from 'react-hot-toast';
import ClientForm from '@/components/forms/ClientForm';
import ClientTable from '@/components/tables/ClientTable';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { getClients, createClient, updateClient, deleteClient } from '@/lib/supabase/clients';
import type { Client, CreateClientForm } from '@/lib/types';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load clients on component mount
  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    setIsLoading(true);
    const { data, error } = await getClients();
    
    if (error) {
      toast.error(`Error al cargar clientes: ${error}`);
    } else {
      setClients(data || []);
    }
    
    setIsLoading(false);
  };

  const handleCreateClient = () => {
    setSelectedClient(null);
    setIsFormModalOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setIsFormModalOpen(true);
  };

  const handleDeleteClient = (client: Client) => {
    setSelectedClient(client);
    setIsDeleteModalOpen(true);
  };

  const handleFormSubmit = async (formData: CreateClientForm) => {
    setIsSubmitting(true);
    
    try {
      if (selectedClient) {
        // Update existing client
        const { data, error } = await updateClient(selectedClient.id, formData);
        
        if (error) {
          throw new Error(error);
        }
        
        if (data) {
          setClients(prev => prev.map(client => 
            client.id === selectedClient.id ? data : client
          ));
          toast.success('Cliente actualizado exitosamente');
        }
      } else {
        // Create new client
        const { data, error } = await createClient(formData);
        
        if (error) {
          throw new Error(error);
        }
        
        if (data) {
          setClients(prev => [data, ...prev]);
          toast.success('Cliente creado exitosamente');
        }
      }
      
      setIsFormModalOpen(false);
      setSelectedClient(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error inesperado';
      toast.error(message);
      throw error; // Re-throw to let the form handle it
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedClient) return;
    
    setIsSubmitting(true);
    
    try {
      const { success, error } = await deleteClient(selectedClient.id);
      
      if (!success) {
        throw new Error(error || 'Error al eliminar cliente');
      }
      
      setClients(prev => prev.filter(client => client.id !== selectedClient.id));
      toast.success('Cliente eliminado exitosamente');
      setIsDeleteModalOpen(false);
      setSelectedClient(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error inesperado';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModals = () => {
    if (!isSubmitting) {
      setIsFormModalOpen(false);
      setIsDeleteModalOpen(false);
      setSelectedClient(null);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Gestión de Clientes</h2>
        <button 
          className="btn btn-primary"
          onClick={handleCreateClient}
          disabled={isLoading}
        >
          <i className="bi bi-plus-circle me-2"></i>
          Agregar Cliente
        </button>
      </div>
      
      <ClientTable
        clients={clients}
        onEdit={handleEditClient}
        onDelete={handleDeleteClient}
        isLoading={isLoading}
      />

      {/* Form Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={handleCloseModals}
        title={selectedClient ? 'Editar Cliente' : 'Crear Nuevo Cliente'}
        size="lg"
      >
        <ClientForm
          client={selectedClient || undefined}
          onSubmit={handleFormSubmit}
          onCancel={handleCloseModals}
          isLoading={isSubmitting}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Confirmar Eliminación"
        message={`¿Está seguro que desea eliminar al cliente "${selectedClient?.name}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={handleConfirmDelete}
        onCancel={handleCloseModals}
        isLoading={isSubmitting}
        variant="danger"
      />
    </div>
  );
}