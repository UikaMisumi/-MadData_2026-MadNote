import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiUpdatePassword } from '../api';
import './SettingsPage.css';

function SettingsPage() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  const validateCurrentPassword = (value) => {
    if (!value) return 'Current password is required.';
    return '';
  };

  const validateNewPassword = (value) => {
    if (!value) return 'New password is required.';
    return '';
  };

  const validateConfirmPassword = (value, nextPassword) => {
    if (!value) return 'Please confirm your new password.';
    if (value !== nextPassword) return 'Passwords do not match.';
    return '';
  };

  const isPasswordFormValid = () => {
    const currentError = validateCurrentPassword(currentPassword);
    const newError = validateNewPassword(newPassword);
    const confirmError = validateConfirmPassword(confirmPassword, newPassword);
    return !currentError && !newError && !confirmError;
  };

  const handlePasswordChange = async (event) => {
    event.preventDefault();

    const currentError = validateCurrentPassword(currentPassword);
    const newError = validateNewPassword(newPassword);
    const confirmError = validateConfirmPassword(confirmPassword, newPassword);

    setErrors({
      currentPassword: currentError,
      newPassword: newError,
      confirmPassword: confirmError,
    });

    if (currentError || newError || confirmError) {
      return;
    }

    setIsChangingPassword(true);
    setSuccessMessage('');

    try {
      await apiUpdatePassword(user.id, currentPassword, newPassword);

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setErrors({});
      setSuccessMessage('Password changed successfully.');
      setTimeout(() => setSuccessMessage(''), 2500);
    } catch (err) {
      if (err.status === 400) {
        setErrors({ currentPassword: 'Current password is incorrect.' });
      } else {
        setErrors({ general: 'Failed to change password. Please try again.' });
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleThemeChange = (nextTheme) => {
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    setSuccessMessage(`Theme switched to ${nextTheme} mode.`);
    setTimeout(() => setSuccessMessage(''), 2000);
  };

  if (!user) {
    return (
      <div className="settings-page">
        <div className="settings-error">
          <h2>Access Denied</h2>
          <p>Please log in to access settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="settings-container">
        <div className="settings-header">
          <h1>Account Settings</h1>
          <p>Manage your credentials and appearance preferences.</p>
        </div>

        {successMessage && (
          <div className="success-message" role="alert">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z" />
            </svg>
            {successMessage}
          </div>
        )}

        <div className="settings-content">
          <section className="settings-section">
            <h2>Change Password</h2>
            <p className="section-description">
              Use your current password to set a new one.
            </p>

            {errors.general && (
              <div className="error-alert" role="alert">
                {errors.general}
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="password-form">
              <label htmlFor="current-password">
                <span>Current Password</span>
                <input
                  id="current-password"
                  type="password"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  onBlur={() => setErrors((prev) => ({ ...prev, currentPassword: validateCurrentPassword(currentPassword) }))}
                  required
                  aria-describedby={errors.currentPassword ? 'current-password-error' : undefined}
                  className={errors.currentPassword ? 'input-error' : ''}
                />
                {errors.currentPassword && (
                  <span className="error-message" id="current-password-error" role="alert">
                    {errors.currentPassword}
                  </span>
                )}
              </label>

              <label htmlFor="new-password">
                <span>New Password</span>
                <input
                  id="new-password"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  onBlur={() => setErrors((prev) => ({ ...prev, newPassword: validateNewPassword(newPassword) }))}
                  required
                  aria-describedby={errors.newPassword ? 'new-password-error' : undefined}
                  className={errors.newPassword ? 'input-error' : ''}
                />
                {errors.newPassword && (
                  <span className="error-message" id="new-password-error" role="alert">
                    {errors.newPassword}
                  </span>
                )}
              </label>

              <label htmlFor="confirm-new-password">
                <span>Confirm New Password</span>
                <input
                  id="confirm-new-password"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={() => setErrors((prev) => ({ ...prev, confirmPassword: validateConfirmPassword(confirmPassword, newPassword) }))}
                  required
                  aria-describedby={errors.confirmPassword ? 'confirm-new-password-error' : undefined}
                  className={errors.confirmPassword ? 'input-error' : ''}
                />
                {errors.confirmPassword && (
                  <span className="error-message" id="confirm-new-password-error" role="alert">
                    {errors.confirmPassword}
                  </span>
                )}
              </label>

              <button
                type="submit"
                className="change-password-btn"
                disabled={isChangingPassword || !isPasswordFormValid()}
              >
                {isChangingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </section>

          <section className="settings-section">
            <h2>Theme</h2>
            <p className="section-description">
              Choose your preferred viewing mode.
            </p>

            <div className="theme-options">
              <label className="theme-option">
                <input
                  type="radio"
                  name="theme"
                  value="dark"
                  checked={theme === 'dark'}
                  onChange={(e) => handleThemeChange(e.target.value)}
                />
                <span className="theme-option-content">
                  <span className="theme-name">Dark</span>
                  <span className="theme-description">Higher contrast for low-light usage</span>
                </span>
              </label>

              <label className="theme-option">
                <input
                  type="radio"
                  name="theme"
                  value="light"
                  checked={theme === 'light'}
                  onChange={(e) => handleThemeChange(e.target.value)}
                />
                <span className="theme-option-content">
                  <span className="theme-name">Light</span>
                  <span className="theme-description">Clean bright interface for daytime work</span>
                </span>
              </label>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
