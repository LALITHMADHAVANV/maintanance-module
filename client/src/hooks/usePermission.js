/**
 * usePermission — React hook for role-based access control
 *
 * Usage:
 *   const { can, canAny, role, isAdmin, isSupervisor, isTechnician, isManager } = usePermission();
 *
 *   // Check a specific permission
 *   if (can('machines', 'create')) { ... }
 *
 *   // Check if user has any of these roles
 *   if (canAny(['admin', 'manager'])) { ... }
 *
 *   // Use boolean helpers
 *   if (isAdmin) { ... }
 */
import { useAuth } from '../context/AuthContext';

// ─────────────────────────────────────────────────────────────────────────────
// Permission Matrix (mirrors server/middleware/permissions.js)
// Single source of truth should eventually come from the API, but mirrors it
// here so the frontend never needs round trips for UI visibility checks.
// ─────────────────────────────────────────────────────────────────────────────
const PERMISSION_MATRIX = {
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
    view:     ['admin', 'manager', 'supervisor'],
    view_own: ['technician'],
    export:   ['admin', 'manager'],
  },
  spareparts: {
    view:   ['admin', 'manager', 'supervisor', 'technician'],
    create: ['admin'],
    edit:   ['admin'],
    use:    ['admin', 'supervisor', 'technician'],
    restock: ['admin', 'supervisor'],
    delete: ['admin'],
  },
  users: {
    view:   ['admin', 'manager'],
    create: ['admin'],
    edit:   ['admin'],
    delete: ['admin'],
  },
};

// Allowed message recipient roles per sender role
const ALLOWED_MESSAGE_TARGETS = {
  admin:      ['admin', 'manager', 'supervisor', 'technician'],
  manager:    ['admin', 'manager', 'supervisor', 'technician'],
  supervisor: ['technician', 'admin'],
  technician: ['supervisor', 'admin'],
};

// Route-level access rules — which roles can visit each path
const ROUTE_PERMISSIONS = {
  '/':              ['admin', 'manager', 'supervisor', 'technician'],
  '/machines':      ['admin', 'manager', 'supervisor'],
  '/work-orders':   ['admin', 'manager', 'supervisor', 'technician'],
  '/tablet-entry':  ['admin', 'supervisor', 'technician'],
  '/messages':      ['admin', 'manager', 'supervisor', 'technician'],
  '/spare-parts':   ['admin', 'manager', 'supervisor', 'technician'],
  '/analytics':     ['admin', 'manager', 'supervisor'],
};

// ─────────────────────────────────────────────────────────────────────────────

export function usePermission() {
  const { user } = useAuth();
  const role = user?.role || null;

  /**
   * can(resource, action) → boolean
   * Returns true if the current user's role is allowed.
   */
  function can(resource, action) {
    if (!role) return false;
    return (PERMISSION_MATRIX[resource]?.[action] || []).includes(role);
  }

  /**
   * canAny(roles) → boolean
   * Returns true if current user has any of the given roles.
   */
  function canAny(roles) {
    if (!role) return false;
    return roles.includes(role);
  }

  /**
   * canVisit(path) → boolean
   * Returns true if the current role is allowed to visit the route.
   */
  function canVisit(path) {
    if (!role) return false;
    const allowedRoles = ROUTE_PERMISSIONS[path];
    if (!allowedRoles) return true; // unknown route — allow (ProtectedRoute handles it)
    return allowedRoles.includes(role);
  }

  /**
   * allowedMessageTargets() → string[]
   * Returns the list of roles this user can send messages to.
   */
  function allowedMessageTargets() {
    return ALLOWED_MESSAGE_TARGETS[role] || [];
  }

  /**
   * getDefaultRoute() → string
   * Returns the home page for the current role (for auto-redirect after login).
   */
  function getDefaultRoute() {
    switch (role) {
      case 'admin':      return '/';
      case 'manager':    return '/';
      case 'supervisor': return '/';
      case 'technician': return '/';
      default:           return '/login';
    }
  }

  return {
    role,
    can,
    canAny,
    canVisit,
    allowedMessageTargets,
    getDefaultRoute,
    ROUTE_PERMISSIONS,
    ALLOWED_MESSAGE_TARGETS,

    // Convenience booleans
    isAdmin:      role === 'admin',
    isManager:    role === 'manager',
    isSupervisor: role === 'supervisor',
    isTechnician: role === 'technician',

    // Composite helpers
    isAdminOrManager:        ['admin', 'manager'].includes(role),
    isAdminOrSupervisor:     ['admin', 'supervisor'].includes(role),
    isAdminOrManagerOrSupervisor: ['admin', 'manager', 'supervisor'].includes(role),
    canManageWorkOrders:     ['admin', 'supervisor'].includes(role),
    canManageMachines:       role === 'admin',
    canViewAnalytics:        ['admin', 'manager', 'supervisor'].includes(role),
    canSendMessages:         ['admin', 'supervisor', 'technician'].includes(role),
  };
}

export { PERMISSION_MATRIX, ROUTE_PERMISSIONS, ALLOWED_MESSAGE_TARGETS };
