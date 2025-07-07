import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import LoginPage from '../LoginPage';
import authReducer, { login } from '@/features/auth/authSlice';

// Mock the toast component
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock the navigation
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ state: { from: { pathname: '/dashboard' } } }),
  };
});

// Mock the auth slice
vi.mock('@/features/auth/authSlice', async () => {
  const actual = await vi.importActual('@/features/auth/authSlice');
  return {
    ...actual,
    login: vi.fn(),
  };
});

describe('LoginPage', () => {
  let store: any;

  beforeEach(() => {
    // Create a test store with the auth reducer
    store = configureStore({
      reducer: {
        auth: authReducer,
      },
      preloadedState: {
        auth: {
          user: null,
          token: null,
          apiKey: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        },
      },
    });

    // Reset mocks
    vi.clearAllMocks();
  });

  it('renders the login form', () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      </Provider>
    );

    // Check if the form elements are rendered
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
    expect(screen.getByText(/sign up/i)).toBeInTheDocument();
  });

  it('validates form inputs', async () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      </Provider>
    );

    // Submit the form without entering any data
    const submitButton = screen.getByRole('button', { name: /log in/i });
    fireEvent.click(submitButton);

    // Check for validation errors
    await waitFor(() => {
      expect(screen.getByText(/username must be at least 3 characters/i)).toBeInTheDocument();
      expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
    });
  });

  it('submits the form with valid data', async () => {
    // Mock the login action to resolve successfully
    (login as any).mockImplementation(() => {
      return () => Promise.resolve({ payload: { token: 'test-token', user: { id: '1', username: 'testuser' } } });
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      </Provider>
    );

    // Fill in the form
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /log in/i });
    fireEvent.click(submitButton);

    // Check if the login action was dispatched with the correct data
    await waitFor(() => {
      expect(login).toHaveBeenCalledWith({ username: 'testuser', password: 'password123' });
    });
  });

  it('handles login errors', async () => {
    // Mock the login action to reject with an error
    (login as any).mockImplementation(() => {
      return () => Promise.reject(new Error('Invalid credentials'));
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      </Provider>
    );

    // Fill in the form
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /log in/i });
    fireEvent.click(submitButton);

    // Check if the error is displayed
    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });
});