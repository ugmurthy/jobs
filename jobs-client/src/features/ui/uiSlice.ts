import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  duration?: number;
}

export interface Modal {
  id: string;
  type: string;
  title: string;
  content: any;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
}

export interface UiState {
  theme: 'light' | 'dark' | 'system';
  sidebarOpen: boolean;
  toasts: Toast[];
  modals: Modal[];
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLoading: boolean;
  currentView: string | null;
}

const initialState: UiState = {
  theme: 'system',
  sidebarOpen: true,
  toasts: [],
  modals: [],
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  isLoading: false,
  currentView: null,
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme: (state: UiState, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.theme = action.payload;
      localStorage.setItem('theme', action.payload);
    },
    toggleSidebar: (state: UiState) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state: UiState, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    addToast: (state: UiState, action: PayloadAction<Omit<Toast, 'id'>>) => {
      const id = Date.now().toString();
      state.toasts.push({
        ...action.payload,
        id,
      });
    },
    removeToast: (state: UiState, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter(toast => toast.id !== action.payload);
    },
    clearToasts: (state: UiState) => {
      state.toasts = [];
    },
    openModal: (state: UiState, action: PayloadAction<Omit<Modal, 'id'>>) => {
      const id = Date.now().toString();
      state.modals.push({
        ...action.payload,
        id,
      });
    },
    closeModal: (state: UiState, action: PayloadAction<string>) => {
      state.modals = state.modals.filter(modal => modal.id !== action.payload);
    },
    closeAllModals: (state: UiState) => {
      state.modals = [];
    },
    setDeviceType: (state: UiState, action: PayloadAction<{ isMobile: boolean; isTablet: boolean; isDesktop: boolean }>) => {
      state.isMobile = action.payload.isMobile;
      state.isTablet = action.payload.isTablet;
      state.isDesktop = action.payload.isDesktop;
    },
    setLoading: (state: UiState, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setCurrentView: (state: UiState, action: PayloadAction<string | null>) => {
      state.currentView = action.payload;
    },
  },
});

export const {
  setTheme,
  toggleSidebar,
  setSidebarOpen,
  addToast,
  removeToast,
  clearToasts,
  openModal,
  closeModal,
  closeAllModals,
  setDeviceType,
  setLoading,
  setCurrentView,
} = uiSlice.actions;

export default uiSlice.reducer;