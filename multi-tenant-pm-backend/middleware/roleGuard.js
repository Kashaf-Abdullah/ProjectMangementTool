// middleware/roleGuard.js (COMPLETE)
const roleHierarchy = {
  'super_admin': 4,
  'admin': 3,
  'project_manager': 2,
  'user': 1
};

// ✅ MAIN authorize function - checks exact roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (roles.length === 0 || roles.includes(req.user.role)) {
      return next();
    }
    
    return res.status(403).json({ 
      message: `Role ${req.user.role} not authorized. Requires one of: ${roles.join(', ')}`
    });
  };
};

// ✅ Hierarchical check (admin can do PM actions)
const authorizeHierarchy = (minRole) => {
  return (req, res, next) => {
    const userRoleLevel = roleHierarchy[req.user.role];
    const requiredRoleLevel = roleHierarchy[minRole];
    
    if (userRoleLevel < requiredRoleLevel) {
      return res.status(403).json({ 
        message: `Insufficient privileges. Required: ${minRole} or higher, got: ${req.user.role}`
      });
    }
    next();
  };
};

// ✅ Check if user can perform specific action
const can = (action) => {
  return (req, res, next) => {
    const allowedActions = {
      'super_admin': ['*'],
      'admin': ['manage_users', 'manage_projects', 'manage_tasks', 'billing', 'view_reports'],
      'project_manager': ['manage_projects', 'manage_tasks', 'view_project_reports'],
      'user': ['view_tasks', 'update_own_tasks', 'add_comments']
    };
    
    const userActions = allowedActions[req.user.role] || [];
    if (userActions.includes('*') || userActions.includes(action)) {
      return next();
    }
    
    return res.status(403).json({ 
      message: `Action '${action}' not allowed for role: ${req.user.role}`
    });
  };
};

module.exports = { 
  authorize, 
  authorizeHierarchy, 
  can 
};
