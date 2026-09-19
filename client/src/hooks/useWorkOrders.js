import { useState, useCallback, useMemo } from 'react';
import { mockWorkOrders } from '../services/mockData';

export function useWorkOrders() {
  const [workOrders, setWorkOrders] = useState(mockWorkOrders);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  const filteredOrders = useMemo(() => {
    return workOrders.filter(wo => {
      const matchSearch = !search ||
        wo.issue_reported.toLowerCase().includes(search.toLowerCase()) ||
        wo.machine_name?.toLowerCase().includes(search.toLowerCase()) ||
        wo.technician_name?.toLowerCase().includes(search.toLowerCase()) ||
        wo.id.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === 'all' || wo.status === filterStatus;
      const matchPriority = filterPriority === 'all' || wo.priority === filterPriority;
      return matchSearch && matchStatus && matchPriority;
    });
  }, [workOrders, search, filterStatus, filterPriority]);

  const getById = useCallback((id) => {
    return workOrders.find(wo => wo.id === id);
  }, [workOrders]);

  const addWorkOrder = useCallback((data) => {
    const newWO = {
      id: `wo_${Date.now()}`,
      status: 'pending',
      priority: data.priority || 'medium',
      waiting_time_minutes: 0,
      fixing_time_minutes: null,
      cost: null,
      created_at: new Date().toISOString(),
      started_at: null,
      completed_at: null,
      ...data,
    };
    setWorkOrders(prev => [newWO, ...prev]);
    return newWO;
  }, []);

  const updateWorkOrder = useCallback((id, data) => {
    setWorkOrders(prev =>
      prev.map(wo => wo.id === id ? { ...wo, ...data } : wo)
    );
  }, []);

  const updateStatus = useCallback((id, status) => {
    setWorkOrders(prev =>
      prev.map(wo => {
        if (wo.id !== id) return wo;
        const updates = { status };
        if (status === 'in_progress' && !wo.started_at) {
          updates.started_at = new Date().toISOString();
          updates.waiting_time_minutes = Math.round(
            (Date.now() - new Date(wo.created_at).getTime()) / 60000
          );
        }
        if (status === 'completed' && !wo.completed_at) {
          updates.completed_at = new Date().toISOString();
          if (wo.started_at) {
            updates.fixing_time_minutes = Math.round(
              (Date.now() - new Date(wo.started_at).getTime()) / 60000
            );
          }
        }
        return { ...wo, ...updates };
      })
    );
  }, []);

  const deleteWorkOrder = useCallback((id) => {
    setWorkOrders(prev => prev.filter(wo => wo.id !== id));
  }, []);

  const stats = useMemo(() => {
    const completed = workOrders.filter(wo => wo.status === 'completed');
    const totalDowntime = completed.reduce((sum, wo) =>
      sum + (wo.waiting_time_minutes || 0) + (wo.fixing_time_minutes || 0), 0);
    const totalCost = completed.reduce((sum, wo) => sum + (wo.cost || 0), 0);

    return {
      total: workOrders.length,
      pending: workOrders.filter(wo => wo.status === 'pending').length,
      inProgress: workOrders.filter(wo => wo.status === 'in_progress').length,
      completed: completed.length,
      cancelled: workOrders.filter(wo => wo.status === 'cancelled').length,
      totalDowntimeHours: Math.round(totalDowntime / 60),
      totalCost,
      avgFixingTime: completed.length > 0
        ? Math.round(completed.reduce((s, wo) => s + (wo.fixing_time_minutes || 0), 0) / completed.length)
        : 0,
    };
  }, [workOrders]);

  const getByMachine = useCallback((machineId) => {
    return workOrders.filter(wo => wo.machine_id === machineId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [workOrders]);

  return {
    workOrders: filteredOrders,
    allWorkOrders: workOrders,
    loading,
    search, setSearch,
    filterStatus, setFilterStatus,
    filterPriority, setFilterPriority,
    getById,
    addWorkOrder,
    updateWorkOrder,
    updateStatus,
    deleteWorkOrder,
    stats,
    getByMachine,
  };
}
