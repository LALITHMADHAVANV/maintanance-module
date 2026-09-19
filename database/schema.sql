-- =============================================================
-- TextileCare Pro — Complete Database Schema for Supabase
-- =============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(20) NOT NULL DEFAULT 'technician' CHECK (role IN ('admin', 'supervisor', 'technician', 'manager')),
  online_status BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- 2. MACHINES
CREATE TABLE machines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  machine_type VARCHAR(50) NOT NULL,
  location VARCHAR(255),
  purchase_date DATE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  brand VARCHAR(100),
  model VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_machines_type ON machines(machine_type);
CREATE INDEX idx_machines_status ON machines(status);

-- 3. SPECIALIST_SKILLS
CREATE TABLE specialist_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_category VARCHAR(50) NOT NULL CHECK (skill_category IN ('stitching', 'hardware', 'motor', 'electrical', 'maintenance', 'general')),
  expertise_level VARCHAR(20) NOT NULL DEFAULT 'beginner' CHECK (expertise_level IN ('beginner', 'intermediate', 'expert')),
  machines_handled INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_specialist_skills_user ON specialist_skills(user_id);
CREATE INDEX idx_specialist_skills_category ON specialist_skills(skill_category);

-- 4. WORK_ORDERS
CREATE TABLE work_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  machine_id UUID REFERENCES machines(id) ON DELETE SET NULL,
  assigned_technician UUID REFERENCES users(id) ON DELETE SET NULL,
  issue_reported TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  waiting_time_minutes INT,
  fixing_time_minutes INT,
  cost DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_work_orders_status ON work_orders(status);
CREATE INDEX idx_work_orders_machine ON work_orders(machine_id);
CREATE INDEX idx_work_orders_technician ON work_orders(assigned_technician);
CREATE INDEX idx_work_orders_created ON work_orders(created_at DESC);

-- 5. MESSAGES
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  work_order_id UUID REFERENCES work_orders(id) ON DELETE SET NULL,
  message_type VARCHAR(20) DEFAULT 'chat' CHECK (message_type IN ('assignment', 'update', 'alert', 'chat')),
  content TEXT NOT NULL,
  has_image BOOLEAN DEFAULT false,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id);
CREATE INDEX idx_messages_work_order ON messages(work_order_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);

-- 6. MESSAGE_ATTACHMENTS
CREATE TABLE message_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT,
  file_url TEXT,
  file_size INT,
  file_type VARCHAR(50),
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_message_attachments_message ON message_attachments(message_id);

-- 7. MACHINE_ISSUE_PHOTOS
CREATE TABLE machine_issue_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  work_order_id UUID REFERENCES work_orders(id) ON DELETE SET NULL,
  photo_url TEXT NOT NULL,
  photo_path TEXT,
  description TEXT,
  taken_by UUID REFERENCES users(id) ON DELETE SET NULL,
  taken_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_issue_photos_machine ON machine_issue_photos(machine_id);
CREATE INDEX idx_issue_photos_work_order ON machine_issue_photos(work_order_id);

-- 8. SPARE_PARTS
CREATE TABLE spare_parts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  part_name VARCHAR(255) NOT NULL,
  quantity INT DEFAULT 0,
  reorder_level INT DEFAULT 5,
  unit_cost DECIMAL(10,2),
  supplier VARCHAR(255),
  last_ordered DATE,
  last_restocked_date TIMESTAMPTZ,
  last_restocked_by UUID REFERENCES users(id) ON DELETE SET NULL,
  restock_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_spare_parts_name ON spare_parts(part_name);

-- 8.1 RESTOCK_HISTORY
CREATE TABLE restock_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  part_id UUID NOT NULL REFERENCES spare_parts(id) ON DELETE CASCADE,
  quantity_received INT NOT NULL,
  quantity_before INT NOT NULL,
  quantity_after INT NOT NULL,
  received_from VARCHAR(255),
  received_by UUID REFERENCES users(id) ON DELETE SET NULL,
  received_date TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_restock_history_part ON restock_history(part_id);
CREATE INDEX idx_restock_history_date ON restock_history(received_date DESC);

-- 9. MAINTENANCE_EXPENSES
CREATE TABLE maintenance_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  machine_id UUID REFERENCES machines(id) ON DELETE SET NULL,
  expense_type VARCHAR(50) CHECK (expense_type IN ('repair', 'parts', 'service', 'labor', 'other')),
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_expenses_machine ON maintenance_expenses(machine_id);
CREATE INDEX idx_expenses_date ON maintenance_expenses(date DESC);

