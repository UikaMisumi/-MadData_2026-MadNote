import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiSignup } from '../api';
import './LoginPage.css'; // Reuse login modal styles

function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [signupError, setSignupError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  // Validation rules
  const validateEmail = (v) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!v) return 'Email is required.';
    if (!emailRegex.test(v)) return 'Please enter a valid email address.';
    return '';
  };

  const validatePassword = (v) => {
    if (!v) return 'Password is required.';
    if (v.length < 8) return 'Password must be at least 8 characters.';
    if (!/[A-Z]/.test(v) || !/[a-z]/.test(v) || !/\d/.test(v)) {
      return 'Password must include uppercase, lowercase, and a number.';
    }
    return '';
  };

  const validateConfirmPassword = (v, pw) => {
    if (!v) return 'Please confirm your password.';
    if (v !== pw) return 'Passwords do not match.';
    return '';
  };

  const handleEmailBlur = () =>
    setErrors((prev) => ({ ...prev, email: validateEmail(email) }));

  const handlePasswordBlur = () => {
    setErrors((prev) => ({ ...prev, password: validatePassword(password) }));
    if (confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: validateConfirmPassword(confirmPassword, password) }));
    }
  };

  const handleConfirmPasswordBlur = () =>
    setErrors((prev) => ({ ...prev, confirmPassword: validateConfirmPassword(confirmPassword, password) }));

  const isFormValid = () =>
    !validateEmail(email) &&
    !validatePassword(password) &&
    !validateConfirmPassword(confirmPassword, password);

  const handleSignUp = async (e) => {
    e.preventDefault();

    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    const confirmError = validateConfirmPassword(confirmPassword, password);
    setErrors({ email: emailError, password: passwordError, confirmPassword: confirmError });

    if (emailError || passwordError || confirmError) return;

    setIsLoading(true);
    setSignupError('');

    try {
      // POST /api/v1/auth/signup  — backend generates username if not provided
      const data = await apiSignup(email.trim(), password, '');
      login(data.user, data.token);
      navigate('/');
    } catch (err) {
      if (err.status === 400) {
        setErrors((prev) => ({ ...prev, email: 'Email already exists. Please use a different email.' }));
      } else {
        setSignupError('Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => navigate('/');

  return (
    <div className="login-modal-backdrop" onClick={handleClose}>
      <div className="login-modal" onClick={(e) => e.stopPropagation()}>
        <div className="login-header">
          <div className="logo">MadNote</div>
          <h2>Sign Up</h2>
          <button
            className="close-btn"
            onClick={handleClose}
            aria-label="Close signup modal"
          >
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
            </svg>
          </button>
        </div>

        <form className="login-form" onSubmit={handleSignUp}>
          {signupError && (
            <div className="login-error" role="alert">
              {signupError}
            </div>
          )}

          <label htmlFor="signup-email-input">
            <span>Email</span>
            <input
              id="signup-email-input"
              type="email"
              placeholder="Enter your email"
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

          <label htmlFor="signup-password-input">
            <span>Password</span>
            <input
              id="signup-password-input"
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={handlePasswordBlur}
              required
              aria-required="true"
              aria-describedby={errors.password ? 'password-error' : undefined}
              className={errors.password ? 'input-error' : ''}
              minLength={8}
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

          <label htmlFor="confirm-password-input">
            <span>Confirm Password</span>
            <input
              id="confirm-password-input"
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onBlur={handleConfirmPasswordBlur}
              required
              aria-required="true"
              aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
              className={errors.confirmPassword ? 'input-error' : ''}
              minLength={8}
            />
            {errors.confirmPassword && (
              <span className="error-message" id="confirm-password-error" role="alert">
                <svg viewBox="0 0 24 24" width="16" height="16">
                  <path fill="currentColor" d="M12,2L13.09,8.26L22,9L13.09,9.74L12,16L10.91,9.74L2,9L10.91,8.26L12,2Z"/>
                </svg>
                {errors.confirmPassword}
              </span>
            )}
          </label>

          <button
            type="submit"
            className="primary-btn"
            disabled={isLoading || !isFormValid()}
          >
            {isLoading ? 'Creating Account...' : 'Sign Up'}
          </button>

          <p className="switch-link">
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default SignupPage;
