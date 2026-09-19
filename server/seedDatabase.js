import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const mockMachines = [
  { name: 'Juki DDL-8700', brand: 'Juki', machine_type: 'Single-needle', location: 'Floor 1 - Line A', status: 'active', purchase_date: '2022-01-15' },
  { name: 'Brother S-7100A', brand: 'Brother', machine_type: 'Single-needle', location: 'Floor 1 - Line A', status: 'active', purchase_date: '2022-03-10' },
  { name: 'Pegasus M900', brand: 'Pegasus', machine_type: 'Overlock', location: 'Floor 1 - Line B', status: 'maintenance', purchase_date: '2021-11-20' },
  { name: 'Juki MO-6800', brand: 'Juki', machine_type: 'Overlock', location: 'Floor 1 - Line B', status: 'active', purchase_date: '2023-01-05' },
  { name: 'Brother T-8422C', brand: 'Brother', machine_type: 'Double-needle', location: 'Floor 1 - Line C', status: 'inactive', purchase_date: '2020-08-15' }
];

const mockSpareParts = [
  { part_name: 'Needle DBx1 #14', quantity: 250, reorder_level: 100, unit_cost: 15, supplier: 'Groz-Beckert' },
  { part_name: 'Needle DCx27 #14', quantity: 180, reorder_level: 100, unit_cost: 18, supplier: 'Groz-Beckert' },
  { part_name: 'Bobbin Case Juki Standard', quantity: 15, reorder_level: 20, unit_cost: 450, supplier: 'Juki Genuine' },
  { part_name: 'Servo Motor 550W', quantity: 3, reorder_level: 5, unit_cost: 3500, supplier: 'HMC' }
];

async function seed() {
  console.log('Seeding machines...');
  const { error: err1 } = await supabase.from('machines').insert(mockMachines);
  if (err1) console.error(err1);
  else console.log('Machines seeded.');
  
  console.log('Seeding spare parts...');
  const { error: err2 } = await supabase.from('spare_parts').insert(mockSpareParts);
  if (err2) console.error(err2);
  else console.log('Spare parts seeded.');

  console.log('Done.');
  process.exit(0);
}

seed();
