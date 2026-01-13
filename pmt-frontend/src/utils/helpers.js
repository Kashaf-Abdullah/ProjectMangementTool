import { 
  ROLES, 
  ROLE_HIERARCHY, 
  STATUS_COLORS, 
  PRIORITY_COLORS, 
  ROLE_COLORS,
  DATE_FORMATS 
} from './constants';

/**
 * Format a date string
 * @param {string} dateString - The date string to format
 * @param {string} format - The format to use (from DATE_FORMATS)
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString, format = DATE_FORMATS.MEDIUM) => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      weekday: 'long'
    };
    
    switch (format) {
      case DATE_FORMATS.SHORT:
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: 'numeric' 
        });
        
      case DATE_FORMATS.MEDIUM:
        return date.toLocaleDateString('en-US', { 
          month: 'long', 
          day: 'numeric',
          year: 'numeric' 
        });
        
      case DATE_FORMATS.LONG:
        return date.toLocaleDateString('en-US', { 
          weekday: 'long',
          month: 'long', 
          day: 'numeric',
          year: 'numeric' 
        });
        
      case DATE_FORMATS.TIME:
        return date.toLocaleTimeString('en-US', { 
          hour: 'numeric',
          minute: 'numeric'
        });
        
      case DATE_FORMATS.DATETIME:
        return `${date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: 'numeric' 
        })} ${date.toLocaleTimeString('en-US', { 
          hour: 'numeric',
          minute: 'numeric'
        })}`;
        
      default:
        return date.toLocaleDateString('en-US', options);
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

/**
 * Get relative time (e.g., "2 hours ago")
 * @param {string} dateString - The date string
 * @returns {string} Relative time string
 */
export const getRelativeTime = (dateString) => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    const diffWeek = Math.floor(diffDay / 7);
    const diffMonth = Math.floor(diffDay / 30);
    const diffYear = Math.floor(diffDay / 365);
    
    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    if (diffWeek < 4) return `${diffWeek} week${diffWeek > 1 ? 's' : ''} ago`;
    if (diffMonth < 12) return `${diffMonth} month${diffMonth > 1 ? 's' : ''} ago`;
    return `${diffYear} year${diffYear > 1 ? 's' : ''} ago`;
  } catch (error) {
    console.error('Error getting relative time:', error);
    return 'N/A';
  }
};

/**
 * Check if user has required role or higher
 * @param {string} userRole - The user's role
 * @param {string} requiredRole - The required role
 * @returns {boolean} True if user has required role or higher
 */
export const hasRoleAccess = (userRole, requiredRole) => {
  const userLevel = ROLE_HIERARCHY[userRole] || 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0;
  return userLevel >= requiredLevel;
};

/**
 * Get color for a status
 * @param {string} status - The status
 * @returns {string} Color hex code
 */
export const getStatusColor = (status) => {
  return STATUS_COLORS[status] || '#64748b';
};

/**
 * Get color for a priority
 * @param {string} priority - The priority
 * @returns {string} Color hex code
 */
export const getPriorityColor = (priority) => {
  return PRIORITY_COLORS[priority] || '#64748b';
};

/**
 * Get color for a role
 * @param {string} role - The role
 * @returns {string} Color hex code
 */
export const getRoleColor = (role) => {
  return ROLE_COLORS[role] || '#64748b';
};

/**
 * Format file size
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Truncate text with ellipsis
 * @param {string} text - The text to truncate
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Generate initials from name
 * @param {string} firstName - First name
 * @param {string} lastName - Last name
 * @returns {string} Initials
 */
export const getInitials = (firstName, lastName) => {
  if (!firstName && !lastName) return '?';
  
  const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : '';
  const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
  
  return firstInitial + lastInitial;
};

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Deep clone an object
 * @param {Object} obj - Object to clone
 * @returns {Object} Cloned object
 */
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (Array.isArray(obj)) return obj.map(item => deepClone(item));
  
  const clonedObj = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      clonedObj[key] = deepClone(obj[key]);
    }
  }
  
  return clonedObj;
};

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {boolean} True if email is valid
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Get query parameter from URL
 * @param {string} name - Parameter name
 * @returns {string|null} Parameter value
 */
export const getQueryParam = (name) => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
};

/**
 * Set query parameter in URL
 * @param {string} name - Parameter name
 * @param {string} value - Parameter value
 */
export const setQueryParam = (name, value) => {
  const urlParams = new URLSearchParams(window.location.search);
  urlParams.set(name, value);
  const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
  window.history.pushState({}, '', newUrl);
};

/**
 * Remove query parameter from URL
 * @param {string} name - Parameter name to remove
 */
export const removeQueryParam = (name) => {
  const urlParams = new URLSearchParams(window.location.search);
  urlParams.delete(name);
  const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
  window.history.pushState({}, '', newUrl);
};

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy text:', error);
    
    // Fallback for older browsers
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (fallbackError) {
      console.error('Fallback copy failed:', fallbackError);
      return false;
    }
  }
};

/**
 * Generate a random color
 * @returns {string} Random color hex code
 */
export const getRandomColor = () => {
  const colors = [
    '#3b82f6', // Blue
    '#10b981', // Green
    '#f59e0b', // Yellow
    '#ef4444', // Red
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#64748b'  // Gray
  ];
  
  return colors[Math.floor(Math.random() * colors.length)];
};

/**
 * Calculate progress percentage
 * @param {number} completed - Number of completed items
 * @param {number} total - Total number of items
 * @returns {number} Progress percentage
 */
export const calculateProgress = (completed, total) => {
  if (total === 0) return 0;
  const percentage = (completed / total) * 100;
  return Math.min(100, Math.max(0, Math.round(percentage)));
};

/**
 * Check if a value is empty
 * @param {*} value - Value to check
 * @returns {boolean} True if value is empty
 */
export const isEmpty = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (typeof value === 'object' && Object.keys(value).length === 0) return true;
  return false;
};

/**
 * Create a unique ID
 * @param {number} length - Length of the ID
 * @returns {string} Unique ID
 */
export const generateId = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
};

/**
 * Parse JWT token
 * @param {string} token - JWT token
 * @returns {Object|null} Decoded token payload
 */
export const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to parse JWT:', error);
    return null;
  }
};

/**
 * Check if token is expired
 * @param {string} token - JWT token
 * @returns {boolean} True if token is expired
 */
export const isTokenExpired = (token) => {
  const payload = parseJwt(token);
  
  if (!payload || !payload.exp) {
    return true;
  }
  
  const currentTime = Math.floor(Date.now() / 1000);
  return payload.exp < currentTime;
};

/**
 * Get error message from error object
 * @param {Error|Object} error - Error object
 * @returns {string} Error message
 */
export const getErrorMessage = (error) => {
  if (typeof error === 'string') return error;
  if (error.message) return error.message;
  if (error.response?.data?.message) return error.response.data.message;
  if (error.response?.data?.error) return error.response.data.error;
  return 'An unexpected error occurred';
};