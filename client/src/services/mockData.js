// Complete mock dataset for TextileCare Pro
// 3 supervisors, 5 technicians, 1 admin, 1 manager, 25 machines, 50 work orders, etc.

export const PROBLEM_TYPES = [
  { id: 'thread_jam', label: 'Thread Jam', icon: '🧵', category: 'stitching' },
  { id: 'needle_break', label: 'Needle Break', icon: '🪡', category: 'hardware' },
  { id: 'motor_noise', label: 'Motor Noise', icon: '⚙️', category: 'motor' },
  { id: 'motor_overheat', label: 'Motor Overheat', icon: '🔥', category: 'motor' },
  { id: 'tension_issue', label: 'Tension Issue', icon: '⚖️', category: 'stitching' },
  { id: 'skip_stitch', label: 'Skipping Stitches', icon: '➖', category: 'stitching' },
  { id: 'oil_leak', label: 'Oil Leak', icon: '💧', category: 'maintenance' },
  { id: 'pedal_fault', label: 'Pedal/Sensor Fault', icon: '⚡', category: 'electrical' },
  { id: 'belt_worn', label: 'Belt Worn', icon: '🔄', category: 'motor' },
  { id: 'vibration', label: 'Excessive Vibration', icon: '📳', category: 'motor' },
  { id: 'other', label: 'Other Issue', icon: '🔧', category: 'general' },
];

export const MACHINE_TYPES = [
  'single-needle', 'double-needle', 'overlock', 'flatlock', 
  'button-hole', 'button-attach', 'bartack', 'feed-off-arm'
];

export const LOCATIONS = [
  'Floor 1 - Line 1', 'Floor 1 - Line 2', 'Floor 1 - Line 3',
  'Floor 1 - Line 4', 'Floor 1 - Line 5', 'Floor 1 - Maintenance',
  'Floor 1 - Quality Control', 'Floor 1 - Parts Room'
];

export const BRANDS = [
  'Juki', 'Brother', 'Singer', 'Pegasus', 'Kansai',
  'Eastman', 'Hashima', 'Naomoto', 'Fong\'s', 'Thies'
];

export const mockUsers = [
  { id: 'usr_001', email: 'admin@textilecare.com', name: 'Rajesh Kumar', phone: '+91-9876543210', role: 'admin', online_status: true, avatar_color: '#2563EB', created_at: '2024-01-01' },
  { id: 'usr_002', email: 'manager@textilecare.com', name: 'Priya Sharma', phone: '+91-9876543211', role: 'manager', online_status: true, avatar_color: '#7E22CE', created_at: '2024-01-05' },
  // Supervisors
  { id: 'usr_003', email: 'supervisor1@textilecare.com', name: 'Anil Mehta', phone: '+91-9876543212', role: 'supervisor', online_status: true, avatar_color: '#059669', created_at: '2024-01-10' },
  { id: 'usr_004', email: 'supervisor2@textilecare.com', name: 'Sunita Devi', phone: '+91-9876543213', role: 'supervisor', online_status: true, avatar_color: '#D97706', created_at: '2024-01-10' },
  { id: 'usr_005', email: 'supervisor3@textilecare.com', name: 'Vikram Singh', phone: '+91-9876543214', role: 'supervisor', online_status: false, avatar_color: '#DC2626', created_at: '2024-01-15' },
  // Technicians
  { id: 'usr_006', email: 'tech1@textilecare.com', name: 'Ramesh Patel', phone: '+91-9876543215', role: 'technician', online_status: true, avatar_color: '#2563EB', created_at: '2024-01-20' },
  { id: 'usr_007', email: 'tech2@textilecare.com', name: 'Suresh Yadav', phone: '+91-9876543216', role: 'technician', online_status: true, avatar_color: '#059669', created_at: '2024-01-20' },
  { id: 'usr_008', email: 'tech3@textilecare.com', name: 'Manoj Gupta', phone: '+91-9876543217', role: 'technician', online_status: false, avatar_color: '#D97706', created_at: '2024-01-25' },
  { id: 'usr_009', email: 'tech4@textilecare.com', name: 'Deepak Joshi', phone: '+91-9876543218', role: 'technician', online_status: true, avatar_color: '#7E22CE', created_at: '2024-01-25' },
  { id: 'usr_010', email: 'tech5@textilecare.com', name: 'Kamal Nair', phone: '+91-9876543219', role: 'technician', online_status: true, avatar_color: '#DC2626', created_at: '2024-02-01' },
];

