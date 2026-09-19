import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Tablet, CheckCircle2, AlertTriangle, Activity, Wrench, Plus, Search,
  ClipboardCheck, PackageMinus, Save, RotateCcw, Camera, Sparkles,
  Maximize2, Minimize2, Clock, ArrowRightLeft, Check, Layers,
  Thermometer, Wind, Zap, RefreshCw, Send, CheckCircle, Flame,
  SlidersHorizontal, Radio, ShieldCheck, FileSpreadsheet, X, SwitchCamera
} from 'lucide-react';
import { mockMachines, mockUsers, PROBLEM_TYPES, mockSpareParts, mockWorkOrders } from '../services/mockData';
import { useAuth } from '../context/AuthContext';

export default function TabletEntry() {
  const { user } = useAuth();
  const isTechnician = user?.role === 'technician';
  const [activeTab, setActiveTab] = useState(user?.role === 'technician' ? 'repair' : 'issue'); // 'issue', 'inspection', 'status', 'repair', 'parts', 'new_machine'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [shift, setShift] = useState('Shift 1 (06:00 - 14:00)');
  const [selectedFloor, setSelectedFloor] = useState('All Floors');
  
  // Camera & File capture state
  const fileInputRef = useRef(null);
  const repairFileInputRef = useRef(null);
  const videoRef = useRef(null);
  const [isLiveCameraOpen, setIsLiveCameraOpen] = useState(false);
  const [cameraTarget, setCameraTarget] = useState('issue'); // 'issue' | 'repair'
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraFacingMode, setCameraFacingMode] = useState('environment'); // back camera for tablets
  const [cameraError, setCameraError] = useState(null);
  const [repairPhotoError, setRepairPhotoError] = useState(false);

  // Live state tracking
  const [machines, setMachines] = useState(mockMachines);
  const [workOrders, setWorkOrders] = useState(mockWorkOrders);
  const [spareParts, setSpareParts] = useState(mockSpareParts);
  const [recentEntries, setRecentEntries] = useState([
    {
      id: 'ent-01',
      type: 'issue',
      title: 'Needle Break on Sewing Machine 1',
      machine: 'Sewing Machine 1',
      location: 'Floor 1 - Section A',
      time: '10 mins ago',
      status: 'Reported',
      badge: 'badge-danger'
    },
    {
      id: 'ent-02',
      type: 'inspection',
      title: 'Daily Checklist & Telemetry Log',
      machine: 'Cutting Machine 5',
      location: 'Floor 2 - Section A',
      time: '24 mins ago',
      status: 'Passed (Safe)',
      badge: 'badge-success'
    },
    {
      id: 'ent-03',
      type: 'parts',
      title: '2x Needle DB×1 #14 Issued',
      machine: 'Sewing Machine 3',
      location: 'Floor 1 - Section C',
      time: '45 mins ago',
      status: 'Stock Deducted',
      badge: 'badge-info'
    }
  ]);

  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToastMessage({ text: msg, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Camera Management
  const startLiveCamera = async (target = 'issue', facing = cameraFacingMode) => {
    setCameraTarget(target);
    setCameraError(null);
    setIsLiveCameraOpen(true);
    try {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false
        });
      } catch (e) {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.error('Camera error:', err);
      setCameraError('Camera access denied or unavailable. Please use file upload or sample photos.');
    }
  };

  const stopLiveCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsLiveCameraOpen(false);
  };

  const captureFrame = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

    if (cameraTarget === 'repair') {
      setRepairForm(prev => ({ ...prev, completion_photo_url: dataUrl }));
      setRepairPhotoError(false);
      showToast('After-repair completion photo captured successfully!');
    } else {
      setIssueForm(prev => ({ ...prev, photoUrl: dataUrl }));
      showToast('Photo captured successfully from tablet camera!');
    }
    stopLiveCamera();
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setIssueForm(prev => ({ ...prev, photoUrl: reader.result }));
        showToast('Photo uploaded from device!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRepairFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setRepairForm(prev => ({ ...prev, completion_photo_url: reader.result }));
        setRepairPhotoError(false);
        showToast('After-repair photo uploaded from device!');
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (isLiveCameraOpen && videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch(() => {});
    }
  }, [isLiveCameraOpen, cameraStream]);

  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  // Toggle Fullscreen Kiosk mode
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  // -------------------------------------------------------------
  // 1. ISSUE / BREAKDOWN ENTRY FORM STATE
  // -------------------------------------------------------------
  const [issueForm, setIssueForm] = useState({
    machine_id: 'mch_001',
    problem_type: 'needle_break',
    priority: 'high',
    description: 'Needle broken during high speed stitch run on denim garment line.',
    photoUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500',
    reporter_name: user?.name || 'Supervisor Tab',
    assigned_tech_id: 'usr_006'
  });
  const [issueSearch, setIssueSearch] = useState('');

  // Auto-match specialist for chosen problem
  const matchedTechs = useMemo(() => {
    const prob = PROBLEM_TYPES.find(p => p.id === issueForm.problem_type);
    const cat = prob?.category || 'sewing';
    const technicians = mockUsers.filter(u => u.role === 'technician');
    return technicians.map(tech => {
      let score = 75;
      if (tech.online_status) score += 20;
      if (cat === 'sewing' && (tech.id === 'usr_006' || tech.id === 'usr_010')) score += 25;
      if (cat === 'cutting' && (tech.id === 'usr_007' || tech.id === 'usr_010')) score += 25;
      if (cat === 'pressing' && tech.id === 'usr_008') score += 25;
      if (cat === 'motor' && (tech.id === 'usr_006' || tech.id === 'usr_008')) score += 25;
      if (cat === 'electrical' && (tech.id === 'usr_007' || tech.id === 'usr_009')) score += 25;
      if (cat === 'dyeing' && tech.id === 'usr_009') score += 25;
      return { ...tech, score: Math.min(score, 99) };
    }).sort((a, b) => b.score - a.score);
  }, [issueForm.problem_type]);

  const handleIssueSubmit = (e) => {
    e?.preventDefault();
    const machine = machines.find(m => m.id === issueForm.machine_id);
    const prob = PROBLEM_TYPES.find(p => p.id === issueForm.problem_type);
    const assignedTech = mockUsers.find(u => u.id === issueForm.assigned_tech_id) || matchedTechs[0];

    const newWO = {
      id: `wo_${Date.now().toString().slice(-4)}`,
      machine_id: machine?.id,
      machine_name: machine?.name || 'Machine',
      machine_type: machine?.machine_type || 'sewing',
      assigned_technician: assignedTech?.id,
      technician_name: assignedTech?.name,
      issue_reported: issueForm.description || prob?.label,
      problem_type: issueForm.problem_type,
      status: 'pending',
      priority: issueForm.priority,
      waiting_time_minutes: 0,
      fixing_time_minutes: 0,
      cost: 0,
      created_at: new Date().toISOString(),
    };

    setWorkOrders(prev => [newWO, ...prev]);

    // Mark machine as maintenance
    setMachines(prev => prev.map(m => m.id === machine?.id ? { ...m, status: 'maintenance' } : m));

    // Add to tablet recent activity
    setRecentEntries(prev => [
      {
        id: `ent-${Date.now()}`,
        type: 'issue',
        title: `${prob?.label || 'Issue'} on ${machine?.name}`,
        machine: machine?.name,
        location: machine?.location,
        time: 'Just now',
        status: `${issueForm.priority.toUpperCase()} • Assigned to ${assignedTech?.name}`,
        badge: issueForm.priority === 'critical' ? 'badge-danger' : 'badge-warning'
      },
      ...prev
    ]);

    showToast(`Breakdown Ticket Created for ${machine?.name}! Auto-assigned to ${assignedTech?.name}`);
    
    // Quick reset description
    setIssueForm(prev => ({
      ...prev,
      description: '',
      photoUrl: ''
    }));
  };

  // -------------------------------------------------------------
  // 2. DAILY INSPECTION & TELEMETRY READINGS FORM STATE
  // -------------------------------------------------------------
  const [inspectForm, setInspectForm] = useState({
    machine_id: 'mch_001',
    temperature: 52, // °C
    vibration: 2.4, // mm/s
    pressure: 6.2, // bar
    rpm: 3800,
    oilLevel: 'Normal',
    checklist: {
      lintCleaned: true,
      beltTensionOk: true,
      needleBladeOk: true,
      eStopTested: true,
      lubricationDone: true,
      guardClosed: true
    },
    notes: 'Shift inspection completed. Machine running smoothly with zero abnormal noise.'
  });

  const getTempStatus = (val) => {
    if (val < 65) return { text: 'Optimal (Safe)', color: 'var(--emerald-400)', bg: 'rgba(16,185,129,0.1)' };
    if (val <= 85) return { text: 'Elevated (Monitor)', color: 'var(--amber-400)', bg: 'rgba(245,158,11,0.1)' };
    return { text: 'CRITICAL OVERHEAT', color: 'var(--red-400)', bg: 'rgba(239,68,68,0.2)' };
  };

  const getVibrationStatus = (val) => {
    if (val < 4.0) return { text: 'Normal (< 4 mm/s)', color: 'var(--emerald-400)', bg: 'rgba(16,185,129,0.1)' };
    if (val <= 7.0) return { text: 'High Vibration', color: 'var(--amber-400)', bg: 'rgba(245,158,11,0.1)' };
    return { text: 'SEVERE DANGER', color: 'var(--red-400)', bg: 'rgba(239,68,68,0.2)' };
  };

  const handleInspectionSubmit = (e) => {
    e?.preventDefault();
    const machine = machines.find(m => m.id === inspectForm.machine_id);
    const tempStat = getTempStatus(inspectForm.temperature);
    const vibStat = getVibrationStatus(inspectForm.vibration);
    const isCritical = inspectForm.temperature > 85 || inspectForm.vibration > 7.0;

    if (isCritical) {
      setMachines(prev => prev.map(m => m.id === machine?.id ? { ...m, status: 'maintenance' } : m));
    }

    setRecentEntries(prev => [
      {
        id: `ent-${Date.now()}`,
        type: 'inspection',
        title: `Telemetry Log: ${inspectForm.temperature}°C, ${inspectForm.vibration}mm/s`,
        machine: machine?.name,
        location: machine?.location,
        time: 'Just now',
        status: isCritical ? 'Critical Alert' : 'Inspection Passed',
        badge: isCritical ? 'badge-danger' : 'badge-success'
      },
      ...prev
    ]);

    showToast(`Inspection Logged for ${machine?.name}! ${isCritical ? '⚠️ Warning: Machine flagged for check.' : '✅ Values within safe parameters.'}`, isCritical ? 'error' : 'success');
  };

  // -------------------------------------------------------------
  // 3. MACHINE LIVE STATUS & LOCATION MOVER
  // -------------------------------------------------------------
  const [selectedMachineId, setSelectedMachineId] = useState('mch_001');
  const [targetLocation, setTargetLocation] = useState('Floor 1 - Section A');

  const selectedMachine = machines.find(m => m.id === selectedMachineId) || machines[0];

  const handleUpdateStatus = (status) => {
    setMachines(prev => prev.map(m => m.id === selectedMachineId ? { ...m, status } : m));
    setRecentEntries(prev => [
      {
        id: `ent-${Date.now()}`,
        type: 'status',
        title: `Status changed to ${status.toUpperCase()}`,
        machine: selectedMachine?.name,
        location: selectedMachine?.location,
        time: 'Just now',
        status: `Now ${status}`,
        badge: status === 'active' ? 'badge-success' : status === 'maintenance' ? 'badge-warning' : 'badge-danger'
      },
      ...prev
    ]);
    showToast(`${selectedMachine?.name} set to ${status.toUpperCase()}`);
  };

  const handleRelocateMachine = () => {
    setMachines(prev => prev.map(m => m.id === selectedMachineId ? { ...m, location: targetLocation } : m));
    setRecentEntries(prev => [
      {
        id: `ent-${Date.now()}`,
        type: 'status',
        title: `Transferred to ${targetLocation}`,
        machine: selectedMachine?.name,
        location: targetLocation,
        time: 'Just now',
        status: 'Relocated',
        badge: 'badge-info'
      },
      ...prev
    ]);
    showToast(`${selectedMachine?.name} moved to ${targetLocation}`);
  };

  // -------------------------------------------------------------
  // 4. WORK ORDER REPAIR LOGGING STATE
  // -------------------------------------------------------------
  const technicianWorkOrders = useMemo(() => {
    if (!isTechnician) return workOrders;
    return workOrders.filter(wo =>
      wo.assigned_technician === user?.id ||
      wo.technician_name === user?.name ||
      (user?.id === 'usr_006' && !wo.assigned_technician)
    );
  }, [workOrders, isTechnician, user]);

  const [selectedWoId, setSelectedWoId] = useState(technicianWorkOrders[0]?.id || workOrders[0]?.id || 'wo_001');
  const [repairForm, setRepairForm] = useState({
    fixing_time_minutes: 45,
    waiting_time_minutes: 15,
    cost: 450,
    action_taken: 'Replaced worn looper & timed needle bar to spec. Cleaned oil filters.',
    status: 'completed',
    completion_photo_url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=500' // Default sample completion photo
  });

  const activeWorkOrder = technicianWorkOrders.find(wo => wo.id === selectedWoId) || technicianWorkOrders[0] || workOrders[0];

  const handleRepairSubmit = (e) => {
    e?.preventDefault();
    if (!activeWorkOrder) return;

    // MANDATORY TECHNICIAN COMPLETION PHOTO VALIDATION
    if (repairForm.status === 'completed' && !repairForm.completion_photo_url) {
      setRepairPhotoError(true);
      showToast('⚠️ MANDATORY: Technician must take or attach a completion photo of the repaired machine to complete this task!', 'error');
      return;
    }

    setRepairPhotoError(false);

    setWorkOrders(prev => prev.map(wo => wo.id === selectedWoId ? {
      ...wo,
      status: repairForm.status,
      fixing_time_minutes: repairForm.fixing_time_minutes,
      waiting_time_minutes: repairForm.waiting_time_minutes,
      cost: repairForm.cost,
      action_taken: repairForm.action_taken,
      completion_photo_url: repairForm.completion_photo_url || null,
      completed_at: repairForm.status === 'completed' ? new Date().toISOString() : null
    } : wo));

    if (repairForm.status === 'completed') {
      setMachines(prev => prev.map(m => m.id === activeWorkOrder.machine_id ? { ...m, status: 'active' } : m));
    }

    setRecentEntries(prev => [
      {
        id: `ent-${Date.now()}`,
        type: 'repair',
        title: `WO ${activeWorkOrder.id} - ${repairForm.status.toUpperCase()} (${repairForm.fixing_time_minutes} min fix)`,
        machine: activeWorkOrder.machine_name,
        location: 'Shop Floor',
        time: 'Just now',
        status: `${repairForm.status.toUpperCase()} (₹${repairForm.cost})`,
        badge: 'badge-success',
        photo: repairForm.completion_photo_url || null
      },
      ...prev
    ]);

    showToast(`Work Order ${activeWorkOrder.id} successfully updated with technician photo verification! Machine restored to Active.`);
  };

  // -------------------------------------------------------------
  // 5. SPARE PARTS DEDUCTION FORM
  // -------------------------------------------------------------
  const [partForm, setPartForm] = useState({
    part_id: 'sp_001',
    quantity: 2,
    machine_id: 'mch_001',
    technician_id: 'usr_006',
    notes: 'Replaced during shift maintenance breakdown.'
  });

  const selectedPart = spareParts.find(p => p.id === partForm.part_id) || spareParts[0];

  const handlePartDeduct = (e) => {
    e?.preventDefault();
    if (!selectedPart) return;

    if (selectedPart.quantity < partForm.quantity) {
      showToast(`Cannot deduct ${partForm.quantity} — only ${selectedPart.quantity} left in inventory!`, 'error');
      return;
    }

    setSpareParts(prev => prev.map(p => p.id === partForm.part_id ? {
      ...p,
      quantity: p.quantity - partForm.quantity
    } : p));

    const machine = machines.find(m => m.id === partForm.machine_id);

    setRecentEntries(prev => [
      {
        id: `ent-${Date.now()}`,
        type: 'parts',
        title: `${partForm.quantity}x ${selectedPart.part_name} Issued`,
        machine: machine?.name,
        location: machine?.location,
        time: 'Just now',
        status: `Remaining: ${selectedPart.quantity - partForm.quantity}`,
        badge: 'badge-info'
      },
      ...prev
    ]);

    showToast(`Deducted ${partForm.quantity}x ${selectedPart.part_name} for ${machine?.name}. Remaining: ${selectedPart.quantity - partForm.quantity}`);
    setPartForm(prev => ({ ...prev, quantity: 1 }));
  };

  // -------------------------------------------------------------
  // 6. NEW MACHINE ONBOARDING FORM
  // -------------------------------------------------------------
  const [newMachineForm, setNewMachineForm] = useState({
    name: '',
    machine_type: 'sewing',
    brand: 'Juki',
    model: 'DDL-9000C',
    location: 'Floor 1 - Section A',
    status: 'active'
  });

  const handleNewMachineSubmit = (e) => {
    e?.preventDefault();
    if (!newMachineForm.name.trim()) {
      showToast('Please enter a valid machine name or ID', 'error');
      return;
    }

    const newM = {
      id: `mch_${String(machines.length + 1).padStart(3, '0')}`,
      name: newMachineForm.name,
      machine_type: newMachineForm.machine_type,
      brand: newMachineForm.brand,
      model: newMachineForm.model,
      location: newMachineForm.location,
      status: newMachineForm.status,
      purchase_date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString()
    };

    setMachines(prev => [newM, ...prev]);

    setRecentEntries(prev => [
      {
        id: `ent-${Date.now()}`,
        type: 'new_machine',
        title: `New Machine Registered: ${newM.name}`,
        machine: newM.name,
        location: newM.location,
        time: 'Just now',
        status: 'Active on Floor',
        badge: 'badge-success'
      },
      ...prev
    ]);

    showToast(`Machine ${newM.name} successfully registered to ${newM.location}!`);
    setNewMachineForm({
      name: '',
      machine_type: 'sewing',
      brand: 'Juki',
      model: 'DDL-9000C',
      location: 'Floor 1 - Section A',
      status: 'active'
    });
  };

  // Filtered machines for floor dropdowns
  const floorMachines = useMemo(() => {
    if (selectedFloor === 'All Floors') return machines;
    return machines.filter(m => m.location.includes(selectedFloor));
  }, [machines, selectedFloor]);

  return (
    <div className={`tablet-kiosk-page ${isFullscreen ? 'fullscreen-mode' : ''}`}>
      {/* Toast notification banner */}
      {toastMessage && (
        <div className={`tab-toast ${toastMessage.type === 'error' ? 'tab-toast-error' : 'tab-toast-success'}`}>
          <Sparkles size={20} />
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* TOP TABLET HEADER / STATUS BAR */}
      <header className="tablet-header">
        <div className="tab-brand">
          <div className="tab-pill-badge">
            <span className="live-dot" />
            <Tablet size={16} />
            <span>TABLET KIOSK MODE</span>
          </div>
          <div className="tab-title-group">
            <h1>Shop-Floor Data Entry Portal</h1>
            <p className="tab-subtitle">High-speed touch interface for floor technicians & supervisors</p>
          </div>
        </div>

        <div className="tab-header-controls">
          {/* Shift selector */}
          <div className="tab-control-pill">
            <Clock size={16} className="text-primary-400" />
            <select
              value={shift}
              onChange={(e) => setShift(e.target.value)}
              className="tab-select-clean"
            >
              <option value="Shift 1 (06:00 - 14:00)">Shift 1 (06:00 - 14:00)</option>
              <option value="Shift 2 (14:00 - 22:00)">Shift 2 (14:00 - 22:00)</option>
              <option value="Shift 3 (22:00 - 06:00)">Shift 3 (22:00 - 06:00)</option>
            </select>
          </div>

          {/* Floor filter */}
          <div className="tab-control-pill">
            <Layers size={16} className="text-emerald-400" />
            <select
              value={selectedFloor}
              onChange={(e) => setSelectedFloor(e.target.value)}
              className="tab-select-clean"
            >
              <option value="All Floors">All Floor Sections</option>
              <option value="Floor 1">Floor 1 (Sewing / Cutting)</option>
              <option value="Floor 2">Floor 2 (Dyeing / Pressing)</option>
              <option value="Floor 3">Floor 3 (Finishing / Packing)</option>
            </select>
          </div>

          {/* Fullscreen Kiosk toggle */}
          <button
            onClick={toggleFullscreen}
            className="tab-btn-icon"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Kiosk Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
      </header>

      {/* MAIN NAVIGATION TABS (TOUCH-OPTIMIZED OVERSIZED BUTTONS) */}
      <div className="tab-nav-bar">
        <button
          className={`tab-nav-btn ${activeTab === 'issue' ? 'active tab-btn-issue' : ''}`}
          onClick={() => setActiveTab('issue')}
        >
          <AlertTriangle size={22} />
          <div className="tab-nav-text">
            <span className="tab-nav-title">1. Report Issue</span>
            <span className="tab-nav-desc">Breakdowns & Photos</span>
          </div>
        </button>

        <button
          className={`tab-nav-btn ${activeTab === 'inspection' ? 'active tab-btn-inspection' : ''}`}
          onClick={() => setActiveTab('inspection')}
        >
          <Activity size={22} />
          <div className="tab-nav-text">
            <span className="tab-nav-title">2. Daily Telemetry</span>
            <span className="tab-nav-desc">Temp, Vibration & Checks</span>
          </div>
        </button>

        <button
          className={`tab-nav-btn ${activeTab === 'status' ? 'active tab-btn-status' : ''}`}
          onClick={() => setActiveTab('status')}
        >
          <SlidersHorizontal size={22} />
          <div className="tab-nav-text">
            <span className="tab-nav-title">3. Status & Move</span>
            <span className="tab-nav-desc">1-Tap Status & Line Transfer</span>
          </div>
        </button>

        <button
          className={`tab-nav-btn ${activeTab === 'repair' ? 'active tab-btn-repair' : ''}`}
          onClick={() => setActiveTab('repair')}
        >
          <Wrench size={22} />
          <div className="tab-nav-text">
            <span className="tab-nav-title">4. Repair Log</span>
            <span className="tab-nav-desc">Fixing Time & Complete WO</span>
          </div>
        </button>

        <button
          className={`tab-nav-btn ${activeTab === 'parts' ? 'active tab-btn-parts' : ''}`}
          onClick={() => setActiveTab('parts')}
        >
          <PackageMinus size={22} />
          <div className="tab-nav-text">
            <span className="tab-nav-title">5. Spare Parts</span>
            <span className="tab-nav-desc">Stock Issue & Deduct</span>
          </div>
        </button>

        <button
          className={`tab-nav-btn ${activeTab === 'new_machine' ? 'active tab-btn-new' : ''}`}
          onClick={() => setActiveTab('new_machine')}
        >
          <Plus size={22} />
          <div className="tab-nav-text">
            <span className="tab-nav-title">6. Add Machine</span>
            <span className="tab-nav-desc">Register New Unit</span>
          </div>
        </button>
      </div>

      {/* TABLET WORKSPACE (SPLIT LAYOUT: FORM & LIVE RECENT ENTRIES) */}
      <div className="tablet-body-grid">
        {/* LEFT COLUMN: ACTIVE DATA ENTRY MODULE */}
        <div className="tablet-form-container">
          {/* ========================================================= */}
          {/* TAB 1: QUICK ISSUE / BREAKDOWN REPORT                     */}
          {/* ========================================================= */}
          {activeTab === 'issue' && (
            <div className="tab-card animate-fadeIn">
              <div className="tab-card-header">
                <div className="tab-header-icon bg-red-500-10 text-red-400">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h2>Log Machine Breakdown / Defect</h2>
                  <p>Auto-assigns best specialist technician and attaches visual evidence</p>
                </div>
              </div>

              <form onSubmit={handleIssueSubmit} className="tab-form">
                {/* 1. SELECT MACHINE */}
                <div className="form-group">
                  <label className="tab-label">
                    <span>1. Select Machine on Floor</span>
                    <span className="text-muted text-xs">({floorMachines.length} available)</span>
                  </label>
                  <div className="tab-machine-selector">
                    <select
                      className="tab-input tab-select"
                      value={issueForm.machine_id}
                      onChange={(e) => setIssueForm({ ...issueForm, machine_id: e.target.value })}
                    >
                      {floorMachines.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.name} — {m.location} [{m.brand} {m.model}] ({m.status.toUpperCase()})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 2. DEFECT CATEGORY & PRESETS */}
                <div className="form-group">
                  <label className="tab-label">2. Problem Type & Symptoms (Touch to Select)</label>
                  <div className="tab-problem-grid">
                    {PROBLEM_TYPES.slice(0, 10).map(prob => (
                      <button
                        type="button"
                        key={prob.id}
                        className={`tab-prob-btn ${issueForm.problem_type === prob.id ? 'active' : ''}`}
                        onClick={() => {
                          setIssueForm(prev => ({
                            ...prev,
                            problem_type: prob.id,
                            description: prev.description || `${prob.label} detected during machine operation.`
                          }));
                        }}
                      >
                        <span className="prob-icon">{prob.icon}</span>
                        <span className="prob-label">{prob.label}</span>
                        <span className="prob-cat">{prob.category}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. URGENCY & PRIORITY LEVEL */}
                <div className="form-group">
                  <label className="tab-label">3. Urgency / Production Impact</label>
                  <div className="tab-priority-row">
                    {[
                      { id: 'low', label: 'Low (Minor)', color: 'border-slate-600', active: 'bg-slate-700 text-white' },
                      { id: 'medium', label: 'Medium (Slowdown)', color: 'border-blue-500', active: 'bg-blue-600 text-white' },
                      { id: 'high', label: 'High (Line Stoppage)', color: 'border-amber-500', active: 'bg-amber-600 text-white' },
                      { id: 'critical', label: 'CRITICAL (Safety / Fire)', color: 'border-red-500', active: 'bg-red-600 text-white' },
                    ].map(p => (
                      <button
                        type="button"
                        key={p.id}
                        className={`tab-priority-btn ${issueForm.priority === p.id ? p.active : ''}`}
                        onClick={() => setIssueForm({ ...issueForm, priority: p.id })}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. ISSUE DESCRIPTION & QUICK CHIPS */}
                <div className="form-group">
                  <label className="tab-label">4. Problem Description & Observation</label>
                  <div className="tab-chip-row">
                    {[
                      'Needle bent / skipping stitches',
                      'Bobbin case jammed with lint',
                      'Motor getting extremely hot & smoking',
                      'Steam valve blowing pressure constantly',
                      'Unusual loud clicking vibration',
                      'Fabric feeding misaligned'
                    ].map(chip => (
                      <button
                        type="button"
                        key={chip}
                        className="tab-chip"
                        onClick={() => setIssueForm(prev => ({ ...prev, description: chip }))}
                      >
                        + {chip}
                      </button>
                    ))}
                  </div>
                  <textarea
                    rows={3}
                    className="tab-input tab-textarea"
                    placeholder="Enter full issue details..."
                    value={issueForm.description}
                    onChange={(e) => setIssueForm({ ...issueForm, description: e.target.value })}
                  />
                </div>

                {/* 5. PHOTO EVIDENCE & LIVE CAMERA CAPTURE */}
                <div className="form-group">
                  <label className="tab-label">
                    <span>5. Machine Photo / Visual Evidence</span>
                    <span className="text-muted text-xs">Snap live or choose from device</span>
                  </label>

                  {/* Hidden file input for native device camera / gallery picker */}
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileInputChange}
                  />

                  {/* LIVE CAMERA VIEWFINDER */}
                  {isLiveCameraOpen && cameraTarget === 'issue' && (
                    <div className="tab-camera-viewfinder">
                      <div className="camera-video-container">
                        <video ref={videoRef} autoPlay playsInline muted className="camera-video" />
                        <div className="viewfinder-overlay">
                          <div className="viewfinder-corners" />
                          <span className="viewfinder-tag">ALIGN MACHINE DEFECT IN FRAME</span>
                        </div>
                      </div>

                      {cameraError ? (
                        <div className="camera-error-banner">
                          <AlertTriangle size={18} />
                          <span>{cameraError}</span>
                          <button
                            type="button"
                            className="btn btn-sm btn-primary"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            Upload from Device
                          </button>
                        </div>
                      ) : (
                        <div className="camera-action-controls">
                          <button
                            type="button"
                            className="camera-ctrl-btn"
                            onClick={() => {
                              const nextFacing = cameraFacingMode === 'environment' ? 'user' : 'environment';
                              setCameraFacingMode(nextFacing);
                              startLiveCamera('issue', nextFacing);
                            }}
                          >
                            <SwitchCamera size={18} />
                            <span>Flip Camera</span>
                          </button>

                          <button
                            type="button"
                            className="camera-snap-trigger"
                            onClick={captureFrame}
                            title="Take Photo"
                          >
                            <div className="snap-inner" />
                          </button>

                          <button
                            type="button"
                            className="camera-ctrl-btn camera-cancel"
                            onClick={stopLiveCamera}
                          >
                            <X size={18} />
                            <span>Cancel</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* PHOTO PREVIEW OR SELECTION BOX */}
                  {(!isLiveCameraOpen || cameraTarget !== 'issue') && (
                    <div className="tab-photo-box">
                      {issueForm.photoUrl ? (
                        <div className="tab-photo-preview">
                          <img src={issueForm.photoUrl} alt="Breakdown Preview" />
                          <div className="photo-preview-bar">
                            <button
                              type="button"
                              className="btn btn-sm btn-primary"
                              onClick={() => startLiveCamera('issue')}
                            >
                              <Camera size={14} /> Retake with Live Camera
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-secondary"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              Browse Files / Device
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-danger"
                              onClick={() => setIssueForm({ ...issueForm, photoUrl: '' })}
                            >
                              Remove Photo
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="tab-photo-placeholder">
                          <div className="tab-photo-capture-options">
                            <button
                              type="button"
                              className="tab-capture-main-btn"
                              onClick={() => startLiveCamera('issue')}
                            >
                              <div className="capture-icon-bubble">
                                <Camera size={28} />
                              </div>
                              <strong>Take Photo with Camera</strong>
                              <span>Live viewfinder & snap</span>
                            </button>

                            <button
                              type="button"
                              className="tab-capture-main-btn tab-upload-btn"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              <div className="capture-icon-bubble">
                                <Plus size={28} />
                              </div>
                              <strong>Upload from Device</strong>
                              <span>Pick gallery image / camera app</span>
                            </button>
                          </div>

                          <div className="tab-preset-photos">
                            <span className="text-muted text-xs">Or choose a quick demo breakdown photo:</span>
                            <div className="tab-photo-samples">
                              <button
                                type="button"
                                className="tab-chip"
                                onClick={() => setIssueForm({ ...issueForm, photoUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500' })}
                              >
                                🧵 Sewing Needle Jam
                              </button>
                              <button
                                type="button"
                                className="tab-chip"
                                onClick={() => setIssueForm({ ...issueForm, photoUrl: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=500' })}
                              >
                                🔥 Motor Overheat
                              </button>
                              <button
                                type="button"
                                className="tab-chip"
                                onClick={() => setIssueForm({ ...issueForm, photoUrl: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=500' })}
                              >
                                💨 Steam Leak
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 6. AUTO-MATCHED SPECIALIST CONFIRMATION */}
                <div className="form-group">
                  <label className="tab-label">6. Auto-Assigned Specialist (AI Matched)</label>
                  <div className="tab-matched-spec-card">
                    <div className="avatar" style={{ background: matchedTechs[0]?.avatar_color || '#2563eb' }}>
                      {matchedTechs[0]?.name?.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="matched-info">
                      <div className="matched-name">
                        <strong>{matchedTechs[0]?.name}</strong>
                        {matchedTechs[0]?.online_status ? (
                          <span className="badge badge-success">Online on Floor</span>
                        ) : (
                          <span className="badge badge-neutral">On Standby</span>
                        )}
                      </div>
                      <div className="matched-score text-emerald-400">
                        Match Score: <strong>{matchedTechs[0]?.score}%</strong> (Skill: {matchedTechs[0]?.role})
                      </div>
                    </div>
                    <select
                      className="tab-select-clean"
                      style={{ maxWidth: '180px' }}
                      value={issueForm.assigned_tech_id}
                      onChange={(e) => setIssueForm({ ...issueForm, assigned_tech_id: e.target.value })}
                    >
                      {matchedTechs.map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({t.score}%)</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* SUBMIT BUTTON */}
                <button type="submit" className="tab-submit-btn tab-btn-danger">
                  <Send size={24} />
                  <span>SUBMIT BREAKDOWN TICKET & NOTIFY TECHNICIAN</span>
                </button>
              </form>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: DAILY INSPECTION & MACHINE TELEMETRY READINGS     */}
          {/* ========================================================= */}
          {activeTab === 'inspection' && (
            <div className="tab-card animate-fadeIn">
              <div className="tab-card-header">
                <div className="tab-header-icon bg-emerald-500-10 text-emerald-400">
                  <Activity size={24} />
                </div>
                <div>
                  <h2>Daily Inspection & Telemetry Log</h2>
                  <p>Log temperature, vibration, pressure, and preventive checklists</p>
                </div>
              </div>

              <form onSubmit={handleInspectionSubmit} className="tab-form">
                {/* SELECT MACHINE */}
                <div className="form-group">
                  <label className="tab-label">1. Machine for Shift Inspection</label>
                  <select
                    className="tab-input tab-select"
                    value={inspectForm.machine_id}
                    onChange={(e) => setInspectForm({ ...inspectForm, machine_id: e.target.value })}
                  >
                    {floorMachines.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name} — {m.location} [{m.brand} {m.model}]
                      </option>
                    ))}
                  </select>
                </div>

                {/* TELEMETRY GAUGES / SLIDERS */}
                <div className="tab-telemetry-grid">
                  {/* TEMPERATURE (°C) */}
                  <div className="telemetry-card" style={{ background: getTempStatus(inspectForm.temperature).bg }}>
                    <div className="telemetry-title">
                      <Thermometer size={20} style={{ color: getTempStatus(inspectForm.temperature).color }} />
                      <span>Motor Temperature</span>
                      <strong style={{ color: getTempStatus(inspectForm.temperature).color, marginLeft: 'auto' }}>
                        {inspectForm.temperature} °C
                      </strong>
                    </div>
                    <div className="telemetry-status" style={{ color: getTempStatus(inspectForm.temperature).color }}>
                      {getTempStatus(inspectForm.temperature).text}
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="120"
                      value={inspectForm.temperature}
                      onChange={(e) => setInspectForm({ ...inspectForm, temperature: Number(e.target.value) })}
                      className="tab-slider"
                    />
                    <div className="tab-stepper-row">
                      <button type="button" onClick={() => setInspectForm(p => ({ ...p, temperature: Math.max(20, p.temperature - 5) }))}>-5°</button>
                      <button type="button" onClick={() => setInspectForm(p => ({ ...p, temperature: 48 }))}>Set 48° (Normal)</button>
                      <button type="button" onClick={() => setInspectForm(p => ({ ...p, temperature: 78 }))}>Set 78° (Warm)</button>
                      <button type="button" onClick={() => setInspectForm(p => ({ ...p, temperature: Math.min(120, p.temperature + 5) }))}>+5°</button>
                    </div>
                  </div>

                  {/* VIBRATION (mm/s) */}
                  <div className="telemetry-card" style={{ background: getVibrationStatus(inspectForm.vibration).bg }}>
                    <div className="telemetry-title">
                      <Activity size={20} style={{ color: getVibrationStatus(inspectForm.vibration).color }} />
                      <span>Vibration Velocity</span>
                      <strong style={{ color: getVibrationStatus(inspectForm.vibration).color, marginLeft: 'auto' }}>
                        {inspectForm.vibration} mm/s
                      </strong>
                    </div>
                    <div className="telemetry-status" style={{ color: getVibrationStatus(inspectForm.vibration).color }}>
                      {getVibrationStatus(inspectForm.vibration).text}
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="15"
                      step="0.1"
                      value={inspectForm.vibration}
                      onChange={(e) => setInspectForm({ ...inspectForm, vibration: Number(e.target.value) })}
                      className="tab-slider"
                    />
                    <div className="tab-stepper-row">
                      <button type="button" onClick={() => setInspectForm(p => ({ ...p, vibration: Math.max(0, +(p.vibration - 0.5).toFixed(1)) }))}>-0.5</button>
                      <button type="button" onClick={() => setInspectForm(p => ({ ...p, vibration: 1.8 }))}>Set 1.8 (Smooth)</button>
                      <button type="button" onClick={() => setInspectForm(p => ({ ...p, vibration: 5.5 }))}>Set 5.5 (Vibrating)</button>
                      <button type="button" onClick={() => setInspectForm(p => ({ ...p, vibration: Math.min(15, +(p.vibration + 0.5).toFixed(1)) }))}>+0.5</button>
                    </div>
                  </div>

                  {/* PRESSURE (bar) */}
                  <div className="telemetry-card">
                    <div className="telemetry-title">
                      <Wind size={20} className="text-primary-400" />
                      <span>Pneumatic / Steam Pressure</span>
                      <strong className="text-primary-400" style={{ marginLeft: 'auto' }}>
                        {inspectForm.pressure} bar
                      </strong>
                    </div>
                    <input
                      type="range"
                      min="1.0"
                      max="10.0"
                      step="0.1"
                      value={inspectForm.pressure}
                      onChange={(e) => setInspectForm({ ...inspectForm, pressure: Number(e.target.value) })}
                      className="tab-slider"
                    />
                    <div className="tab-stepper-row">
                      <button type="button" onClick={() => setInspectForm(p => ({ ...p, pressure: Math.max(1, +(p.pressure - 0.5).toFixed(1)) }))}>-0.5</button>
                      <button type="button" onClick={() => setInspectForm(p => ({ ...p, pressure: 6.0 }))}>6.0 bar</button>
                      <button type="button" onClick={() => setInspectForm(p => ({ ...p, pressure: Math.min(10, +(p.pressure + 0.5).toFixed(1)) }))}>+0.5</button>
                    </div>
                  </div>

                  {/* OIL LEVEL */}
                  <div className="telemetry-card">
                    <div className="telemetry-title">
                      <Flame size={20} className="text-amber-400" />
                      <span>Lubrication Oil Reservoir</span>
                    </div>
                    <div className="tab-oil-options">
                      {['Normal', 'Low', 'Refilled', 'Critical'].map(level => (
                        <button
                          type="button"
                          key={level}
                          className={`tab-oil-btn ${inspectForm.oilLevel === level ? 'active' : ''}`}
                          onClick={() => setInspectForm({ ...inspectForm, oilLevel: level })}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* INSPECTION CHECKLIST (TOUCH TOGGLES) */}
                <div className="form-group">
                  <label className="tab-label">2. Daily Physical Checklist (Tap to Toggle)</label>
                  <div className="tab-checklist-grid">
                    {[
                      { key: 'lintCleaned', label: 'Fabric Lint & Dust Cleaned' },
                      { key: 'beltTensionOk', label: 'Motor V-Belt Tension Ok' },
                      { key: 'needleBladeOk', label: 'Needle / Cutter Blade Inspected' },
                      { key: 'eStopTested', label: 'Emergency Stop Switch Tested' },
                      { key: 'lubricationDone', label: 'Oiler Wick / Lubrication Pumped' },
                      { key: 'guardClosed', label: 'Finger Guard & Safety Shield Secure' }
                    ].map(item => (
                      <button
                        type="button"
                        key={item.key}
                        className={`tab-check-item ${inspectForm.checklist[item.key] ? 'checked' : ''}`}
                        onClick={() => setInspectForm(prev => ({
                          ...prev,
                          checklist: { ...prev.checklist, [item.key]: !prev.checklist[item.key] }
                        }))}
                      >
                        <div className="check-indicator">
                          {inspectForm.checklist[item.key] ? <Check size={18} /> : null}
                        </div>
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* NOTES */}
                <div className="form-group">
                  <label className="tab-label">3. Inspector Comments</label>
                  <textarea
                    rows={2}
                    className="tab-input tab-textarea"
                    value={inspectForm.notes}
                    onChange={(e) => setInspectForm({ ...inspectForm, notes: e.target.value })}
                  />
                </div>

                <button type="submit" className="tab-submit-btn tab-btn-success">
                  <Save size={24} />
                  <span>RECORD INSPECTION TELEMETRY TO DATABASE</span>
                </button>
              </form>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: MACHINE LIVE STATUS TOGGLE & RELOCATION            */}
          {/* ========================================================= */}
          {activeTab === 'status' && (
            <div className="tab-card animate-fadeIn">
              <div className="tab-card-header">
                <div className="tab-header-icon bg-primary-500-10 text-primary-400">
                  <SlidersHorizontal size={24} />
                </div>
                <div>
                  <h2>Quick Status & Floor Section Transfer</h2>
                  <p>1-tap switch machine status or reassign location on factory floor</p>
                </div>
              </div>

              <div className="tab-form">
                {/* SELECT MACHINE */}
                <div className="form-group">
                  <label className="tab-label">1. Choose Machine on Shop Floor</label>
                  <select
                    className="tab-input tab-select"
                    value={selectedMachineId}
                    onChange={(e) => {
                      setSelectedMachineId(e.target.value);
                      const m = machines.find(mac => mac.id === e.target.value);
                      if (m) setTargetLocation(m.location);
                    }}
                  >
                    {floorMachines.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name} — Current: {m.status.toUpperCase()} ({m.location})
                      </option>
                    ))}
                  </select>
                </div>

                {/* MACHINE CARD SUMMARY */}
                <div className="tab-machine-focus-card">
                  <div className="focus-left">
                    <h3>{selectedMachine?.name}</h3>
                    <p>{selectedMachine?.brand} {selectedMachine?.model} • Type: <strong>{selectedMachine?.machine_type}</strong></p>
                    <span className="text-muted text-xs">Current Location: {selectedMachine?.location}</span>
                  </div>
                  <div className="focus-right">
                    <span className={`badge ${selectedMachine?.status === 'active' ? 'badge-success' : selectedMachine?.status === 'maintenance' ? 'badge-warning' : 'badge-danger'}`} style={{ fontSize: '14px', padding: '6px 14px' }}>
                      STATUS: {selectedMachine?.status?.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* 1-TAP STATUS CHANGERS */}
                <div className="form-group">
                  <label className="tab-label">2. Change Status (1-Tap Fast Buttons)</label>
                  <div className="tab-status-buttons">
                    <button
                      type="button"
                      className={`tab-status-btn tab-status-active ${selectedMachine?.status === 'active' ? 'selected' : ''}`}
                      onClick={() => handleUpdateStatus('active')}
                    >
                      <CheckCircle size={28} />
                      <strong>ACTIVE / RUNNING</strong>
                      <span>Ready for production</span>
                    </button>

                    <button
                      type="button"
                      className={`tab-status-btn tab-status-maint ${selectedMachine?.status === 'maintenance' ? 'selected' : ''}`}
                      onClick={() => handleUpdateStatus('maintenance')}
                    >
                      <Wrench size={28} />
                      <strong>MAINTENANCE</strong>
                      <span>Technician working</span>
                    </button>

                    <button
                      type="button"
                      className={`tab-status-btn tab-status-inactive ${selectedMachine?.status === 'inactive' ? 'selected' : ''}`}
                      onClick={() => handleUpdateStatus('inactive')}
                    >
                      <AlertTriangle size={28} />
                      <strong>INACTIVE / STOPPED</strong>
                      <span>Power off or idle</span>
                    </button>
                  </div>
                </div>

                {/* RELOCATE MACHINE */}
                <div className="form-group">
                  <label className="tab-label">3. Relocate to Another Floor / Section</label>
                  <div className="tab-relocate-row">
                    <select
                      className="tab-input tab-select"
                      value={targetLocation}
                      onChange={(e) => setTargetLocation(e.target.value)}
                    >
                      <option value="Floor 1 - Section A">Floor 1 - Section A (Lockstitch Line 1)</option>
                      <option value="Floor 1 - Section B">Floor 1 - Section B (Overlock Line 2)</option>
                      <option value="Floor 1 - Section C">Floor 1 - Section C (Interlock Line 3)</option>
                      <option value="Floor 2 - Section A">Floor 2 - Section A (Cutting Room)</option>
                      <option value="Floor 2 - Section B">Floor 2 - Section B (Pressing & Steam)</option>
                      <option value="Floor 2 - Section C">Floor 2 - Section C (Dyeing & Wash)</option>
                      <option value="Floor 3 - Section A">Floor 3 - Section A (Finishing & Label)</option>
                      <option value="Floor 3 - Section B">Floor 3 - Section B (Packing & Export)</option>
                      <option value="Quality Lab">Quality Lab / Test Bench</option>
                      <option value="Warehouse">Warehouse Maintenance Bay</option>
                    </select>

                    <button
                      type="button"
                      className="tab-action-btn tab-btn-primary"
                      onClick={handleRelocateMachine}
                    >
                      <ArrowRightLeft size={20} />
                      <span>TRANSFER LOCATION</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: WORK ORDER REPAIR LOGGING                         */}
          {/* ========================================================= */}
          {activeTab === 'repair' && (
            <div className="tab-card animate-fadeIn">
              <div className="tab-card-header">
                <div className="tab-header-icon bg-amber-500-10 text-amber-400">
                  <Wrench size={24} />
                </div>
                <div>
                  <h2>Log Work Order Repair & Completion</h2>
                  <p>Record repair duration, waiting time, expenses, and close work orders</p>
                </div>
              </div>

              <form onSubmit={handleRepairSubmit} className="tab-form">
                {/* SELECT WORK ORDER */}
                <div className="form-group">
                  <div className="flex items-center justify-between mb-1">
                    <label className="tab-label">1. Select Assigned Work Order to Repair</label>
                    {isTechnician && (
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 font-medium">
                        Showing your assigned tasks ({technicianWorkOrders.length})
                      </span>
                    )}
                  </div>
                  {technicianWorkOrders.length === 0 ? (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-800 text-sm">
                      No open work orders currently assigned to you ({user?.name || 'Technician'}). Check back when new tasks are dispatched!
                    </div>
                  ) : (
                    <select
                      className="tab-input tab-select"
                      value={selectedWoId}
                      onChange={(e) => setSelectedWoId(e.target.value)}
                    >
                      {technicianWorkOrders.map(wo => (
                        <option key={wo.id} value={wo.id}>
                          {wo.id} — {wo.machine_name} [{wo.issue_reported?.slice(0, 35)}...] ({wo.status.toUpperCase()})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {activeWorkOrder && (
                  <div className="tab-wo-summary">
                    <div className="wo-field">
                      <span className="text-muted">Machine:</span>
                      <strong>{activeWorkOrder.machine_name}</strong>
                    </div>
                    <div className="wo-field">
                      <span className="text-muted">Issue:</span>
                      <span>{activeWorkOrder.issue_reported}</span>
                    </div>
                    <div className="wo-field">
                      <span className="text-muted">Assigned Tech:</span>
                      <strong>{activeWorkOrder.technician_name || 'Assigned'}</strong>
                    </div>
                    <div className="wo-field">
                      <span className="text-muted">Current Status:</span>
                      <span className={`badge ${activeWorkOrder.status === 'completed' ? 'badge-success' : activeWorkOrder.status === 'in_progress' ? 'badge-info' : 'badge-warning'}`}>
                        {activeWorkOrder.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                )}

                {/* FIXING TIME STEPPER */}
                <div className="form-group">
                  <label className="tab-label">2. Fixing Time Taken (Minutes)</label>
                  <div className="tab-time-stepper">
                    <div className="time-display">
                      <Clock size={24} className="text-primary-400" />
                      <span>{repairForm.fixing_time_minutes} minutes</span>
                    </div>
                    <div className="tab-chip-row">
                      {[15, 30, 45, 60, 90, 120].map(mins => (
                        <button
                          type="button"
                          key={mins}
                          className={`tab-chip ${repairForm.fixing_time_minutes === mins ? 'active' : ''}`}
                          onClick={() => setRepairForm({ ...repairForm, fixing_time_minutes: mins })}
                        >
                          {mins} mins
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* REPAIR COST & WAITING TIME */}
                <div className="tab-grid-2">
                  <div className="form-group">
                    <label className="tab-label">Waiting Time (Minutes)</label>
                    <input
                      type="number"
                      className="tab-input"
                      value={repairForm.waiting_time_minutes}
                      onChange={(e) => setRepairForm({ ...repairForm, waiting_time_minutes: Number(e.target.value) })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="tab-label">Repair / Parts Cost (₹)</label>
                    <input
                      type="number"
                      className="tab-input"
                      value={repairForm.cost}
                      onChange={(e) => setRepairForm({ ...repairForm, cost: Number(e.target.value) })}
                    />
                  </div>
                </div>

                {/* ACTION TAKEN */}
                <div className="form-group">
                  <label className="tab-label">3. Corrective Action Taken</label>
                  <div className="tab-chip-row">
                    {[
                      'Replaced broken needle & re-timed looper',
                      'Cleared thread jam from bobbin hook',
                      'Tightened loose motor V-belt pulley',
                      'Replaced blown thermal fuse on heater',
                      'Cleaned steam valve scale & gasket'
                    ].map(chip => (
                      <button
                        type="button"
                        key={chip}
                        className="tab-chip"
                        onClick={() => setRepairForm(prev => ({ ...prev, action_taken: chip }))}
                      >
                        + {chip}
                      </button>
                    ))}
                  </div>
                  <textarea
                    rows={2}
                    className="tab-input tab-textarea"
                    value={repairForm.action_taken}
                    onChange={(e) => setRepairForm({ ...repairForm, action_taken: e.target.value })}
                  />
                </div>

                {/* 4. UPDATE ORDER STATUS */}
                <div className="form-group">
                  <label className="tab-label">4. Update Order Status</label>
                  <div className="tab-priority-row">
                    {[
                      { id: 'in_progress', label: 'In Progress (Still Working)' },
                      { id: 'completed', label: 'COMPLETED (Machine Restored)' },
                    ].map(s => (
                      <button
                        type="button"
                        key={s.id}
                        className={`tab-priority-btn ${repairForm.status === s.id ? (s.id === 'completed' ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white') : ''}`}
                        onClick={() => {
                          setRepairForm({ ...repairForm, status: s.id });
                          if (s.id !== 'completed') setRepairPhotoError(false);
                        }}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. MANDATORY COMPLETION PHOTO (PROOF OF FIX) */}
                <div className={`form-group ${repairPhotoError ? 'has-error' : ''}`}>
                  <label className="tab-label">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>5. Mandatory Completion Photo (Proof of Fix)</span>
                      {repairForm.status === 'completed' && (
                        <span className="badge badge-danger" style={{ fontSize: 10, animation: 'pulse 2s infinite' }}>
                          * MANDATORY TO COMPLETE
                        </span>
                      )}
                    </div>
                    <span className="text-muted text-xs">Technician proof of repaired machine</span>
                  </label>

                  {repairPhotoError && (
                    <div className="tab-alert-warning animate-fadeIn">
                      <AlertTriangle size={20} className="text-red-400" />
                      <div>
                        <strong style={{ color: 'var(--red-400)' }}>Completion Photo Required:</strong>
                        <p style={{ margin: 0, fontSize: 13 }}>You must snap a photo with your tablet camera or upload a photo showing the machine was fixed before marking this task as COMPLETED.</p>
                      </div>
                    </div>
                  )}

                  {/* Hidden file input for native device camera / gallery picker for repair log */}
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    ref={repairFileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleRepairFileInputChange}
                  />

                  {/* LIVE CAMERA VIEWFINDER (IF ACTIVE IN REPAIR TAB) */}
                  {isLiveCameraOpen && cameraTarget === 'repair' && (
                    <div className="tab-camera-viewfinder">
                      <div className="camera-video-container">
                        <video ref={videoRef} autoPlay playsInline muted className="camera-video" />
                        <div className="viewfinder-overlay">
                          <div className="viewfinder-corners" />
                          <span className="viewfinder-tag">SNAP PROOF OF REPAIRED MACHINE</span>
                        </div>
                      </div>

                      {cameraError ? (
                        <div className="camera-error-banner">
                          <AlertTriangle size={18} />
                          <span>{cameraError}</span>
                          <button
                            type="button"
                            className="btn btn-sm btn-primary"
                            onClick={() => repairFileInputRef.current?.click()}
                          >
                            Upload from Device
                          </button>
                        </div>
                      ) : (
                        <div className="camera-action-controls">
                          <button
                            type="button"
                            className="camera-ctrl-btn"
                            onClick={() => {
                              const nextFacing = cameraFacingMode === 'environment' ? 'user' : 'environment';
                              setCameraFacingMode(nextFacing);
                              startLiveCamera('repair', nextFacing);
                            }}
                          >
                            <SwitchCamera size={18} />
                            <span>Flip Camera</span>
                          </button>

                          <button
                            type="button"
                            className="camera-snap-trigger"
                            onClick={captureFrame}
                            title="Take Completion Photo"
                          >
                            <div className="snap-inner" style={{ background: '#10b981', boxShadow: '0 0 12px #10b981' }} />
                          </button>

                          <button
                            type="button"
                            className="camera-ctrl-btn camera-cancel"
                            onClick={stopLiveCamera}
                          >
                            <X size={18} />
                            <span>Cancel</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* PHOTO PREVIEW OR SELECTION BOX */}
                  {(!isLiveCameraOpen || cameraTarget !== 'repair') && (
                    <div className={`tab-photo-box ${repairPhotoError && !repairForm.completion_photo_url ? 'photo-box-error' : ''}`}>
                      {repairForm.completion_photo_url ? (
                        <div className="tab-photo-preview">
                          <div style={{ position: 'relative' }}>
                            <img src={repairForm.completion_photo_url} alt="Repair Completion Proof" />
                            <div style={{
                              position: 'absolute', top: 12, left: 12,
                              background: 'rgba(16, 185, 129, 0.95)', color: 'white',
                              padding: '5px 12px', borderRadius: 'var(--radius-full)',
                              fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6,
                              boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                            }}>
                              <CheckCircle size={14} /> Verification Photo Attached
                            </div>
                          </div>
                          <div className="photo-preview-bar">
                            <button
                              type="button"
                              className="btn btn-sm btn-primary"
                              onClick={() => startLiveCamera('repair')}
                            >
                              <Camera size={14} /> Retake with Live Camera
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-secondary"
                              onClick={() => repairFileInputRef.current?.click()}
                            >
                              Browse Files / Device
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-danger"
                              onClick={() => setRepairForm({ ...repairForm, completion_photo_url: '' })}
                            >
                              Remove Photo
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="tab-photo-placeholder">
                          <div className="tab-photo-capture-options">
                            <button
                              type="button"
                              className="tab-capture-main-btn"
                              onClick={() => startLiveCamera('repair')}
                            >
                              <div className="capture-icon-bubble" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}>
                                <Camera size={28} />
                              </div>
                              <strong>Take Photo with Camera</strong>
                              <span>Live viewfinder & snap</span>
                            </button>

                            <button
                              type="button"
                              className="tab-capture-main-btn tab-upload-btn"
                              onClick={() => repairFileInputRef.current?.click()}
                            >
                              <div className="capture-icon-bubble" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}>
                                <Plus size={28} />
                              </div>
                              <strong>Upload from Device</strong>
                              <span>Pick gallery image / camera app</span>
                            </button>
                          </div>

                          <div className="tab-preset-photos">
                            <span className="text-muted text-xs">Or choose a quick demo repaired machine photo:</span>
                            <div className="tab-photo-samples">
                              <button
                                type="button"
                                className="tab-chip"
                                onClick={() => {
                                  setRepairForm({ ...repairForm, completion_photo_url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=500' });
                                  setRepairPhotoError(false);
                                }}
                              >
                                ✅ Fixed Needle & Clean Stitch
                              </button>
                              <button
                                type="button"
                                className="tab-chip"
                                onClick={() => {
                                  setRepairForm({ ...repairForm, completion_photo_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500' });
                                  setRepairPhotoError(false);
                                }}
                              >
                                ✅ Motor Serviced & Tested
                              </button>
                              <button
                                type="button"
                                className="tab-chip"
                                onClick={() => {
                                  setRepairForm({ ...repairForm, completion_photo_url: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=500' });
                                  setRepairPhotoError(false);
                                }}
                              >
                                ✅ Steam Valve Replaced
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <button type="submit" className="tab-submit-btn tab-btn-success">
                  <CheckCircle2 size={24} />
                  <span>LOG REPAIR & CLOSE WORK ORDER</span>
                </button>
              </form>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 5: SPARE PARTS FAST STOCK-OUT                         */}
          {/* ========================================================= */}
          {activeTab === 'parts' && (
            <div className="tab-card animate-fadeIn">
              <div className="tab-card-header">
                <div className="tab-header-icon bg-purple-500-10 text-purple-400">
                  <PackageMinus size={24} />
                </div>
                <div>
                  <h2>Issue Spare Parts / Stock-Out Entry</h2>
                  <p>Deduct parts directly used on a machine with 1-tap quantity counter</p>
                </div>
              </div>

              <form onSubmit={handlePartDeduct} className="tab-form">
                {/* SELECT SPARE PART */}
                <div className="form-group">
                  <label className="tab-label">1. Select Spare Part</label>
                  <select
                    className="tab-input tab-select"
                    value={partForm.part_id}
                    onChange={(e) => setPartForm({ ...partForm, part_id: e.target.value })}
                  >
                    {spareParts.map(sp => (
                      <option key={sp.id} value={sp.id}>
                        {sp.part_name} — In Stock: {sp.quantity} (₹{sp.unit_cost}) [{sp.supplier}]
                      </option>
                    ))}
                  </select>
                </div>

                {/* PART INFO CARD */}
                {selectedPart && (
                  <div className="tab-part-focus">
                    <div>
                      <h4>{selectedPart.part_name}</h4>
                      <p className="text-muted text-xs">Supplier: {selectedPart.supplier}</p>
                    </div>
                    <div className="part-stock-badge">
                      <span className="text-xs text-muted">Current Stock:</span>
                      <strong className={selectedPart.quantity <= selectedPart.reorder_level ? 'text-red-400' : 'text-emerald-400'} style={{ fontSize: '20px' }}>
                        {selectedPart.quantity} units
                      </strong>
                    </div>
                  </div>
                )}

                {/* QUANTITY STEPPER (OVERSIZED TOUCH BUTTONS) */}
                <div className="form-group">
                  <label className="tab-label">2. Quantity to Issue</label>
                  <div className="tab-qty-control">
                    <button
                      type="button"
                      className="tab-qty-btn"
                      onClick={() => setPartForm(p => ({ ...p, quantity: Math.max(1, p.quantity - 1) }))}
                    >
                      -
                    </button>
                    <span className="tab-qty-number">{partForm.quantity}</span>
                    <button
                      type="button"
                      className="tab-qty-btn"
                      onClick={() => setPartForm(p => ({ ...p, quantity: p.quantity + 1 }))}
                    >
                      +
                    </button>

                    <div className="tab-quick-qty">
                      {[1, 2, 5, 10].map(q => (
                        <button
                          type="button"
                          key={q}
                          className={`tab-chip ${partForm.quantity === q ? 'active' : ''}`}
                          onClick={() => setPartForm({ ...partForm, quantity: q })}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ASSIGNED MACHINE & TECH */}
                <div className="tab-grid-2">
                  <div className="form-group">
                    <label className="tab-label">Applied to Machine</label>
                    <select
                      className="tab-input tab-select"
                      value={partForm.machine_id}
                      onChange={(e) => setPartForm({ ...partForm, machine_id: e.target.value })}
                    >
                      {machines.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="tab-label">Receiving Technician</label>
                    <select
                      className="tab-input tab-select"
                      value={partForm.technician_id}
                      onChange={(e) => setPartForm({ ...partForm, technician_id: e.target.value })}
                    >
                      {mockUsers.filter(u => u.role === 'technician').map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button type="submit" className="tab-submit-btn tab-btn-primary">
                  <PackageMinus size={24} />
                  <span>DEDUCT FROM INVENTORY & RECORD USAGE</span>
                </button>
              </form>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 6: NEW MACHINE REGISTRATION                           */}
          {/* ========================================================= */}
          {activeTab === 'new_machine' && (
            <div className="tab-card animate-fadeIn">
              <div className="tab-card-header">
                <div className="tab-header-icon bg-emerald-500-10 text-emerald-400">
                  <Plus size={24} />
                </div>
                <div>
                  <h2>Register New Machine on Floor</h2>
                  <p>Quick onboarding for newly installed or relocated machines</p>
                </div>
              </div>

              <form onSubmit={handleNewMachineSubmit} className="tab-form">
                <div className="tab-grid-2">
                  <div className="form-group">
                    <label className="tab-label">Machine Name / ID *</label>
                    <input
                      type="text"
                      className="tab-input"
                      placeholder="e.g. Sewing Machine 26"
                      value={newMachineForm.name}
                      onChange={(e) => setNewMachineForm({ ...newMachineForm, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="tab-label">Machine Type</label>
                    <select
                      className="tab-input tab-select"
                      value={newMachineForm.machine_type}
                      onChange={(e) => setNewMachineForm({ ...newMachineForm, machine_type: e.target.value })}
                    >
                      <option value="sewing">Sewing</option>
                      <option value="cutting">Cutting</option>
                      <option value="pressing">Pressing</option>
                      <option value="dyeing">Dyeing</option>
                      <option value="knitting">Knitting</option>
                      <option value="embroidery">Embroidery</option>
                      <option value="finishing">Finishing</option>
                      <option value="inspection">Inspection</option>
                      <option value="packaging">Packaging</option>
                    </select>
                  </div>
                </div>

                <div className="tab-grid-2">
                  <div className="form-group">
                    <label className="tab-label">Brand</label>
                    <select
                      className="tab-input tab-select"
                      value={newMachineForm.brand}
                      onChange={(e) => setNewMachineForm({ ...newMachineForm, brand: e.target.value })}
                    >
                      <option value="Juki">Juki</option>
                      <option value="Brother">Brother</option>
                      <option value="Singer">Singer</option>
                      <option value="Pegasus">Pegasus</option>
                      <option value="Eastman">Eastman</option>
                      <option value="Naomoto">Naomoto</option>
                      <option value="Hashima">Hashima</option>
                      <option value="Fong's">Fong's</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="tab-label">Model Number</label>
                    <input
                      type="text"
                      className="tab-input"
                      placeholder="e.g. DDL-9000C"
                      value={newMachineForm.model}
                      onChange={(e) => setNewMachineForm({ ...newMachineForm, model: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="tab-label">Assigned Factory Location</label>
                  <select
                    className="tab-input tab-select"
                    value={newMachineForm.location}
                    onChange={(e) => setNewMachineForm({ ...newMachineForm, location: e.target.value })}
                  >
                    <option value="Floor 1 - Section A">Floor 1 - Section A</option>
                    <option value="Floor 1 - Section B">Floor 1 - Section B</option>
                    <option value="Floor 1 - Section C">Floor 1 - Section C</option>
                    <option value="Floor 2 - Section A">Floor 2 - Section A</option>
                    <option value="Floor 2 - Section B">Floor 2 - Section B</option>
                    <option value="Floor 3 - Section A">Floor 3 - Section A</option>
                  </select>
                </div>

                <button type="submit" className="tab-submit-btn tab-btn-success">
                  <Plus size={24} />
                  <span>REGISTER MACHINE TO SHOP FLOOR</span>
                </button>
              </form>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: LIVE TABLET ACTIVITY STREAM & FLOOR SNAPSHOT */}
        <div className="tablet-sidebar-stream">
          {/* FLOOR OVERVIEW MINI STATS */}
          <div className="tab-stream-card">
            <h3>Floor Status Snapshot</h3>
            <div className="tab-mini-stats">
              <div className="mini-stat-item bg-emerald-500-10">
                <span className="mini-num text-emerald-400">
                  {machines.filter(m => m.status === 'active').length}
                </span>
                <span className="mini-lbl">Active</span>
              </div>
              <div className="mini-stat-item bg-amber-500-10">
                <span className="mini-num text-amber-400">
                  {machines.filter(m => m.status === 'maintenance').length}
                </span>
                <span className="mini-lbl">Maintenance</span>
              </div>
              <div className="mini-stat-item bg-red-500-10">
                <span className="mini-num text-red-400">
                  {machines.filter(m => m.status === 'inactive').length}
                </span>
                <span className="mini-lbl">Inactive</span>
              </div>
            </div>
          </div>

          {/* RECENT TABLET SUBMISSIONS STREAM */}
          <div className="tab-stream-card" style={{ flex: 1 }}>
            <div className="stream-header">
              <Activity size={18} className="text-primary-400" />
              <h3>Recent Tablet Entries</h3>
              <span className="badge badge-info">{recentEntries.length} items</span>
            </div>

            <div className="tab-feed-list">
              {recentEntries.map(entry => (
                <div key={entry.id} className="tab-feed-item">
                  <div className="feed-top">
                    <strong>{entry.machine}</strong>
                    <span className="feed-time">{entry.time}</span>
                  </div>
                  <div className="feed-desc">{entry.title}</div>
                  {entry.photo && (
                    <div style={{ marginTop: 6, marginBottom: 4, position: 'relative' }}>
                      <img
                        src={entry.photo}
                        alt="Proof"
                        style={{
                          width: '100%',
                          height: '90px',
                          objectFit: 'cover',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-default)'
                        }}
                      />
                      <span style={{
                        position: 'absolute',
                        bottom: 6,
                        left: 6,
                        background: 'rgba(16, 185, 129, 0.9)',
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: 10,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}>
                        <CheckCircle size={10} /> Photo Proof Verified
                      </span>
                    </div>
                  )}
                  <div className="feed-bottom">
                    <span className="text-muted text-xs">{entry.location}</span>
                    <span className={`badge ${entry.badge}`}>{entry.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* EMBEDDED STYLES FOR TABLET KIOSK ERGONOMICS */}
      <style>{`
        .tablet-kiosk-page {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
          padding: var(--space-4);
          max-width: 1440px;
          margin: 0 auto;
          position: relative;
        }

        .fullscreen-mode {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: var(--bg-primary);
          overflow-y: auto;
          padding: var(--space-5);
          max-width: 100vw;
        }

        /* Toast */
        .tab-toast {
          position: fixed;
          top: 24px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 28px;
          border-radius: var(--radius-full);
          font-weight: 700;
          font-size: 15px;
          z-index: 10000;
          box-shadow: 0 20px 40px rgba(0,0,0,0.6);
          animation: slideDown 0.3s ease;
        }

        .tab-toast-success {
          background: linear-gradient(135deg, #059669, #10b981);
          color: white;
          border: 1px solid #34d399;
        }

        .tab-toast-error {
          background: linear-gradient(135deg, #dc2626, #ef4444);
          color: white;
          border: 1px solid #f87171;
        }

        @keyframes slideDown {
          from { transform: translate(-50%, -30px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }

        /* Tablet Header */
        .tablet-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: var(--bg-card);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-xl);
          padding: var(--space-4) var(--space-6);
          box-shadow: var(--shadow-md);
          flex-wrap: wrap;
          gap: var(--space-3);
        }

        .tab-brand {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .tab-pill-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(59, 130, 246, 0.15);
          border: 1px solid rgba(59, 130, 246, 0.3);
          color: var(--primary-400);
          padding: 3px 10px;
          border-radius: var(--radius-full);
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.5px;
          width: fit-content;
        }

        .live-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 10px #10b981;
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.7; }
        }

        .tab-title-group h1 {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--text-primary);
        }

        .tab-subtitle {
          font-size: 0.85rem;
          color: var(--text-muted);
        }

        .tab-header-controls {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .tab-control-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--bg-input);
          border: 1px solid var(--border-default);
          padding: 6px 12px;
          border-radius: var(--radius-lg);
        }

        .tab-select-clean {
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          outline: none;
        }

        .tab-btn-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          background: var(--bg-input);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .tab-btn-icon:hover {
          background: var(--primary-600);
          color: white;
          border-color: var(--primary-500);
        }

        /* Nav Bar with Large Touch Buttons */
        .tab-nav-bar {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 10px;
        }

        .tab-nav-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          background: var(--bg-card);
          border: 2px solid var(--border-default);
          border-radius: var(--radius-xl);
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          text-align: left;
        }

        .tab-nav-btn:hover {
          background: var(--bg-card-hover);
          color: var(--text-primary);
          border-color: var(--border-hover);
          transform: translateY(-2px);
        }

        .tab-nav-btn.active {
          color: white;
          border-color: var(--primary-600);
          box-shadow: 0 8px 20px -4px rgba(37, 99, 235, 0.3);
          transform: translateY(-2px);
        }

        .tab-btn-issue.active {
          background: linear-gradient(135deg, #dc2626, #b91c1c);
          border-color: #b91c1c;
          color: #ffffff;
        }

        .tab-btn-inspection.active {
          background: linear-gradient(135deg, #059669, #047857);
          border-color: #047857;
          color: #ffffff;
        }

        .tab-btn-status.active {
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          border-color: #1d4ed8;
          color: #ffffff;
        }

        .tab-btn-repair.active {
          background: linear-gradient(135deg, #d97706, #b45309);
          border-color: #b45309;
          color: #ffffff;
        }

        .tab-btn-parts.active {
          background: linear-gradient(135deg, #9333ea, #7e22ce);
          border-color: #7e22ce;
          color: #ffffff;
        }

        .tab-btn-new.active {
          background: linear-gradient(135deg, #059669, #047857);
          border-color: #047857;
          color: #ffffff;
        }

        .tab-nav-text {
          display: flex;
          flex-direction: column;
        }

        .tab-nav-title {
          font-weight: 700;
          font-size: 14px;
        }

        .tab-nav-desc {
          font-size: 11px;
          opacity: 0.7;
        }

        /* Body Grid */
        .tablet-body-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: var(--space-4);
          align-items: start;
        }

        @media (max-width: 1024px) {
          .tablet-body-grid {
            grid-template-columns: 1fr;
          }
        }

        /* Form Card */
        .tab-card {
          background: var(--bg-card);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-2xl);
          padding: var(--space-6);
          box-shadow: var(--shadow-xl);
        }

        .tab-card-header {
          display: flex;
          align-items: center;
          gap: 16px;
          padding-bottom: var(--space-5);
          border-bottom: 1px solid var(--border-default);
          margin-bottom: var(--space-5);
        }

        .tab-card-header h2 {
          font-size: 1.35rem;
          font-weight: 800;
        }

        .tab-card-header p {
          font-size: 0.85rem;
          color: var(--text-muted);
        }

        .tab-header-icon {
          width: 52px;
          height: 52px;
          border-radius: var(--radius-xl);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .bg-red-500-10 { background: rgba(239, 68, 68, 0.15); }
        .bg-emerald-500-10 { background: rgba(16, 185, 129, 0.15); }
        .bg-primary-500-10 { background: rgba(59, 130, 246, 0.15); }
        .bg-amber-500-10 { background: rgba(245, 158, 11, 0.15); }
        .bg-purple-500-10 { background: rgba(168, 85, 247, 0.15); }

        .tab-form {
          display: flex;
          flex-direction: column;
          gap: var(--space-5);
        }

        .tab-label {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: 700;
          font-size: 14px;
          color: var(--text-secondary);
          margin-bottom: 8px;
        }

        .tab-input {
          width: 100%;
          background: var(--bg-input);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
          padding: 14px 16px;
          color: var(--text-primary);
          font-size: 15px;
          font-weight: 500;
          outline: none;
          transition: border-color var(--transition-fast);
        }

        .tab-input:focus {
          border-color: var(--primary-500);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
        }

        .tab-select {
          cursor: pointer;
        }

        .tab-textarea {
          resize: vertical;
          min-height: 80px;
        }

        /* Problem Grid */
        .tab-problem-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
          gap: 8px;
        }

        .tab-prob-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 12px 8px;
          background: var(--bg-input);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .tab-prob-btn:hover {
          background: var(--bg-card-hover);
          color: var(--text-primary);
        }

        .tab-prob-btn.active {
          background: rgba(239, 68, 68, 0.2);
          border-color: #ef4444;
          color: white;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
        }

        .prob-icon {
          font-size: 24px;
          margin-bottom: 4px;
        }

        .prob-label {
          font-weight: 700;
          font-size: 12px;
          text-align: center;
        }

        .prob-cat {
          font-size: 10px;
          color: var(--text-muted);
          text-transform: uppercase;
        }

        /* Priority Row */
        .tab-priority-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 8px;
        }

        .tab-priority-btn {
          padding: 12px 8px;
          border-radius: var(--radius-lg);
          background: var(--bg-input);
          border: 1px solid var(--border-default);
          color: var(--text-secondary);
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          transition: all var(--transition-fast);
          text-align: center;
        }

        .tab-priority-btn:hover {
          background: var(--bg-card-hover);
          color: var(--text-primary);
        }

        /* Chip Row */
        .tab-chip-row {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 8px;
        }

        .tab-chip {
          padding: 6px 12px;
          background: var(--bg-card);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-full);
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .tab-chip:hover, .tab-chip.active {
          background: var(--primary-600);
          color: white;
          border-color: var(--primary-600);
        }

        /* Photo Box & Camera Viewfinder */
        .tab-photo-box {
          border: 2px dashed var(--border-default);
          border-radius: var(--radius-xl);
          padding: 16px;
          background: var(--bg-input);
          transition: all var(--transition-fast);
        }

        .photo-box-error {
          border-color: #ef4444 !important;
          background: rgba(239, 68, 68, 0.05) !important;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
        }

        .tab-alert-warning {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 18px;
          border-radius: var(--radius-lg);
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.4);
          color: var(--text-primary);
          margin-bottom: 12px;
        }

        .tab-camera-viewfinder {
          display: flex;
          flex-direction: column;
          gap: 12px;
          background: #020617;
          border-radius: var(--radius-xl);
          padding: 16px;
          border: 2px solid var(--primary-500);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
        }

        .camera-video-container {
          position: relative;
          width: 100%;
          height: 320px;
          background: #000;
          border-radius: var(--radius-lg);
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .camera-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .viewfinder-overlay {
          position: absolute;
          inset: 16px;
          border: 1px dashed rgba(255, 255, 255, 0.4);
          border-radius: var(--radius-md);
          pointer-events: none;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding-bottom: 12px;
        }

        .viewfinder-tag {
          background: rgba(0, 0, 0, 0.65);
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.5px;
          padding: 4px 10px;
          border-radius: var(--radius-full);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .camera-action-controls {
          display: flex;
          align-items: center;
          justify-content: space-around;
          padding-top: 8px;
        }

        .camera-snap-trigger {
          width: 68px;
          height: 68px;
          border-radius: 50%;
          border: 4px solid #ffffff;
          background: rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .camera-snap-trigger:hover {
          transform: scale(1.08);
          background: rgba(255, 255, 255, 0.35);
        }

        .camera-snap-trigger:active {
          transform: scale(0.95);
        }

        .snap-inner {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: #ef4444;
          box-shadow: 0 0 12px #ef4444;
        }

        .camera-ctrl-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 16px;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: var(--radius-full);
          color: white;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .camera-ctrl-btn:hover {
          background: rgba(255, 255, 255, 0.25);
        }

        .camera-cancel:hover {
          background: rgba(239, 68, 68, 0.4);
          border-color: #ef4444;
        }

        .camera-error-banner {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 16px;
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid #ef4444;
          border-radius: var(--radius-lg);
          color: #fca5a5;
          text-align: center;
          font-size: 13px;
        }

        .tab-photo-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
        }

        .tab-photo-capture-options {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          width: 100%;
        }

        @media (max-width: 640px) {
          .tab-photo-capture-options {
            grid-template-columns: 1fr;
          }
        }

        .tab-capture-main-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 20px 16px;
          background: var(--bg-card);
          border: 2px solid var(--border-default);
          border-radius: var(--radius-xl);
          color: var(--text-primary);
          cursor: pointer;
          transition: all var(--transition-base);
          box-shadow: var(--shadow-sm);
        }

        .tab-capture-main-btn:hover {
          border-color: var(--primary-500);
          background: rgba(37, 99, 235, 0.05);
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .capture-icon-bubble {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--primary-600), var(--primary-700));
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 4px;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
        }

        .tab-upload-btn .capture-icon-bubble {
          background: linear-gradient(135deg, var(--emerald-600), var(--emerald-700));
          box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);
        }

        .tab-capture-main-btn strong {
          font-size: 15px;
        }

        .tab-capture-main-btn span {
          font-size: 12px;
          color: var(--text-muted);
        }

        .tab-preset-photos {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          width: 100%;
          padding-top: 6px;
        }

        .tab-photo-samples {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .tab-photo-preview {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .tab-photo-preview img {
          width: 100%;
          max-height: 280px;
          object-fit: cover;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-default);
        }

        .photo-preview-bar {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        /* Matched Spec Card */
        .tab-matched-spec-card {
          display: flex;
          align-items: center;
          gap: 14px;
          background: var(--bg-input);
          border: 1px solid var(--border-default);
          padding: 12px 16px;
          border-radius: var(--radius-xl);
        }

        .matched-info {
          flex: 1;
        }

        .matched-name {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
        }

        .matched-score {
          font-size: 12px;
        }

        /* Submit Buttons */
        .tab-submit-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 18px 24px;
          border-radius: var(--radius-xl);
          font-weight: 800;
          font-size: 16px;
          letter-spacing: 0.5px;
          cursor: pointer;
          border: none;
          color: white;
          box-shadow: var(--shadow-lg);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          margin-top: 8px;
        }

        .tab-submit-btn:hover {
          transform: translateY(-2px);
          filter: brightness(1.1);
        }

        .tab-submit-btn:active {
          transform: translateY(0);
        }

        .tab-btn-danger {
          background: linear-gradient(135deg, #dc2626, #b91c1c);
        }

        .tab-btn-success {
          background: linear-gradient(135deg, #059669, #047857);
        }

        .tab-btn-primary {
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
        }

        /* Telemetry Grid */
        .tab-telemetry-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 12px;
        }

        .telemetry-card {
          background: var(--bg-input);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-xl);
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .telemetry-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 700;
        }

        .telemetry-status {
          font-size: 12px;
          font-weight: 700;
        }

        .tab-slider {
          width: 100%;
          height: 8px;
          border-radius: 4px;
          background: var(--border-default);
          outline: none;
          cursor: pointer;
        }

        .tab-stepper-row {
          display: flex;
          justify-content: space-between;
          gap: 4px;
        }

        .tab-stepper-row button {
          flex: 1;
          padding: 4px 6px;
          background: var(--bg-card);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
        }

        .tab-stepper-row button:hover {
          background: var(--primary-600);
          color: white;
          border-color: var(--primary-600);
        }

        .tab-oil-options {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 6px;
        }

        .tab-oil-btn {
          padding: 10px;
          background: var(--bg-card);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
        }

        .tab-oil-btn.active {
          background: #d97706;
          color: white;
          border-color: #f59e0b;
        }

        /* Checklist */
        .tab-checklist-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 8px;
        }

        .tab-check-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          background: var(--bg-input);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
          color: var(--text-secondary);
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          text-align: left;
          transition: all var(--transition-fast);
        }

        .tab-check-item.checked {
          background: rgba(16, 185, 129, 0.15);
          border-color: #10b981;
          color: #6ee7b7;
        }

        .check-indicator {
          width: 24px;
          height: 24px;
          border-radius: 6px;
          border: 2px solid var(--border-default);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          background: var(--bg-card);
        }

        .tab-check-item.checked .check-indicator {
          background: #10b981;
          border-color: #10b981;
        }

        /* Status Buttons */
        .tab-machine-focus-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: var(--bg-input);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-xl);
          padding: 16px 20px;
        }

        .tab-status-buttons {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 12px;
        }

        .tab-status-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 18px 12px;
          border-radius: var(--radius-xl);
          background: var(--bg-input);
          border: 2px solid var(--border-default);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .tab-status-btn:hover {
          transform: translateY(-2px);
        }

        .tab-status-active.selected {
          background: rgba(16, 185, 129, 0.2);
          border-color: #10b981;
          color: #6ee7b7;
        }

        .tab-status-maint.selected {
          background: rgba(245, 158, 11, 0.2);
          border-color: #f59e0b;
          color: #fde68a;
        }

        .tab-status-inactive.selected {
          background: rgba(239, 68, 68, 0.2);
          border-color: #ef4444;
          color: #fca5a5;
        }

        .tab-relocate-row {
          display: flex;
          gap: 10px;
        }

        .tab-action-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 20px;
          border-radius: var(--radius-lg);
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          border: none;
          color: white;
          white-space: nowrap;
        }

        /* Work Order Repair */
        .tab-wo-summary {
          background: var(--bg-input);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-xl);
          padding: 14px 18px;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 12px;
          font-size: 13px;
        }

        .wo-field {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .tab-time-stepper {
          background: var(--bg-input);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-xl);
          padding: 14px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }

        .time-display {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 18px;
          font-weight: 800;
        }

        .tab-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        @media (max-width: 640px) {
          .tab-grid-2 {
            grid-template-columns: 1fr;
          }
        }

        /* Spare Parts */
        .tab-part-focus {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: var(--bg-input);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-xl);
          padding: 14px 18px;
        }

        .tab-qty-control {
          display: flex;
          align-items: center;
          gap: 16px;
          background: var(--bg-input);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-xl);
          padding: 12px 18px;
          flex-wrap: wrap;
        }

        .tab-qty-btn {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-lg);
          background: var(--slate-700);
          border: 1px solid var(--border-default);
          color: white;
          font-size: 24px;
          font-weight: 800;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .tab-qty-btn:hover {
          background: var(--primary-600);
        }

        .tab-qty-number {
          font-size: 28px;
          font-weight: 800;
          min-width: 40px;
          text-align: center;
          color: var(--primary-400);
        }

        .tab-quick-qty {
          display: flex;
          gap: 6px;
          margin-left: auto;
        }

        /* Sidebar Stream */
        .tablet-sidebar-stream {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .tab-stream-card {
          background: var(--bg-card);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-xl);
          padding: var(--space-4);
          box-shadow: var(--shadow-md);
        }

        .tab-stream-card h3 {
          font-size: 1rem;
          font-weight: 800;
          margin-bottom: 12px;
        }

        .tab-mini-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        .mini-stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 10px 6px;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-default);
        }

        .mini-num {
          font-size: 1.4rem;
          font-weight: 800;
        }

        .mini-lbl {
          font-size: 11px;
          color: var(--text-muted);
          font-weight: 600;
        }

        .stream-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .stream-header h3 {
          margin-bottom: 0;
          flex: 1;
        }

        .tab-feed-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 520px;
          overflow-y: auto;
        }

        .tab-feed-item {
          background: var(--bg-input);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .feed-top {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
        }

        .feed-time {
          font-size: 11px;
          color: var(--text-muted);
        }

        .feed-desc {
          font-size: 12px;
          color: var(--text-secondary);
        }

        .feed-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 4px;
        }
      `}</style>
    </div>
  );
}
