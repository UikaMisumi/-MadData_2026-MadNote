import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiUpdatePassword } from '../api';
import './ResetPasswordModal.css';

const ResetPasswordModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // PUT /api/v1/users/:userId/password
      await apiUpdatePassword(user.id, formData.currentPassword, formData.newPassword);

      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      alert('Password updated successfully!');
      onClose();
    } catch (err) {
      if (err.status === 400) {
        setErrors({ currentPassword: 'Current password is incorrect.' });
      } else {
        setErrors({ submit: 'Failed to update password. Please try again.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-backdrop">
      <form className="modal card reset-password-modal" onSubmit={handleSubmit}>
        <h2>Reset password</h2>

        {errors.submit && (
          <div className="error-banner">{errors.submit}</div>
        )}

        {/* Current Password */}
        <div className="form-group">
          <label htmlFor="currentPassword">
            Current password
            <input
              id="currentPassword"
              name="currentPassword"
              type="password"
              value={formData.currentPassword}
              onChange={handleInputChange}
              placeholder="Enter your current password"
              required
              autoComplete="current-password"
            />
            {errors.currentPassword && (
              <span className="error-text">{errors.currentPassword}</span>
            )}
          </label>
        </div>

        {/* New Password */}
        <div className="form-group">
          <label htmlFor="newPassword">
            New password
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              value={formData.newPassword}
              onChange={handleInputChange}
              placeholder="Enter your new password"
              minLength={8}
              required
              autoComplete="new-password"
            />
            {errors.newPassword && (
              <span className="error-text">{errors.newPassword}</span>
            )}
          </label>
          <p className="help-text">At least 8 characters</p>
        </div>

        {/* Confirm Password */}
        <div className="form-group">
          <label htmlFor="confirmPassword">
            Confirm new password
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="Confirm your new password"
              minLength={8}
              required
              autoComplete="new-password"
            />
            {errors.confirmPassword && (
              <span className="error-text">{errors.confirmPassword}</span>
            )}
          </label>
        </div>

        <footer className="modal-footer">
          <button type="button" className="ghost" onClick={handleCancel}>
            Cancel
          </button>
          <button type="submit" className="primary" disabled={isSubmitting}>
            {isSubmitting ? 'Updating...' : 'Update Password'}
          </button>
        </footer>
      </form>
    </div>,
    document.body
  );
};

export default ResetPasswordModal;
