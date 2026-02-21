import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './LoginPage.css';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [loginError, setLoginError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  // Validation rules
  const validateEmail = (value) => {
    if (!value) return 'Email is required.';
    return '';
  };

  const validatePassword = (value) => {
    if (!value) return 'Password is required.';
    return '';
  };

  // Real-time validation handlers
  const handleEmailBlur = () => {
    const error = validateEmail(email);
    setErrors((prev) => ({ ...prev, email: error }));
    setLoginError('');
  };

  const handlePasswordBlur = () => {
    const error = validatePassword(password);
    setErrors((prev) => ({ ...prev, password: error }));
    setLoginError('');
  };

  const isFormValid = () => {
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    return !emailError && !passwordError;
  };

  const handleSignIn = async (e) => {
    e.preventDefault();

    // Full-form validation
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    setErrors({
      email: emailError,
      password: passwordError
    });

    if (!isFormValid()) {
      return;
    }

    setIsLoading(true);
    setLoginError('');

    try {
      // Mock API call: POST /api/auth/login
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Load registered users from localStorage
      const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
      const passwordHash = btoa(password);
      const foundUser = registeredUsers.find(
        (existingUser) => existingUser.email === email.trim() && existingUser.passwordHash === passwordHash
      );

      // Demo account or registered user
      let loginUser = null;

      if (email === 'demo@example.com' && password === 'Demo123!') {
        loginUser = {
          id: '1',
          name: 'Demo User',
          email,
          avatar: 'https://picsum.photos/40/40?random=1'
        };
      } else if (foundUser) {
        loginUser = {
          id: foundUser.id,
          name: foundUser.name,
          email: foundUser.email,
          avatar: foundUser.avatar
        };
      }

      if (loginUser) {
        login(loginUser, 'mock-jwt-token');
        navigate('/');
      } else {
        setLoginError('Invalid email or password.');
      }
    } catch {
      setLoginError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    navigate('/');
  };

  return (
    <div className="login-modal-backdrop" onClick={handleClose}>
      <div className="login-modal" onClick={(e) => e.stopPropagation()}>
        <div className="login-header">
          <div className="logo">MadNote</div>
          <h2>Sign In</h2>
          <button
            className="close-btn"
            onClick={handleClose}
            aria-label="Close login modal"
          >
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
            </svg>
          </button>
        </div>

        <form className="login-form" onSubmit={handleSignIn}>
          {loginError && (
            <div className="login-error" role="alert">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path fill="currentColor" d="M12,2L13.09,8.26L22,9L13.09,9.74L12,16L10.91,9.74L2,9L10.91,8.26L12,2Z"/>
              </svg>
              {loginError}
            </div>
          )}

          <label htmlFor="email-input">
            <span>Email</span>
            <input
              id="email-input"
              type="email"
              placeholder="Enter your email (try: demo@example.com)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={handleEmailBlur}
              required
              aria-required="true"
              aria-describedby={errors.email ? 'email-error' : undefined}
              className={errors.email ? 'input-error' : ''}
            />
            {errors.email && (
              <span className="error-message" id="email-error" role="alert">
                <svg viewBox="0 0 24 24" width="16" height="16">
                  <path fill="currentColor" d="M12,2L13.09,8.26L22,9L13.09,9.74L12,16L10.91,9.74L2,9L10.91,8.26L12,2Z"/>
                </svg>
                {errors.email}
              </span>
            )}
          </label>

          <label htmlFor="password-input">
            <span>Password</span>
            <input
              id="password-input"
              type="password"
              placeholder="Enter your password (try: Demo123!)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={handlePasswordBlur}
              required
              aria-required="true"
              aria-describedby={errors.password ? 'password-error' : undefined}
              className={errors.password ? 'input-error' : ''}
            />
            {errors.password && (
              <span className="error-message" id="password-error" role="alert">
                <svg viewBox="0 0 24 24" width="16" height="16">
                  <path fill="currentColor" d="M12,2L13.09,8.26L22,9L13.09,9.74L12,16L10.91,9.74L2,9L10.91,8.26L12,2Z"/>
                </svg>
                {errors.password}
              </span>
            )}
          </label>

          <button
            type="submit"
            className="primary-btn"
            disabled={isLoading || !isFormValid()}
          >
            {isLoading ? 'Signing In...' : 'Login'}
          </button>

          <p className="switch-link">
            New here? <Link to="/signup">Sign Up</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
