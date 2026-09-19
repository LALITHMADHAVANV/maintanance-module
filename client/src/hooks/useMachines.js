import { useState, useCallback, useMemo } from 'react';
import { mockMachines } from '../services/mockData';

export function useMachines() {
  const [machines, setMachines] = useState(mockMachines);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredMachines = useMemo(() => {
    return machines.filter(m => {
      const matchSearch = !search ||
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.brand.toLowerCase().includes(search.toLowerCase()) ||
        m.model.toLowerCase().includes(search.toLowerCase()) ||
        m.location.toLowerCase().includes(search.toLowerCase());
      const matchType = filterType === 'all' || m.machine_type === filterType;
      const matchStatus = filterStatus === 'all' || m.status === filterStatus;
      return matchSearch && matchType && matchStatus;
    });
  }, [machines, search, filterType, filterStatus]);

  const getMachineById = useCallback((id) => {
    return machines.find(m => m.id === id);
  }, [machines]);

  const addMachine = useCallback((machineData) => {
    const newMachine = {
      id: `mch_${Date.now()}`,
      ...machineData,
      created_at: new Date().toISOString(),
    };
    setMachines(prev => [newMachine, ...prev]);
    return newMachine;
  }, []);

  const updateMachine = useCallback((id, data) => {
    setMachines(prev =>
      prev.map(m => m.id === id ? { ...m, ...data } : m)
    );
  }, []);

  const deleteMachine = useCallback((id) => {
    setMachines(prev => prev.filter(m => m.id !== id));
  }, []);

  const stats = useMemo(() => ({
    total: machines.length,
    active: machines.filter(m => m.status === 'active').length,
    inactive: machines.filter(m => m.status === 'inactive').length,
    maintenance: machines.filter(m => m.status === 'maintenance').length,
    byType: machines.reduce((acc, m) => {
      acc[m.machine_type] = (acc[m.machine_type] || 0) + 1;
      return acc;
    }, {}),
  }), [machines]);

  return {
    machines: filteredMachines,
    allMachines: machines,
    loading,
    search, setSearch,
    filterType, setFilterType,
    filterStatus, setFilterStatus,
    getMachineById,
    addMachine,
    updateMachine,
    deleteMachine,
    stats,
  };
}
