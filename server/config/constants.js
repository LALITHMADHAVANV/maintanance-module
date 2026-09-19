export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  SUPERVISOR: 'supervisor',
  TECHNICIAN: 'technician',
};

export const MACHINE_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  MAINTENANCE: 'maintenance',
};

export const WO_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const MESSAGE_TYPES = {
  ASSIGNMENT: 'assignment',
  UPDATE: 'update',
  ALERT: 'alert',
  CHAT: 'chat',
};

export const SKILL_CATEGORIES = [
  'sewing', 'cutting', 'pressing', 'motor', 'electrical', 'dyeing', 'general'
];

export const EXPERTISE_LEVELS = ['beginner', 'intermediate', 'expert'];

export const FREQUENCIES = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'];

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
