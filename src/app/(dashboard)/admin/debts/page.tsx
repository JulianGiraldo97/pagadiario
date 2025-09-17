'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import DebtForm from '@/components/forms/DebtForm';
import DebtTable from '@/components/tables/DebtTable';
import PaymentScheduleModal from '@/components/ui/PaymentScheduleModal';
import { getClients } from '@/lib/supabase/clients';
import { 
  createDebtWithSchedule, 
  getAllActiveDebtsWithSchedule,
  updateDebtStatus,
  updatePaymentScheduleStatus,
  type DebtWithSchedule 
} from '@/lib/supabase/debts';
import type { Client, CreateDebtForm } from '@/lib/types';

export default function DebtsPage() {
  const [debts, setDebts] = useState<DebtWithSchedule[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<DebtWithSchedule | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [debtsData, clientsResponse] = await Promise.all([
        getAllActiveDebtsWithSchedule(),
        getClients()
      ]);
      
      const clientsData = clientsResponse.data || [];
      
      setDebts(debtsData);
      setClients(clientsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDebt = async (debtData: CreateDebtForm) => {
    setIsCreating(true);
    try {
      const newDebt = await createDebtWithSchedule(debtData);
      
      if (newDebt) {
        toast.success('Deuda creada exitosamente');
        setShowForm(false);
        await loadData(); // Reload to get updated data with relations
      } else {
        toast.error('Error al crear la deuda');
      }
    } catch (error) {
      console.error('Error creating debt:', error);
      toast.error('Error al crear la deuda');
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateDebtStatus = async (debtId: string, status: 'active' | 'completed' | 'cancelled') => {
    try {
      const success = await updateDebtStatus(debtId, status);
      
      if (success) {
        toast.success(`Deuda ${status === 'completed' ? 'completada' : 'cancelada'} exitosamente`);
        await loadData();
      } else {
        toast.error('Error al actualizar el estado de la deuda');
      }
    } catch (error) {
      console.error('Error updating debt status:', error);
      toast.error('Error al actualizar el estado de la deuda');
    }
  };

  const handleViewSchedule = (debt: DebtWithSchedule) => {
    setSelectedDebt(debt);
    setShowScheduleModal(true);
  };

  const handleUpdateScheduleStatus = async (scheduleId: string, status: 'pending' | 'paid' | 'overdue') => {
    try {
      const success = await updatePaymentScheduleStatus(scheduleId, status);
      
      if (success) {
        toast.success(`Estado actualizado a ${status === 'paid' ? 'pagado' : 'pendiente'}`);
        await loadData();
        
        // Update the selected debt for the modal
        if (selectedDebt) {
          const updatedDebts = await getAllActiveDebtsWithSchedule();
          const updatedDebt = updatedDebts.find(d => d.id === selectedDebt.id);
          if (updatedDebt) {
            setSelectedDebt(updatedDebt);
          }
        }
      } else {
        toast.error('Error al actualizar el estado del pago');
      }
    } catch (error) {
      console.error('Error updating schedule status:', error);
      toast.error('Error al actualizar el estado del pago');
    }
  };

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-0">Gestión de Deudas</h1>
          <p className="text-muted mb-0">Administra las deudas y cronogramas de pago de los clientes</p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
          disabled={isLoading}
        >
          <i className="bi bi-plus-circle me-2"></i>
          Nueva Deuda
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card bg-primary text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="card-title">Total Deudas</h6>
                  <h3 className="mb-0">{debts.length}</h3>
                </div>
                <div className="align-self-center">
                  <i className="bi bi-file-text display-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-success text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="card-title">Deudas Activas</h6>
                  <h3 className="mb-0">{debts.filter(d => d.status === 'active').length}</h3>
                </div>
                <div className="align-self-center">
                  <i className="bi bi-check-circle display-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-info text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="card-title">Monto Total</h6>
                  <h3 className="mb-0">
                    ${debts.reduce((sum, debt) => sum + debt.total_amount, 0).toFixed(2)}
                  </h3>
                </div>
                <div className="align-self-center">
                  <i className="bi bi-currency-dollar display-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-warning text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="card-title">Clientes con Deuda</h6>
                  <h3 className="mb-0">
                    {new Set(debts.filter(d => d.status === 'active').map(d => d.client_id)).size}
                  </h3>
                </div>
                <div className="align-self-center">
                  <i className="bi bi-people display-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Debt Form */}
      {showForm && (
        <div className="mb-4">
          <DebtForm
            clients={clients}
            onSubmit={handleCreateDebt}
            onCancel={() => setShowForm(false)}
            isLoading={isCreating}
          />
        </div>
      )}

      {/* Debts Table */}
      <div className="card">
        <div className="card-header">
          <h5 className="card-title mb-0">Lista de Deudas</h5>
        </div>
        <div className="card-body p-0">
          <DebtTable
            debts={debts}
            onViewSchedule={handleViewSchedule}
            onUpdateStatus={handleUpdateDebtStatus}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Payment Schedule Modal */}
      <PaymentScheduleModal
        debt={selectedDebt}
        isOpen={showScheduleModal}
        onClose={() => {
          setShowScheduleModal(false);
          setSelectedDebt(null);
        }}
        onUpdateScheduleStatus={handleUpdateScheduleStatus}
      />
    </div>
  );
}