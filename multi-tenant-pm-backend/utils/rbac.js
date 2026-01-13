// utils/rbac.js
const roleHierarchy = {
  'super_admin': 4,
  'admin': 3,
  'project_manager': 2,
  'user': 1
};

const canPerformAction = (userRole, requiredRole) => {
  const userLevel = roleHierarchy[userRole];
  const requiredLevel = roleHierarchy[requiredRole];
  return userLevel >= requiredLevel;
};

const getAllowedActions = (userRole) => {
  const actions = {
    'super_admin': ['*'], // All actions
    'admin': ['manage_users', 'manage_projects', 'manage_tasks', 'billing'],
    'project_manager': ['manage_projects', 'manage_tasks'],
    'user': ['view_tasks', 'update_own_tasks', 'add_comments']
  };
  return actions[userRole] || [];
};

module.exports = {
  roleHierarchy,
  canPerformAction,
  getAllowedActions
};
