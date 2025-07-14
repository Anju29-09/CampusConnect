// Session management utilities for access code-based authentication

export interface SessionData {
  accessCode: string;
  userRole: string;
  isAuthenticated: boolean;
  sessionTimestamp: number;
}

export const getSessionData = (): SessionData | null => {
  if (typeof window === 'undefined') return null;
  
  const accessCode = localStorage.getItem('accessCode');
  const userRole = localStorage.getItem('userRole');
  const isAuthenticated = localStorage.getItem('isAuthenticated');
  const sessionTimestamp = localStorage.getItem('sessionTimestamp');
  
  if (!accessCode || !userRole || !isAuthenticated || !sessionTimestamp) {
    return null;
  }
  
  return {
    accessCode,
    userRole,
    isAuthenticated: isAuthenticated === 'true',
    sessionTimestamp: parseInt(sessionTimestamp)
  };
};

export const isSessionValid = (): boolean => {
  const session = getSessionData();
  if (!session) return false;
  
  // Only check if user is authenticated, no automatic timeout
  return session.isAuthenticated;
};

export const getUserRole = (): string | null => {
  const session = getSessionData();
  return session?.userRole || null;
};

export const getAccessCode = (): string | null => {
  const session = getSessionData();
  return session?.accessCode || null;
};

export const hasPermission = (permission: 'read' | 'insert' | 'delete' | 'update'): boolean => {
  const userRole = getUserRole();
  
  switch (permission) {
    case 'read':
      // All roles can read
      return userRole === 'admin' || userRole === 'student' || userRole === 'office';
    case 'insert':
    case 'delete':
    case 'update':
      // Only admin can insert/delete/update
      return userRole === 'admin';
    default:
      return false;
  }
};

export const clearSession = (): void => {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('accessCode');
  localStorage.removeItem('userRole');
  localStorage.removeItem('isAuthenticated');
  localStorage.removeItem('sessionTimestamp');
};

export const refreshSession = (): void => {
  if (typeof window === 'undefined') return;
  
  const session = getSessionData();
  if (session) {
    localStorage.setItem('sessionTimestamp', Date.now().toString());
  }
}; 