export const mockSpecialistSkills = [
  { id: 'sk_001', user_id: 'usr_006', skill_category: 'stitching', expertise_level: 'expert', machines_handled: 120 },
  { id: 'sk_002', user_id: 'usr_006', skill_category: 'motor', expertise_level: 'intermediate', machines_handled: 45 },
  { id: 'sk_003', user_id: 'usr_007', skill_category: 'hardware', expertise_level: 'expert', machines_handled: 80 },
  { id: 'sk_004', user_id: 'usr_007', skill_category: 'electrical', expertise_level: 'expert', machines_handled: 60 },
  { id: 'sk_005', user_id: 'usr_008', skill_category: 'maintenance', expertise_level: 'expert', machines_handled: 95 },
  { id: 'sk_006', user_id: 'usr_008', skill_category: 'motor', expertise_level: 'expert', machines_handled: 75 },
  { id: 'sk_007', user_id: 'usr_009', skill_category: 'stitching', expertise_level: 'expert', machines_handled: 110 },
  { id: 'sk_008', user_id: 'usr_009', skill_category: 'electrical', expertise_level: 'intermediate', machines_handled: 30 },
  { id: 'sk_009', user_id: 'usr_010', skill_category: 'maintenance', expertise_level: 'intermediate', machines_handled: 50 },
  { id: 'sk_010', user_id: 'usr_010', skill_category: 'hardware', expertise_level: 'intermediate', machines_handled: 35 },
  { id: 'sk_011', user_id: 'usr_010', skill_category: 'motor', expertise_level: 'beginner', machines_handled: 15 },
];

