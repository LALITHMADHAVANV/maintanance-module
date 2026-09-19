import { useState, useCallback, useMemo, useEffect } from 'react';
import { machinesAPI } from '../services/api';
import { mockMachines } from '../services/mockData';

export function useMachines() {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const loadMachines = useCallback(async () => {
    try {
      setLoading(true);
      const res = await machinesAPI.getAll();
      setMachines(res.data || []);
    } catch (err) {
      console.warn('API fetch failed, falling back to local data.', err);
      if (machines.length === 0) {
        // Fallback: try localStorage, otherwise use mockData
        const localData = localStorage.getItem('mock_machines');
        if (localData) {
          setMachines(JSON.parse(localData));
        } else {
          setMachines(mockMachines);
          localStorage.setItem('mock_machines', JSON.stringify(mockMachines));
        }
      }
    } finally {
      setLoading(false);
    }
  }, [machines.length]);

  useEffect(() => {
    loadMachines();
  }, [loadMachines]);

  const filteredMachines = useMemo(() => {
    return machines.filter(m => {
      const matchSearch = !search ||
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        (m.brand && m.brand.toLowerCase().includes(search.toLowerCase())) ||
        (m.model && m.model.toLowerCase().includes(search.toLowerCase())) ||
        (m.location && m.location.toLowerCase().includes(search.toLowerCase()));
      const matchType = filterType === 'all' || m.machine_type === filterType;
      const matchStatus = filterStatus === 'all' || m.status === filterStatus;
      return matchSearch && matchType && matchStatus;
    });
  }, [machines, search, filterType, filterStatus]);

  const getMachineById = useCallback((id) => {
    return machines.find(m => m.id === id);
  }, [machines]);

  const addMachine = useCallback(async (machineData) => {
    try {
      const res = await machinesAPI.create(machineData);
      setMachines(prev => [res.data, ...prev]);
      return res.data;
    } catch (err) {
      console.warn('API create failed, modifying local state.', err);
      const newMachine = {
        id: `mch_${Date.now()}`,
        ...machineData,
        created_at: new Date().toISOString(),
      };
      setMachines(prev => {
        const next = [newMachine, ...prev];
        localStorage.setItem('mock_machines', JSON.stringify(next));
        return next;
      });
      return newMachine;
    }
  }, []);

  const updateMachine = useCallback(async (id, data) => {
    try {
      const res = await machinesAPI.update(id, data);
      setMachines(prev => prev.map(m => m.id === id ? res.data : m));
    } catch (err) {
      console.warn('API update failed, modifying local state.', err);
      setMachines(prev => {
        const next = prev.map(m => m.id === id ? { ...m, ...data } : m);
        localStorage.setItem('mock_machines', JSON.stringify(next));
        return next;
      });
    }
  }, []);

  const deleteMachine = useCallback(async (id) => {
    try {
      await machinesAPI.delete(id);
      setMachines(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      console.warn('API delete failed, modifying local state.', err);
      setMachines(prev => {
        const next = prev.filter(m => m.id !== id);
        localStorage.setItem('mock_machines', JSON.stringify(next));
        return next;
      });
    }
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
    refreshMachines: loadMachines
  };
}
