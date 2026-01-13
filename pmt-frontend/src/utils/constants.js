export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  PROJECT_MANAGER: 'project_manager',
  USER: 'user'
};

export const ROLE_HIERARCHY = {
  'super_admin': 4,
  'admin': 3,
  'project_manager': 2,
  'user': 1
};

export const TASK_STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  REVIEW: 'review',
  DONE: 'done'
};

export const TASK_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

export const TASK_LABELS = [
  'bug',
  'feature',
  'docs',
  'ui',
  'backend',
  'design'
];

export const PROJECT_STATUS = {
  ACTIVE: 'active',
  ARCHIVED: 'archived'
};

export const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending'
};

export const BILLING_PLANS = {
  FREE: {
    name: 'Free',
    price: 0,
    userLimit: 5,
    features: [
      'Up to 5 users',
      'Unlimited projects',
      'Basic task management',
      'Email support',
      '1GB storage'
    ]
  },
  GROWTH: {
    name: 'Growth',
    price: 5,
    userLimit: 'Additional 5 users',
    features: [
      'Add 5 more users ($5 per pack)',
      'All Free features',
      'Priority support',
      'Advanced reporting',
      '5GB storage'
    ]
  },
  ENTERPRISE: {
    name: 'Enterprise',
    price: 'Custom',
    userLimit: 'Unlimited',
    features: [
      'Unlimited users',
      'Custom integrations',
      'Dedicated support',
      'Advanced security',
      'Custom storage limits',
      'SLA guarantee'
    ]
  }
};

export const STATUS_COLORS = {
  todo: '#64748b',
  in_progress: '#3b82f6',
  review: '#f59e0b',
  done: '#10b981'
};

export const PRIORITY_COLORS = {
  low: '#64748b',
  medium: '#3b82f6',
  high: '#f59e0b',
  urgent: '#ef4444'
};

export const ROLE_COLORS = {
  super_admin: '#ef4444',
  admin: '#8b5cf6',
  project_manager: '#3b82f6',
  user: '#64748b'
};

export const DEFAULT_PROJECT_COLORS = [
  '#64748b', // Gray
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f59e0b', // Yellow
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#ec4899'  // Pink
];

export const DATE_FORMATS = {
  SHORT: 'MMM d, yyyy',
  MEDIUM: 'MMMM d, yyyy',
  LONG: 'EEEE, MMMM d, yyyy',
  TIME: 'h:mm a',
  DATETIME: 'MMM d, yyyy h:mm a'
};

export const LOCAL_STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  THEME: 'theme',
  LANGUAGE: 'language',
  RECENT_PROJECTS: 'recent_projects'
};

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    PROFILE: '/auth/profile',
    LOGOUT: '/auth/logout'
  },
  USERS: {
    LIST: '/users',
    INVITE: '/users/invite',
    ACTIVATE: '/auth/activate/:token',
    UPDATE_ROLE: '/users/role'
  },
  PROJECTS: {
    LIST: '/projects',
    CREATE: '/projects',
    DETAIL: '/projects/:id',
    UPDATE: '/projects/:id',
    DELETE: '/projects/:id'
  },
  TASKS: {
    LIST: '/tasks',
    CREATE: '/tasks',
    DETAIL: '/tasks/:id',
    UPDATE: '/tasks/:id',
    DELETE: '/tasks/:id'
  },
  ORGANIZATIONS: {
    LIST: '/organizations',
    CREATE: '/organizations',
    DETAIL: '/organizations/:id',
    UPDATE: '/organizations/:id',
    STATS: '/organizations/stats'
  },
  BILLING: {
    STATUS: '/billing/status',
    CHECKOUT: '/billing/create-checkout-session',
    HISTORY: '/billing/history'
  }
};

export const VALIDATION_RULES = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD: {
    MIN_LENGTH: 8,
    // At least one uppercase, one lowercase, one number
    PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/
  },
  USERNAME: /^[a-zA-Z0-9_]{3,30}$/,
  SUBDOMAIN: /^[a-z0-9-]{3,50}$/
};

export const ERROR_MESSAGES = {
  REQUIRED: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  PASSWORD_TOO_SHORT: 'Password must be at least 8 characters long',
  PASSWORD_COMPLEXITY: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  PASSWORDS_DONT_MATCH: 'Passwords do not match',
  INVALID_USERNAME: 'Username can only contain letters, numbers, and underscores',
  INVALID_SUBDOMAIN: 'Subdomain can only contain lowercase letters, numbers, and hyphens'
};

export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful!',
  REGISTER_SUCCESS: 'Registration successful!',
  LOGOUT_SUCCESS: 'Logged out successfully',
  PROFILE_UPDATED: 'Profile updated successfully',
  PROJECT_CREATED: 'Project created successfully',
  PROJECT_UPDATED: 'Project updated successfully',
  PROJECT_DELETED: 'Project deleted successfully',
  TASK_CREATED: 'Task created successfully',
  TASK_UPDATED: 'Task updated successfully',
  TASK_DELETED: 'Task deleted successfully',
  USER_INVITED: 'User invited successfully',
  USER_ACTIVATED: 'Account activated successfully',
  ROLE_UPDATED: 'Role updated successfully',
  ORGANIZATION_CREATED: 'Organization created successfully',
  ORGANIZATION_UPDATED: 'Organization updated successfully',
  ORGANIZATION_DELETED: 'Organization deleted successfully',
  PAYMENT_SUCCESS: 'Payment successful!',
  SETTINGS_SAVED: 'Settings saved successfully'
};

export const PAGE_TITLES = {
  LOGIN: 'Login - Project Management',
  REGISTER: 'Register - Project Management',
  DASHBOARD: 'Dashboard - Project Management',
  PROJECTS: 'Projects - Project Management',
  TASKS: 'Tasks - Project Management',
  USERS: 'Users - Project Management',
  ORGANIZATIONS: 'Organizations - Project Management',
  BILLING: 'Billing - Project Management',
  SETTINGS: 'Settings - Project Management',
  PROFILE: 'Profile - Project Management'
};

export const META_DESCRIPTIONS = {
  LOGIN: 'Login to your project management account',
  REGISTER: 'Create a new project management account',
  DASHBOARD: 'Manage your projects and tasks efficiently',
  PROJECTS: 'View and manage all your projects',
  TASKS: 'Organize and track your tasks',
  USERS: 'Manage team members and permissions',
  ORGANIZATIONS: 'Manage organizations and settings',
  BILLING: 'View and manage your subscription',
  SETTINGS: 'Customize your application settings',
  PROFILE: 'View and edit your profile'
};