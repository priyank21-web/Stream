import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

describe('App UI', () => {
  it('renders login form and allows input', () => {
    render(<App />);
    expect(screen.getByText(/login/i)).toBeInTheDocument();
    const usernameInput = screen.getByPlaceholderText(/username/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);
    fireEvent.change(usernameInput, { target: { value: 'admin' } });
    fireEvent.change(passwordInput, { target: { value: 'password' } });
    expect(usernameInput).toHaveValue('admin');
    expect(passwordInput).toHaveValue('password');
  });
}); 