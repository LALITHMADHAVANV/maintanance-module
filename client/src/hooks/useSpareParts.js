import { useState, useCallback, useEffect } from 'react';
import { sparePartsAPI } from '../services/api';
import { mockSpareParts } from '../services/mockData';
import { useAuth } from '../context/AuthContext';

export function useSpareParts() {
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  // Load parts from API with fallback to mock data
  const loadParts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await sparePartsAPI.getAll();
      setParts(res.data);
      setError(null);
    } catch (err) {
      console.warn('API fetch failed, falling back to mock data.', err);
      // Fallback to mock data if no database is connected
      if (parts.length === 0) {
        setParts(mockSpareParts);
      }
    } finally {
      setLoading(false);
    }
  }, [parts.length]);

  useEffect(() => {
    loadParts();
  }, [loadParts]);

  const addPart = useCallback(async (data) => {
    try {
      const res = await sparePartsAPI.create(data);
      setParts(prev => [res.data, ...prev]);
      return res.data;
    } catch (err) {
      console.warn('API create failed, modifying local state.', err);
      const newPart = { id: `sp_${Date.now()}`, ...data, created_at: new Date().toISOString() };
      setParts(prev => [newPart, ...prev]);
      return newPart;
    }
  }, []);

  const updatePart = useCallback(async (id, data) => {
    try {
      const res = await sparePartsAPI.update(id, data);
      setParts(prev => prev.map(p => p.id === id ? res.data : p));
      return res.data;
    } catch (err) {
      console.warn('API update failed, modifying local state.', err);
      setParts(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
      return data;
    }
  }, []);

  const restockPart = useCallback(async (id, restockData) => {
    try {
      const res = await sparePartsAPI.restock(id, restockData);
      setParts(prev => prev.map(p => p.id === id ? res.data.part : p));
      return res.data;
    } catch (err) {
      console.warn('API restock failed, modifying local state.', err);
      // Mock logic for restocking
      let updatedPart = null;
      setParts(prev => prev.map(p => {
        if (p.id === id) {
          updatedPart = { 
            ...p, 
            quantity: p.quantity + Number(restockData.quantity_received),
            last_restocked_date: new Date().toISOString(),
            last_restocked_by: user?.id,
            restock_count: (p.restock_count || 0) + 1
          };
          return updatedPart;
        }
        return p;
      }));
      
      // Save mock history to localStorage for the session
      const historyKey = `mock_restock_history_${id}`;
      const existingHistory = JSON.parse(localStorage.getItem(historyKey) || '[]');
      existingHistory.unshift({
        id: `rh_${Date.now()}`,
        part_id: id,
        quantity_received: Number(restockData.quantity_received),
        quantity_before: updatedPart.quantity - Number(restockData.quantity_received),
        quantity_after: updatedPart.quantity,
        received_from: restockData.received_from,
        received_by_name: user?.name,
        received_date: new Date().toISOString(),
        notes: restockData.notes
      });
      localStorage.setItem(historyKey, JSON.stringify(existingHistory));

      return { success: true, part: updatedPart };
    }
  }, [user]);

  const getRestockHistory = useCallback(async (id) => {
    try {
      const res = await sparePartsAPI.getRestockHistory(id);
      return res.data;
    } catch (err) {
      console.warn('API history fetch failed, returning local mock history.', err);
      const historyKey = `mock_restock_history_${id}`;
      return JSON.parse(localStorage.getItem(historyKey) || '[]');
    }
  }, []);

  const usePart = useCallback((id, qty) => {
    // Local state only for this mock deduction since API patch wasn't fully wired for this demo hook
    setParts(prev => prev.map(p => 
      p.id === id ? { ...p, quantity: Math.max(0, p.quantity - qty) } : p
    ));
  }, []);

  return {
    parts,
    loading,
    error,
    addPart,
    updatePart,
    restockPart,
    getRestockHistory,
    usePart,
    refreshParts: loadParts
  };
}
