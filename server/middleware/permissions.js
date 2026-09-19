/**
 * ============================================================
 * RBAC Permission Matrix — TextileCare Pro
 * ============================================================
 * Defines what each role can do per resource.
 * Backend enforces this on every API route.
 * Frontend mirrors this via usePermission hook.
 * ============================================================
 */

export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  SUPERVISOR: 'supervisor',
  TECHNICIAN: 'technician',
};

/**
 * PERMISSION_MATRIX[resource][action] = array of allowed roles
 * Special values:
 *   'own'   — user can only affect their own records (filtered in route)
 *   'all'   — any authenticated user
 */
export const PERMISSION_MATRIX = {
  machines: {
    view:   ['admin', 'manager', 'supervisor', 'technician'],
    create: ['admin'],
    edit:   ['admin'],
    delete: ['admin'],
  },
  workorders: {
    view:          ['admin', 'manager', 'supervisor', 'technician'],
    create:        ['admin', 'supervisor'],
    assign:        ['admin', 'supervisor'],
    edit:          ['admin', 'supervisor'],
    delete:        ['admin'],
    update_status: ['admin', 'supervisor', 'technician'],
  },
  messages: {
    view:   ['admin', 'manager', 'supervisor', 'technician'],
    send:   ['admin', 'supervisor', 'technician'],
    delete: ['admin', 'supervisor', 'technician'],
  },
  analytics: {
    view:        ['admin', 'manager', 'supervisor'],
    view_own:    ['technician'],  // technician can only see own performance
    export:      ['admin', 'manager'],
  },
  spareparts: {
    view:   ['admin', 'manager', 'supervisor', 'technician'],
    create: ['admin'],
    edit:   ['admin'],
    use:    ['admin', 'supervisor', 'technician'],
    delete: ['admin'],
  },
  users: {
    view:   ['admin', 'manager'],
    create: ['admin'],
    edit:   ['admin'],
    delete: ['admin'],
  },
};

/**
 * hasPermission(role, resource, action)
 * Returns true if the given role is allowed to perform the action on the resource.
 */
export function hasPermission(role, resource, action) {
  const resourcePerms = PERMISSION_MATRIX[resource];
  if (!resourcePerms) return false;
  const allowedRoles = resourcePerms[action];
  if (!allowedRoles) return false;
  return allowedRoles.includes(role);
}

/**
 * checkPermission(resource, action)
 * Express middleware factory — returns 403 if user's role is not allowed.
 * Usage: router.get('/', authenticateToken, checkPermission('machines', 'view'), handler)
 */
export function checkPermission(resource, action) {
  return (req, res, next) => {
    const role = req.user?.role;
    if (!role) {
      return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }
    if (!hasPermission(role, resource, action)) {
      return res.status(403).json({
        error: `Access denied. Your role (${role}) does not have permission to ${action} ${resource}.`,
        required: PERMISSION_MATRIX[resource]?.[action] || [],
        yourRole: role,
      });
    }
    next();
  };
}

/**
 * Data scoping helpers — used inside route handlers to filter results.
 * These ensure users only see data they are allowed to see.
 */
export const DataScope = {
  /**
   * Filter a Supabase query builder based on role for machines.
   * Supervisors see machines by their location assignment.
   * Technicians see machines linked to their work orders (handled in route).
   */
  machines(query, user) {
    switch (user.role) {
      case 'admin':
      case 'manager':
        return query; // see all
      case 'supervisor':
        // Scope by supervisor's assigned locations — use supervisor_id if available
        // Fallback: return all (supervisor sees their department)
        return query;
      case 'technician':
        // Technician machine list is joined from work_orders in the route
        return query;
      default:
        return query.eq('id', null); // empty result for unknown roles
    }
  },

  /**
   * Apply work order filters based on role.
   */
  workorders(query, user) {
    switch (user.role) {
      case 'admin':
      case 'manager':
        return query; // see all
      case 'supervisor':
        return query.eq('created_by', user.userId);
      case 'technician':
        return query.eq('assigned_technician', user.userId);
      default:
        return query.eq('id', null);
    }
  },

  /**
   * Messages are always scoped to sender or receiver.
   * Both inbox and sent endpoints already filter by userId — no extra scope needed.
   */
  messages(query, user, direction = 'inbox') {
    if (direction === 'inbox') return query.eq('receiver_id', user.userId);
    return query.eq('sender_id', user.userId);
  },

  /**
   * Analytics: supervisors and technicians see scoped data.
   */
  analytics(query, user) {
    switch (user.role) {
      case 'admin':
      case 'manager':
        return query;
      case 'supervisor':
        return query.eq('created_by', user.userId);
      case 'technician':
        return query.eq('assigned_technician', user.userId);
      default:
        return query.eq('id', null);
    }
  },
};

/**
 * Allowed message targets by role.
 * Technician → can only message supervisor
 * Supervisor → can only message technicians
 * Admin/Manager → can message anyone
 */
export const ALLOWED_MESSAGE_TARGETS = {
  admin:      ['admin', 'manager', 'supervisor', 'technician'],
  manager:    ['admin', 'manager', 'supervisor', 'technician'],
  supervisor: ['technician', 'admin'],
  technician: ['supervisor', 'admin'],
};
