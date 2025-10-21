// src/store/main.ts
import { create } from 'zustand';
import type { User, Project, ContactMessage, Notification } from './types';

// Interfaces
export interface AppState {
  isLoading: boolean;
  error: string | null;
  notifications: Notification[];
  showLoading: () => void;
  hideLoading: () => void;
  setError: (error: string | null) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'read'>) => void;
  dismissNotification: (id: string) => void;
}

interface ProjectState {
  projects: Project[];
  filteredProjects: Project[];
  searchQuery: string;
  filterCategory: string;
  selectedProject: Project | null;
  setProjects: (projects: Project[]) => void;
  setSearchQuery: (query: string) => void;
  setFilterCategory: (category: string) => void;
  setSelectedProject: (project: Project | null) => void;
}

interface ContactState {
  contactForm: {
    name: string;
    email: string;
    subject: string;
    message: string;
  };
  formErrors: {
    [key: string]: string;
  };
  isSubmitting: boolean;
  submitSuccess: boolean;
  updateContactForm: (field: string, value: string) => void;
  submitContactForm: () => Promise<void>;
  validateContactForm: () => boolean;
  resetContactForm: () => void;
  setSubmitStatus: (success: boolean) => void;
}

interface AuthState {
  currentUser: User | null;
  authToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

interface Store extends AuthState, AppState, ProjectState, ContactState {}

// Create the store
export const useAppStore = create<Store>()((set, get) => ({
  // Auth State
  currentUser: null,
  authToken: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  // App State
  projects: [],
  filteredProjects: [],
  searchQuery: '',
  filterCategory: '',
  selectedProject: null,

  // Contact Form State
  contactForm: {
    name: '',
    email: '',
    subject: '',
    message: '',
  },
  formErrors: {},
  isSubmitting: false,
  submitSuccess: false,
  
  // Notifications
  notifications: [],

  // Auth Actions
  login: async (email, password) => {
    try {
      set({ isLoading: true, error: null });
      // Simulated login
      // TODO: Replace with actual API call
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      const data = await response.json();
      set({
        currentUser: data.user,
        authToken: data.token,
        isAuthenticated: true,
        isLoading: false
      });
    } catch (err) {
      set({ 
        error: err instanceof Error ? err.message : 'Login failed',
        isLoading: false 
      });
      throw err;
    }
  },

  logout: async () => {
    // Clear auth state
    set({
      currentUser: null,
      authToken: null,
      isAuthenticated: false,
      isLoading: false
    });

    // Clear persisted data
    localStorage.removeItem('app-storage');
  },

  checkAuth: async () => {
    const { authToken } = get();
    
    if (!authToken) {
      set({ 
        isAuthenticated: false,
        currentUser: null, 
        isLoading: false 
      });
      return;
    }

    try {
      set({ isLoading: true });
      // TODO: Implement actual token verification
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (!response.ok) throw new Error('Invalid token');

      const user = await response.json();
      set({
        currentUser: user,
        isAuthenticated: true,
        isLoading: false
      });
    } catch {
      set({ 
        isAuthenticated: false,
        currentUser: null,
        authToken: null,
        isLoading: false
      });
    }
  },

  // Contact Form Actions
  updateContactForm: (field, value) => {
    set(state => ({
      contactForm: { ...state.contactForm, [field]: value }
    }));
  },

  validateContactForm: () => {
    const { contactForm } = get();
    const errors: { [key: string]: string } = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!contactForm.name.trim()) errors.name = 'Name is required';
    if (!contactForm.email.trim()) {
      errors.email = 'Email is required';
    } else if (!emailRegex.test(contactForm.email)) {
      errors.email = 'Invalid email format';
    }
    if (contactForm.message.trim().length < 10) {
      errors.message = 'Message must be at least 10 characters';
    }

    set({ formErrors: errors });
    return Object.keys(errors).length === 0;
  },

  submitContactForm: async () => {
    if (!get().validateContactForm()) return;

    set({ isSubmitting: true });
    try {
      const { contactForm } = get();
      // TODO: Replace with actual API call
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${get().authToken}`
        },
        body: JSON.stringify(contactForm)
      });

      if (!response.ok) throw new Error('Failed to send message');

      set({
        submitSuccess: true,
        contactForm: { name: '', email: '', subject: '', message: '' }
      });

      get().addNotification({
        type: 'success',
        message: 'Your message has been sent successfully!'
      });
    } catch (err) {
      set({ 
        submitSuccess: false,
        error: err instanceof Error ? err.message : 'Failed to send message'
      });
    } finally {
      set({ isSubmitting: false });
    }
  },

  resetContactForm: () => {
    set({ 
      contactForm: { name: '', email: '', subject: '', message: '' },
      formErrors: {},
      submitSuccess: false
    });
  },

  setSubmitStatus: (success) => {
    set({ submitSuccess: success });
  },

  // Project Actions
  setProjects: (projects) => {
    set({ projects, filteredProjects: projects });
  },

  setSearchQuery: (query) => {
    const { projects, filterCategory } = get();
    set({ searchQuery: query });
    get().filterProjects(projects, query, filterCategory);
  },

  setFilterCategory: (category) => {
    const { projects, searchQuery } = get();
    set({ filterCategory: category });
    get().filterProjects(projects, searchQuery, category);
  },

  filterProjects: (projects, query = '', category = '') => {
    const normalizedQuery = query.toLowerCase();
    const filtered = projects.filter(project => {
      const matchesQuery = 
        project.title.toLowerCase().includes(normalizedQuery) ||
        project.description.toLowerCase().includes(normalizedQuery);
      const matchesCategory = !category || 
        project.categories.some(cat => cat.toLowerCase() === category.toLowerCase());
      return matchesQuery && matchesCategory;
    });
    set({ filteredProjects: filtered });
  },

  setSelectedProject: (project) => {
    set({ selectedProject: project });
  },

  // App UI Actions
  showLoading: () => set({ isLoading: true }),
  hideLoading: () => set({ isLoading: false }),
  setError: (error) => set({ error }),
  
  addNotification: (notification) => {
    const id = Date.now().toString();
    const newNotification: Notification = {
      ...notification,
      id,
      read: false
    };
    set(state => ({
      notifications: [...state.notifications, newNotification]
    }));
    
    // Auto dismiss after 5 seconds
    setTimeout(() => {
      get().dismissNotification(id);
    }, 5000);
  },

  dismissNotification: (id) => {
    set(state => ({
      notifications: state.notifications.filter(n => n.id !== id)
    }));
  }
}), {
  name: 'portfolio-app-store',
  partialize: (state) => ({
    currentUser: state.currentUser,
    authToken: state.authToken,
    isAuthenticated: state.isAuthenticated
  })
});