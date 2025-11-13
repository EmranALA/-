import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { User, Role } from '../types';
import { users, getLabels as getLabelsFromData } from '../data/mockData';

interface AuthContextType {
  user: User | null;
  originalUser: User | null;
  isReadOnly: boolean;
  login: (username: string, password?: string) => boolean;
  logout: () => void;
  impersonate: (userToImpersonate: User, readOnly?: boolean) => void;
  stopImpersonating: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [originalUser, setOriginalUser] = useState<User | null>(null);
  const [isReadOnly, setIsReadOnly] = useState<boolean>(false);

  const login = (username: string, password?: string): boolean => {
    const trimmedUsername = username.trim().toLowerCase();
    const userToLogin = users.find(u => u.username.toLowerCase() === trimmedUsername);

    if (!userToLogin) {
      console.error(`No user found for username: ${username}`);
      return false;
    }

    // If the user being logged into has the same ID as the currently logged in user,
    // this is likely a profile update, so bypass password check to refresh user data.
    if (user && user.id === userToLogin.id) {
        setUser(userToLogin);
        // Don't change originalUser or isReadOnly, as this is a refresh
        return true;
    }

    // Special password check for App Manager on initial login
    if (userToLogin.role === Role.AppManager) {
        if (password === '1') {
            setUser(userToLogin);
            setOriginalUser(null);
            setIsReadOnly(false);
            return true;
        } else {
            // Password is required for App Manager and it was incorrect or not provided.
            return false;
        }
    }

    // For other users, or when password is not provided (e.g., from visitor login)
    // This maintains existing functionality for other users.
    setUser(userToLogin);
    setOriginalUser(null);
    setIsReadOnly(false);
    return true;
  };

  const logout = () => {
    setUser(null);
    setOriginalUser(null); // Clear impersonation on logout
    setIsReadOnly(false);
  };

  const impersonate = (userToImpersonate: User, readOnly: boolean = false) => {
    if (user && (user.role === Role.AppManager || user.role === Role.ManagerOfInstitutions)) {
        setOriginalUser(user);
        setUser(userToImpersonate);
        setIsReadOnly(readOnly);
    } else {
        console.error('Only AppManager or Manager of Institutions can impersonate.');
    }
  };

  const stopImpersonating = () => {
    if (originalUser) {
        setUser(originalUser);
        setOriginalUser(null);
        setIsReadOnly(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, originalUser, isReadOnly, login, logout, impersonate, stopImpersonating }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useLabels = () => {
    const [labels, setLabels] = useState(getLabelsFromData());

    useEffect(() => {
        const handleUpdate = () => {
            setLabels(getLabelsFromData());
        };
        window.addEventListener('labels-updated', handleUpdate);
        return () => window.removeEventListener('labels-updated', handleUpdate);
    }, []);

    const getLabel = (key: string, fallback?: string) => {
        return labels[key] ?? fallback ?? key;
    };

    return { labels, getLabel };
};