-- 10. PREVENTIVE_SCHEDULE
CREATE TABLE preventive_schedule (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  task_name VARCHAR(255) NOT NULL,
  frequency VARCHAR(20) CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  last_completed DATE,
  next_due DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_preventive_machine ON preventive_schedule(machine_id);
CREATE INDEX idx_preventive_next_due ON preventive_schedule(next_due);

-- 11. EQUIPMENT_TRANSFERS
CREATE TABLE equipment_transfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  from_location VARCHAR(255) NOT NULL,
  to_location VARCHAR(255) NOT NULL,
  transfer_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transfers_machine ON equipment_transfers(machine_id);
CREATE INDEX idx_transfers_date ON equipment_transfers(transfer_date DESC);

-- =============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE spare_parts ENABLE ROW LEVEL SECURITY;

-- Users: everyone can read, only admin can modify
CREATE POLICY "Users are viewable by all authenticated" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Machines: all authenticated users can read
CREATE POLICY "Machines viewable by all" ON machines FOR SELECT USING (true);
CREATE POLICY "Admin/Supervisor can modify machines" ON machines FOR ALL USING (true);

-- Work Orders: all can read, relevant users can modify
CREATE POLICY "Work orders viewable by all" ON work_orders FOR SELECT USING (true);
CREATE POLICY "Work orders modifiable by all" ON work_orders FOR ALL USING (true);

-- Messages: users can see their own messages
CREATE POLICY "Users see own messages" ON messages FOR SELECT 
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());
CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK (sender_id = auth.uid());

-- Spare Parts: all can read, admin/supervisor can modify
CREATE POLICY "Spare parts viewable by all" ON spare_parts FOR SELECT USING (true);
CREATE POLICY "Spare parts modifiable by all" ON spare_parts FOR ALL USING (true);

-- =============================================================
-- SEED DATA
-- =============================================================

-- Users
-- Admin user (password: admin123)
INSERT INTO users (email, password_hash, name, phone, role, online_status) VALUES
('admin@textilecare.com', '$2a$12$Ll06vcLo9Y5680YK2CD10ejwadF7uDxfyUPPNCMn996IGYWuLUgmG', 'Rajesh Kumar', '+91-9876543210', 'admin', true);

-- Manager (password: admin123)
INSERT INTO users (email, password_hash, name, phone, role, online_status) VALUES
('manager@textilecare.com', '$2a$12$Ll06vcLo9Y5680YK2CD10ejwadF7uDxfyUPPNCMn996IGYWuLUgmG', 'Priya Sharma', '+91-9876543211', 'manager', true);

-- Supervisors (password: super123)
INSERT INTO users (email, password_hash, name, phone, role, online_status) VALUES
('supervisor1@textilecare.com', '$2a$12$IZ2vvdBiRcL2t9FbP2Mfbud2bHrl.mWBIRkYvAqXlguCJ/mHxxq.q', 'Anil Mehta', '+91-9876543212', 'supervisor', true),
('supervisor2@textilecare.com', '$2a$12$IZ2vvdBiRcL2t9FbP2Mfbud2bHrl.mWBIRkYvAqXlguCJ/mHxxq.q', 'Sunita Devi', '+91-9876543213', 'supervisor', true),
('supervisor3@textilecare.com', '$2a$12$IZ2vvdBiRcL2t9FbP2Mfbud2bHrl.mWBIRkYvAqXlguCJ/mHxxq.q', 'Vikram Singh', '+91-9876543214', 'supervisor', false);

-- Technicians (password: tech123)
INSERT INTO users (email, password_hash, name, phone, role, online_status) VALUES
('tech1@textilecare.com', '$2a$12$HSFiGJz1oeYemiznUEvs8epIqI6JdX8/s/SJZaRmVX2J4nmxScjtS', 'Ramesh Patel', '+91-9876543215', 'technician', true),
('tech2@textilecare.com', '$2a$12$HSFiGJz1oeYemiznUEvs8epIqI6JdX8/s/SJZaRmVX2J4nmxScjtS', 'Suresh Yadav', '+91-9876543216', 'technician', true),
('tech3@textilecare.com', '$2a$12$HSFiGJz1oeYemiznUEvs8epIqI6JdX8/s/SJZaRmVX2J4nmxScjtS', 'Manoj Gupta', '+91-9876543217', 'technician', false),
('tech4@textilecare.com', '$2a$12$HSFiGJz1oeYemiznUEvs8epIqI6JdX8/s/SJZaRmVX2J4nmxScjtS', 'Deepak Joshi', '+91-9876543218', 'technician', true),
('tech5@textilecare.com', '$2a$12$HSFiGJz1oeYemiznUEvs8epIqI6JdX8/s/SJZaRmVX2J4nmxScjtS', 'Kamal Nair', '+91-9876543219', 'technician', true);

-- Machines
INSERT INTO machines (name, machine_type, location, purchase_date, status, brand) VALUES 
('Juki DDL-8700', 'Single-needle', 'Floor 1 - Line A', '2022-01-15', 'active', 'Juki'),
('Brother S-7100A', 'Single-needle', 'Floor 1 - Line A', '2022-03-10', 'active', 'Brother'),
('Pegasus M900', 'Overlock', 'Floor 1 - Line B', '2021-11-20', 'maintenance', 'Pegasus'),
('Juki MO-6800', 'Overlock', 'Floor 1 - Line B', '2023-01-05', 'active', 'Juki'),
('Brother T-8422C', 'Double-needle', 'Floor 1 - Line C', '2020-08-15', 'inactive', 'Brother');

-- Spare Parts
INSERT INTO spare_parts (part_name, quantity, reorder_level, unit_cost, supplier) VALUES 
('Needle DBx1 #14', 250, 100, 15.00, 'Groz-Beckert'),
('Needle DCx27 #14', 180, 100, 18.00, 'Groz-Beckert'),
('Bobbin Case Juki Standard', 15, 20, 450.00, 'Juki Genuine'),
('Servo Motor 550W', 3, 5, 3500.00, 'HMC');
