import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function seed() {
  console.log('Fetching users and machines...');
  const { data: users } = await supabase.from('users').select('*');
  const { data: machines } = await supabase.from('machines').select('*');

  if (!users || users.length === 0 || !machines || machines.length === 0) {
    console.error('Missing users or machines.');
    process.exit(1);
  }

  const tech1 = users.find(u => u.email === 'tech1@textilecare.com');
  const tech2 = users.find(u => u.email === 'tech2@textilecare.com');
  
  const m1 = machines[0];
  const m2 = machines[1];
  const m3 = machines[2];

  const mockWorkOrders = [
    { 
      machine_id: m1.id, 
      assigned_technician: tech1.id, 
      issue_reported: 'Thread breaking continuously', 
      status: 'pending', 
      priority: 'high',
      waiting_time_minutes: 15
    },
    { 
      machine_id: m2.id, 
      assigned_technician: tech2.id, 
      issue_reported: 'Motor making loud noise', 
      status: 'in_progress', 
      priority: 'critical',
      waiting_time_minutes: 30,
      started_at: new Date().toISOString()
    },
    { 
      machine_id: m3.id, 
      assigned_technician: tech1.id, 
      issue_reported: 'Needle plate broken', 
      status: 'completed', 
      priority: 'medium',
      waiting_time_minutes: 20,
      fixing_time_minutes: 45,
      cost: 350.00,
      started_at: new Date(Date.now() - 3600000).toISOString(),
      completed_at: new Date().toISOString()
    }
  ];

  console.log('Seeding work orders...');
  const { error } = await supabase.from('work_orders').insert(mockWorkOrders);
  if (error) console.error(error);
  else console.log('Work orders seeded.');

  process.exit(0);
}

seed();
