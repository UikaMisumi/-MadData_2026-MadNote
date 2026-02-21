import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
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

  // 密码验证规则
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

  const validateCurrentPassword = (password) => {
    if (!password) return 'Current password is required.';
    return '';
  };

  const validateConfirmPassword = (confirmPassword, newPassword) => {
    if (!confirmPassword) return 'Please confirm your new password.';
    if (confirmPassword !== newPassword) return 'Passwords do not match.';
    return '';
  };

  // 实时验证处理
  const handleCurrentPasswordBlur = () => {
    const error = validateCurrentPassword(currentPassword);
    setErrors(prev => ({ ...prev, currentPassword: error }));
  };

  const handleNewPasswordBlur = () => {
    const error = validatePassword(newPassword);
    setErrors(prev => ({ ...prev, newPassword: error }));
    
    // 如果confirm password已填写，也要重新验证
    if (confirmPassword) {
      const confirmError = validateConfirmPassword(confirmPassword, newPassword);
      setErrors(prev => ({ ...prev, confirmPassword: confirmError }));
    }
  };

  const handleConfirmPasswordBlur = () => {
    const error = validateConfirmPassword(confirmPassword, newPassword);
    setErrors(prev => ({ ...prev, confirmPassword: error }));
  };

  const isPasswordFormValid = () => {
    const currentError = validateCurrentPassword(currentPassword);
    const newError = validatePassword(newPassword);
    const confirmError = validateConfirmPassword(confirmPassword, newPassword);
    
    return !currentError && !newError && !confirmError;
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    // 全面验证
    const currentError = validateCurrentPassword(currentPassword);
    const newError = validatePassword(newPassword);
    const confirmError = validateConfirmPassword(confirmPassword, newPassword);
    
    setErrors({
      currentPassword: currentError,
      newPassword: newError,
      confirmPassword: confirmError
    });
    
    if (!isPasswordFormValid()) {
      return;
    }
    
    setIsChangingPassword(true);
    setSuccessMessage('');

    try {
      // 模拟API调用 PUT /api/user/password
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 获取当前用户信息
      const currentPasswordHash = btoa(currentPassword);
      let isCurrentPasswordValid = false;

      // 检查演示账户
      if (user.email === 'demo@example.com' && currentPassword === 'Demo123!') {
        isCurrentPasswordValid = true;
      } else {
        // 检查注册用户
        const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
        const foundUser = registeredUsers.find(u => 
          u.email === user.email && u.passwordHash === currentPasswordHash
        );
        isCurrentPasswordValid = !!foundUser;
      }

      if (!isCurrentPasswordValid) {
        setErrors({ currentPassword: 'Current password is incorrect.' });
        return;
      }

      // 更新密码哈希
      const newPasswordHash = btoa(newPassword);
      
      if (user.email !== 'demo@example.com') {
        // 更新注册用户的密码
        const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
        const userIndex = registeredUsers.findIndex(u => u.email === user.email);
        if (userIndex !== -1) {
          registeredUsers[userIndex].passwordHash = newPasswordHash;
          localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
        }
      }
      
      // 密码修改成功
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setErrors({});
      setSuccessMessage('Password changed successfully!');
      
      // 3秒后清除成功消息
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrors({ general: 'Failed to change password. Please try again.' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    // 这里可以添加实际的主题切换逻辑
    // 目前只是保存到localStorage，未来可以扩展
    setSuccessMessage(`Theme changed to ${newTheme} mode!`);
    setTimeout(() => setSuccessMessage(''), 3000);
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
          <h1>Settings</h1>
        </div>

        {successMessage && (
          <div className="success-message" role="alert">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"/>
            </svg>
            {successMessage}
          </div>
        )}

        <div className="settings-content">
          {/* 密码修改区域 */}
          <div className="settings-section">
            <h2>Change Password</h2>
            <p className="section-description">
              Update your password to keep your account secure.
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
                  placeholder="Enter current password (Demo123!)"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  onBlur={handleCurrentPasswordBlur}
                  required
                  aria-describedby={errors.currentPassword ? "current-password-error" : undefined}
                  className={errors.currentPassword ? 'input-error' : ''}
                />
                {errors.currentPassword && (
                  <span className="error-message" id="current-password-error" role="alert">
                    <svg viewBox="0 0 24 24" width="16" height="16">
                      <path fill="currentColor" d="M12,2L13.09,8.26L22,9L13.09,9.74L12,16L10.91,9.74L2,9L10.91,8.26L12,2Z"/>
                    </svg>
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
                  onBlur={handleNewPasswordBlur}
                  required
                  aria-describedby={errors.newPassword ? "new-password-error" : undefined}
                  className={errors.newPassword ? 'input-error' : ''}
                  minLength={8}
                />
                {errors.newPassword && (
                  <span className="error-message" id="new-password-error" role="alert">
                    <svg viewBox="0 0 24 24" width="16" height="16">
                      <path fill="currentColor" d="M12,2L13.09,8.26L22,9L13.09,9.74L12,16L10.91,9.74L2,9L10.91,8.26L12,2Z"/>
                    </svg>
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
                  onBlur={handleConfirmPasswordBlur}
                  required
                  aria-describedby={errors.confirmPassword ? "confirm-new-password-error" : undefined}
                  className={errors.confirmPassword ? 'input-error' : ''}
                  minLength={8}
                />
                {errors.confirmPassword && (
                  <span className="error-message" id="confirm-new-password-error" role="alert">
                    <svg viewBox="0 0 24 24" width="16" height="16">
                      <path fill="currentColor" d="M12,2L13.09,8.26L22,9L13.09,9.74L12,16L10.91,9.74L2,9L10.91,8.26L12,2Z"/>
                    </svg>
                    {errors.confirmPassword}
                  </span>
                )}
              </label>

              <button 
                type="submit" 
                className="change-password-btn"
                disabled={isChangingPassword || !isPasswordFormValid()}
              >
                {isChangingPassword ? 'Changing Password...' : 'Change Password'}
              </button>
            </form>
          </div>

          {/* 主题设置区域 */}
          <div className="settings-section">
            <h2>Theme</h2>
            <p className="section-description">
              Choose your preferred app theme.
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
                  <span className="theme-description">Dark theme for better night viewing</span>
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
                  <span className="theme-description">Light theme for daytime use</span>
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;