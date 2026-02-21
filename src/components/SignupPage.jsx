import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './LoginPage.css'; // Reuse login modal styles
function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  // Random username generator
  const generateRandomUsername = () => {
    const adjectives = [
      'Amazing', 'Awesome', 'Bright', 'Creative', 'Cool', 'Dynamic', 'Epic', 'Fantastic',
      'Glowing', 'Happy', 'Incredible', 'Joyful', 'Kinetic', 'Legendary', 'Magical', 'Noble',
      'Outstanding', 'Powerful', 'Quantum', 'Radiant', 'Stellar', 'Thunderous', 'Ultimate', 'Vibrant',
      'Wonderful', 'Xtreme', 'Youthful', 'Zealous', 'Cosmic', 'Digital', 'Electric', 'Futuristic',
      'Genius', 'Heroic', 'Infinite', 'Luminous', 'Mystic', 'Phoenix', 'Shadow', 'Turbo'
    ];
    
    const nouns = [
      'Explorer', 'Creator', 'Dreamer', 'Builder', 'Hunter', 'Wizard', 'Knight', 'Ninja',
      'Pilot', 'Rider', 'Warrior', 'Guardian', 'Master', 'Legend', 'Champion', 'Pioneer',
      'Voyager', 'Seeker', 'Wanderer', 'Adventurer', 'Artist', 'Genius', 'Hero', 'Maverick',
      'Phantom', 'Racer', 'Sage', 'Titan', 'Viper', 'Wolf', 'Dragon', 'Phoenix',
      'Storm', 'Blade', 'Fire', 'Ice', 'Lightning', 'Nova', 'Comet', 'Galaxy'
    ];
    
    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    const randomNumber = Math.floor(Math.random() * 999) + 1;
    
    return `${randomAdjective}${randomNoun}${randomNumber}`;
  };

  // Validation rules
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return 'Email is required.';
    if (!emailRegex.test(email)) return 'Please enter a valid email address.';
    return '';
  };

  const validatePassword = (password) => {
    if (!password) return 'Password is required.';
    if (password.length < 8) return 'Password must be at least 8 characters.';
    
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      return 'Password must include uppercase, lowercase, and a number.';
    }
    return '';
  };

  const validateConfirmPassword = (confirmPassword, password) => {
    if (!confirmPassword) return 'Please confirm your password.';
    if (confirmPassword !== password) return 'Passwords do not match.';
    return '';
  };

  // Real-time validation handlers
  const handleEmailBlur = () => {
    const error = validateEmail(email);
    setErrors(prev => ({ ...prev, email: error }));
  };

  const handlePasswordBlur = () => {
    const error = validatePassword(password);
    setErrors(prev => ({ ...prev, password: error }));
    
    // Revalidate confirm password if it already has a value
    if (confirmPassword) {
      const confirmError = validateConfirmPassword(confirmPassword, password);
      setErrors(prev => ({ ...prev, confirmPassword: confirmError }));
    }
  };

  const handleConfirmPasswordBlur = () => {
    const error = validateConfirmPassword(confirmPassword, password);
    setErrors(prev => ({ ...prev, confirmPassword: error }));
  };

  const isFormValid = () => {
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    const confirmError = validateConfirmPassword(confirmPassword, password);
    
    return !emailError && !passwordError && !confirmError;
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    
    // Full-form validation
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    const confirmError = validateConfirmPassword(confirmPassword, password);
    
    setErrors({
      email: emailError,
      password: passwordError,
      confirmPassword: confirmError
    });
    
    if (!isFormValid()) {
      return;
    }
    
    setIsLoading(true);

    try {
      // Mock API call: POST /api/auth/signup
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check whether email already exists
      const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
      const emailExists = registeredUsers.find(user => user.email === email.trim()) || 
                          email.trim() === 'demo@example.com';
      
      if (emailExists) {
        setErrors({ email: 'Email already exists. Please use a different email.' });
        return;
      }
      
      // Build new user data
      const randomUsername = generateRandomUsername();
      const newUser = {
        id: Date.now().toString(),
        name: randomUsername,
        username: randomUsername,
        email: email.trim(),
        avatar: 'https://picsum.photos/40/40?random=' + Date.now()
      };

      // NOTE: simple base64 for demo only, replace with secure hashing in backend
      const passwordHash = btoa(password);
      // Save registered user data
      registeredUsers.push({
        ...newUser,
        passwordHash: passwordHash
      });
      localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
      
      // Registration success feedback
      alert('Account created successfully! Please sign in.');
      navigate('/login');
    } catch (error) {
      alert('Registration failed. Please try again.');
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
              aria-describedby={errors.email ? "email-error" : undefined}
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
              aria-describedby={errors.password ? "password-error" : undefined}
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
              aria-describedby={errors.confirmPassword ? "confirm-password-error" : undefined}
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