function generateMachines() {
  const machines = [];
  const types = ['single-needle', 'double-needle', 'overlock', 'flatlock', 'button-hole', 'button-attach', 'bartack', 'feed-off-arm'];
  const models = {
    'single-needle': ['DDL-8700', 'S-7220C', 'GC6150M'],
    'double-needle': ['LH-3588A', 'T828', 'LT2-B835'],
    'overlock': ['MO-6816S', 'EX5200', 'Pegasus M900'],
    'flatlock': ['MF-7923', 'W500', 'Kansai NW'],
    'button-hole': ['LBH-1790A', 'HE-800A', 'MEB-3200'],
    'button-attach': ['MB-1377', 'BE-438D', 'LK-1903'],
    'bartack': ['LK-1900', 'KE-430F', 'Siruba BT'],
    'feed-off-arm': ['MS-1190', 'Yamato V', 'Kansai DLR']
  };
  const statuses = ['active', 'active', 'active', 'active', 'active', 'inactive', 'maintenance'];

  for (let i = 0; i < 25; i++) {
    const type = types[i % types.length];
    const modelList = models[type];
    const brandIndex = i % BRANDS.length;
    machines.push({
      id: `mch_${String(i + 1).padStart(3, '0')}`,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} Machine ${i + 1}`,
      machine_type: type,
      location: LOCATIONS[i % LOCATIONS.length],
      purchase_date: `202${Math.floor(i / 10)}-${String((i % 12) + 1).padStart(2, '0')}-15`,
      status: statuses[i % statuses.length],
      brand: BRANDS[brandIndex],
      model: modelList[i % modelList.length],
      created_at: '2024-01-01',
    });
  }
  return machines;
}

export const mockMachines = generateMachines();

function generateWorkOrders() {
  const orders = [];
  const statuses = ['completed', 'completed', 'completed', 'in_progress', 'in_progress', 'pending', 'pending', 'cancelled'];
  const problems = PROBLEM_TYPES;
  const techIds = ['usr_006', 'usr_007', 'usr_008', 'usr_009', 'usr_010'];
  const supervisorIds = ['usr_003', 'usr_004', 'usr_005'];

  for (let i = 0; i < 50; i++) {
    const status = statuses[i % statuses.length];
    const machineIdx = i % 25;
    const problem = problems[i % problems.length];
    const waitingTime = Math.floor(Math.random() * 120) + 5;
    const fixingTime = status === 'completed' ? Math.floor(Math.random() * 240) + 15 : null;
    const cost = status === 'completed' ? Math.floor(Math.random() * 5000) + 200 : null;
    const createdDate = new Date(2024, Math.floor(i / 5), (i % 28) + 1);
    const startedDate = status !== 'pending' ? new Date(createdDate.getTime() + waitingTime * 60000) : null;
    const completedDate = status === 'completed' ? new Date(startedDate.getTime() + fixingTime * 60000) : null;

    orders.push({
      id: `wo_${String(i + 1).padStart(3, '0')}`,
      machine_id: mockMachines[machineIdx].id,
      machine_name: mockMachines[machineIdx].name,
      machine_type: mockMachines[machineIdx].machine_type,
      assigned_technician: techIds[i % techIds.length],
      technician_name: mockUsers.find(u => u.id === techIds[i % techIds.length])?.name,
      reported_by: supervisorIds[i % supervisorIds.length],
      reporter_name: mockUsers.find(u => u.id === supervisorIds[i % supervisorIds.length])?.name,
      issue_reported: `${problem.icon} ${problem.label} — Machine ${mockMachines[machineIdx].name} requires attention.`,
      problem_type: problem.id,
      problem_category: problem.category,
      status,
      priority: i % 5 === 0 ? 'critical' : i % 3 === 0 ? 'high' : i % 2 === 0 ? 'medium' : 'low',
      waiting_time_minutes: waitingTime,
      fixing_time_minutes: fixingTime,
      cost,
      created_at: createdDate.toISOString(),
      started_at: startedDate?.toISOString() || null,
      completed_at: completedDate?.toISOString() || null,
    });
  }
  return orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export const mockWorkOrders = generateWorkOrders();

export const mockMessages = [
  {
    id: 'msg_001', sender_id: 'usr_003', receiver_id: 'usr_006', work_order_id: 'wo_001',
    message_type: 'assignment', content: '🧵 Thread jam on Sewing Machine 1. Please check and fix ASAP.',
    has_image: true, is_read: true, created_at: '2024-06-15T09:30:00Z',
    sender_name: 'Anil Mehta', sender_role: 'supervisor',
    image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400',
  },
  {
    id: 'msg_002', sender_id: 'usr_006', receiver_id: 'usr_003', work_order_id: 'wo_001',
    message_type: 'update', content: 'Fixed the thread jam. Had to replace the bobbin case. Machine is running now.',
    has_image: true, is_read: true, created_at: '2024-06-15T10:45:00Z',
    sender_name: 'Ramesh Patel', sender_role: 'technician',
    image_url: 'https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=400',
  },
  {
    id: 'msg_003', sender_id: 'usr_004', receiver_id: 'usr_007', work_order_id: 'wo_005',
    message_type: 'assignment', content: '🔪 Needle keeps breaking on Machine 5. Needs tension check or timing adjustment.',
    has_image: true, is_read: false, created_at: '2024-06-16T08:15:00Z',
    sender_name: 'Sunita Devi', sender_role: 'supervisor',
    image_url: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400',
  },
  {
    id: 'msg_004', sender_id: 'usr_003', receiver_id: 'usr_008', work_order_id: 'wo_008',
    message_type: 'alert', content: '⚠️ URGENT: Motor overheating on Flatlock Machine 7. Shut down immediately!',
    has_image: false, is_read: false, created_at: '2024-06-17T14:00:00Z',
    sender_name: 'Anil Mehta', sender_role: 'supervisor',
  },
  {
    id: 'msg_005', sender_id: 'usr_009', receiver_id: 'usr_004', work_order_id: 'wo_010',
    message_type: 'update', content: 'Oil leak has been contained. Need to order new gasket. Estimated completion: 2 hours.',
    has_image: true, is_read: true, created_at: '2024-06-17T11:30:00Z',
    sender_name: 'Deepak Joshi', sender_role: 'technician',
    image_url: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400',
  },
  {
    id: 'msg_006', sender_id: 'usr_005', receiver_id: 'usr_010', work_order_id: 'wo_012',
    message_type: 'assignment', content: '⚡ Electrical fault detected on Embroidery Machine 13. Circuit breaker tripped twice.',
    has_image: false, is_read: false, created_at: '2024-06-18T09:00:00Z',
    sender_name: 'Vikram Singh', sender_role: 'supervisor',
  },
  {
    id: 'msg_007', sender_id: 'usr_006', receiver_id: 'usr_003', work_order_id: 'wo_015',
    message_type: 'chat', content: 'Can you send me the maintenance manual for the Juki DDL-8700? Need to check the tension assembly specs.',
    has_image: false, is_read: true, created_at: '2024-06-18T10:30:00Z',
    sender_name: 'Ramesh Patel', sender_role: 'technician',
  },
  {
    id: 'msg_008', sender_id: 'usr_004', receiver_id: 'usr_009', work_order_id: 'wo_018',
    message_type: 'assignment', content: '💧 Tension issue on Bartack Machine 10. Production line is stopped.',
    has_image: true, is_read: false, created_at: '2024-06-19T07:45:00Z',
    sender_name: 'Sunita Devi', sender_role: 'supervisor',
    image_url: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=400',
  },
];

export const mockSpareParts = [
  { id: 'sp_001', part_name: 'Bobbin Case (Industrial)', quantity: 45, reorder_level: 20, unit_cost: 350, supplier: 'Juki India Pvt Ltd', last_ordered: '2024-05-10' },
  { id: 'sp_002', part_name: 'Needle DB×1 #14', quantity: 500, reorder_level: 100, unit_cost: 15, supplier: 'Organ Needles', last_ordered: '2024-06-01' },
  { id: 'sp_003', part_name: 'Cutting Blade 8" Octagonal', quantity: 8, reorder_level: 5, unit_cost: 1200, supplier: 'Eastman Machine', last_ordered: '2024-04-20' },
  { id: 'sp_004', part_name: 'Motor Belt V-Type', quantity: 12, reorder_level: 10, unit_cost: 450, supplier: 'Gates Industrial', last_ordered: '2024-05-25' },
  { id: 'sp_005', part_name: 'Steam Valve Gasket', quantity: 3, reorder_level: 8, unit_cost: 800, supplier: 'Naomoto Parts', last_ordered: '2024-03-15' },
  { id: 'sp_006', part_name: 'Thread Tension Spring', quantity: 30, reorder_level: 15, unit_cost: 120, supplier: 'Brother India', last_ordered: '2024-06-05' },
  { id: 'sp_007', part_name: 'Presser Foot Standard', quantity: 25, reorder_level: 10, unit_cost: 280, supplier: 'Juki India Pvt Ltd', last_ordered: '2024-05-18' },
  { id: 'sp_008', part_name: 'Servo Motor 550W', quantity: 2, reorder_level: 3, unit_cost: 8500, supplier: 'Jack Sewing', last_ordered: '2024-04-01' },
  { id: 'sp_009', part_name: 'Feed Dog Assembly', quantity: 18, reorder_level: 8, unit_cost: 650, supplier: 'Pegasus Sewing', last_ordered: '2024-05-30' },
  { id: 'sp_010', part_name: 'Oil Pump Filter', quantity: 40, reorder_level: 15, unit_cost: 180, supplier: 'Brother India', last_ordered: '2024-06-10' },
  { id: 'sp_011', part_name: 'Dye Pump Seal Kit', quantity: 4, reorder_level: 6, unit_cost: 2200, supplier: 'Fong\'s Industries', last_ordered: '2024-02-20' },
  { id: 'sp_012', part_name: 'Electrical Contactor 40A', quantity: 6, reorder_level: 4, unit_cost: 1800, supplier: 'Schneider Electric', last_ordered: '2024-04-15' },
  { id: 'sp_013', part_name: 'Heating Element 2KW', quantity: 5, reorder_level: 3, unit_cost: 3200, supplier: 'Hashima Parts', last_ordered: '2024-03-28' },
  { id: 'sp_014', part_name: 'Looper Set (Overlock)', quantity: 15, reorder_level: 8, unit_cost: 420, supplier: 'Pegasus Sewing', last_ordered: '2024-06-08' },
  { id: 'sp_015', part_name: 'Circuit Breaker 32A', quantity: 10, reorder_level: 5, unit_cost: 950, supplier: 'Schneider Electric', last_ordered: '2024-05-12' },
  { id: 'sp_016', part_name: 'Knife Blade (Overlock)', quantity: 22, reorder_level: 10, unit_cost: 380, supplier: 'Juki India Pvt Ltd', last_ordered: '2024-06-02' },
  { id: 'sp_017', part_name: 'Timing Belt HTD-5M', quantity: 7, reorder_level: 5, unit_cost: 560, supplier: 'Gates Industrial', last_ordered: '2024-04-25' },
  { id: 'sp_018', part_name: 'Temperature Sensor PT100', quantity: 9, reorder_level: 4, unit_cost: 1400, supplier: 'Thies GmbH', last_ordered: '2024-05-05' },
  { id: 'sp_019', part_name: 'Embroidery Hoop 21×21', quantity: 14, reorder_level: 6, unit_cost: 750, supplier: 'SWF East Co.', last_ordered: '2024-04-10' },
  { id: 'sp_020', part_name: 'Air Cylinder 50mm', quantity: 3, reorder_level: 4, unit_cost: 2800, supplier: 'SMC Pneumatics', last_ordered: '2024-03-01' },
];

export const mockExpenses = [
  { id: 'exp_001', machine_id: 'mch_001', expense_type: 'repair', amount: 2500, description: 'Bobbin case replacement', date: '2024-06-15' },
  { id: 'exp_002', machine_id: 'mch_005', expense_type: 'parts', amount: 1200, description: 'New cutting blade', date: '2024-06-14' },
  { id: 'exp_003', machine_id: 'mch_007', expense_type: 'repair', amount: 4500, description: 'Motor bearing replacement', date: '2024-06-13' },
  { id: 'exp_004', machine_id: 'mch_010', expense_type: 'service', amount: 3000, description: 'Annual dyeing machine service', date: '2024-06-12' },
  { id: 'exp_005', machine_id: 'mch_003', expense_type: 'repair', amount: 800, description: 'Thread tension adjustment', date: '2024-06-11' },
  { id: 'exp_006', machine_id: 'mch_015', expense_type: 'parts', amount: 6200, description: 'Servo motor replacement', date: '2024-06-10' },
  { id: 'exp_007', machine_id: 'mch_008', expense_type: 'repair', amount: 1800, description: 'Steam valve gasket', date: '2024-06-09' },
  { id: 'exp_008', machine_id: 'mch_012', expense_type: 'service', amount: 2200, description: 'Quarterly maintenance', date: '2024-06-08' },
  { id: 'exp_009', machine_id: 'mch_020', expense_type: 'repair', amount: 950, description: 'Feed dog alignment', date: '2024-06-07' },
  { id: 'exp_010', machine_id: 'mch_002', expense_type: 'parts', amount: 380, description: 'Needle plate replacement', date: '2024-06-06' },
];

export const mockPreventiveSchedules = [
  { id: 'ps_001', machine_id: 'mch_001', machine_name: 'Sewing Machine 1', task_name: 'Oil and lubricate', frequency: 'daily', last_completed: '2024-06-18', next_due: '2024-06-19' },
  { id: 'ps_002', machine_id: 'mch_001', machine_name: 'Sewing Machine 1', task_name: 'Clean lint and debris', frequency: 'weekly', last_completed: '2024-06-14', next_due: '2024-06-21' },
  { id: 'ps_003', machine_id: 'mch_005', machine_name: 'Cutting Machine 5', task_name: 'Sharpen blade', frequency: 'weekly', last_completed: '2024-06-12', next_due: '2024-06-19' },
  { id: 'ps_004', machine_id: 'mch_007', machine_name: 'Pressing Machine 7', task_name: 'Check steam pressure', frequency: 'daily', last_completed: '2024-06-18', next_due: '2024-06-19' },
  { id: 'ps_005', machine_id: 'mch_010', machine_name: 'Dyeing Machine 10', task_name: 'Clean filters and pumps', frequency: 'weekly', last_completed: '2024-06-10', next_due: '2024-06-17' },
  { id: 'ps_006', machine_id: 'mch_003', machine_name: 'Sewing Machine 3', task_name: 'Full motor inspection', frequency: 'monthly', last_completed: '2024-05-20', next_due: '2024-06-20' },
  { id: 'ps_007', machine_id: 'mch_015', machine_name: 'Inspection Machine 15', task_name: 'Calibrate sensors', frequency: 'monthly', last_completed: '2024-05-25', next_due: '2024-06-25' },
  { id: 'ps_008', machine_id: 'mch_008', machine_name: 'Pressing Machine 8', task_name: 'Replace steam hoses', frequency: 'quarterly', last_completed: '2024-04-01', next_due: '2024-07-01' },
  { id: 'ps_009', machine_id: 'mch_012', machine_name: 'Knitting Machine 12', task_name: 'Belt tension check', frequency: 'monthly', last_completed: '2024-05-15', next_due: '2024-06-15' },
  { id: 'ps_010', machine_id: 'mch_020', machine_name: 'Sewing Machine 20', task_name: 'Electrical safety inspection', frequency: 'quarterly', last_completed: '2024-03-10', next_due: '2024-06-10' },
];

export const mockTransfers = [
  { id: 'tr_001', machine_id: 'mch_003', machine_name: 'Overlock Machine 3', from_location: 'Floor 1 - Line 1', to_location: 'Floor 1 - Line 2', transfer_date: '2024-06-10', notes: 'Production line reorganization' },
  { id: 'tr_002', machine_id: 'mch_008', machine_name: 'Flatlock Machine 8', from_location: 'Floor 1 - Line 3', to_location: 'Floor 1 - Maintenance', transfer_date: '2024-06-05', notes: 'Sent for major repair' },
  { id: 'tr_003', machine_id: 'mch_015', machine_name: 'Bartack Machine 15', from_location: 'Floor 1 - Quality Control', to_location: 'Floor 1 - Line 4', transfer_date: '2024-06-01', notes: 'Needed for high volume run' },
];

// Analytics data generators
export function getDowntimeData() {
  const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
  return weeks.map(week => ({
    name: week,
    'single-needle': Math.floor(Math.random() * 20) + 5,
    'double-needle': Math.floor(Math.random() * 15) + 3,
    'overlock': Math.floor(Math.random() * 12) + 2,
    'bartack': Math.floor(Math.random() * 18) + 4,
    'other': Math.floor(Math.random() * 8) + 1,
  }));
}

export function getCostData() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  return months.map(month => ({
    name: month,
    parts: Math.floor(Math.random() * 25000) + 5000,
    labor: Math.floor(Math.random() * 15000) + 3000,
    service: Math.floor(Math.random() * 10000) + 2000,
  }));
}

export function getPerformanceData() {
  return MACHINE_TYPES.slice(0, 6).map(type => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    uptime: Math.floor(Math.random() * 20) + 80,
    breakdowns: Math.floor(Math.random() * 10) + 1,
    avgRepairTime: Math.floor(Math.random() * 120) + 30,
  }));
}

export function getBrandComparisonData() {
  return BRANDS.slice(0, 6).map(brand => ({
    name: brand,
    reliability: Math.floor(Math.random() * 30) + 70,
    avgCost: Math.floor(Math.random() * 3000) + 500,
    breakdowns: Math.floor(Math.random() * 8) + 1,
  }));
}

export const mockNotifications = [
  { id: 'notif_001', type: 'alert', title: 'Machine Breakdown', message: 'Pressing Machine 7 — Motor overheat detected', is_read: false, created_at: '2024-06-19T08:00:00Z', priority: 'critical' },
  { id: 'notif_002', type: 'assignment', title: 'New Task Assigned', message: 'Thread jam on Sewing Machine 1 assigned to you', is_read: false, created_at: '2024-06-19T07:45:00Z', priority: 'high' },
  { id: 'notif_003', type: 'update', title: 'Work Order Completed', message: 'WO-001: Cutting blade replacement completed by Suresh Yadav', is_read: false, created_at: '2024-06-18T16:30:00Z', priority: 'normal' },
  { id: 'notif_004', type: 'alert', title: 'Low Stock Alert', message: 'Steam Valve Gasket — Only 3 remaining (reorder level: 8)', is_read: true, created_at: '2024-06-18T14:00:00Z', priority: 'high' },
  { id: 'notif_005', type: 'schedule', title: 'Maintenance Due', message: 'Dyeing Machine 10 — Filter cleaning overdue by 2 days', is_read: true, created_at: '2024-06-18T09:00:00Z', priority: 'high' },
  { id: 'notif_006', type: 'update', title: 'Task Update', message: 'Deepak Joshi: "Dye leak contained, ordering new gasket"', is_read: true, created_at: '2024-06-17T11:30:00Z', priority: 'normal' },
];
