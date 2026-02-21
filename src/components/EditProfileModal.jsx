import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './EditProfileModal.css';

const EditProfileModal = ({ isOpen, onClose, user, onSave }) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    username: user?.username || user?.name?.toLowerCase().replace(/\s+/g, '') || '',
    bio: user?.bio || '',
    avatar: user?.avatar || ''
  });
  const [previewAvatar, setPreviewAvatar] = useState(user?.avatar || '');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Update form data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        username: user.username || user.name?.toLowerCase().replace(/\s+/g, '') || '',
        bio: user.bio || '',
        avatar: user.avatar || ''
      });
      setPreviewAvatar(user.avatar || '');
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Validation
    if (name === 'name' && value.length > 24) return;
    if (name === 'username' && value.length > 15) return;
    if (name === 'bio' && value.length > 160) return;
    
    // For username, only allow alphanumeric characters and underscores
    if (name === 'username') {
      const cleanValue = value.toLowerCase().replace(/[^a-z0-9_]/g, '');
      setFormData(prev => ({
        ...prev,
        [name]: cleanValue
      }));
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const convertImageToBase64 = (file, maxWidth = 400, quality = 0.8) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions, maintain aspect ratio
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        if (height > maxWidth) {
          width = (width * maxWidth) / height;
          height = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw compressed image
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to base64
        const base64 = canvas.toDataURL('image/jpeg', quality);
        
        // Clean up temporary URL
        URL.revokeObjectURL(img.src);
        
        resolve(base64);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        resolve(null);
      };
      
      // Create temporary URL for Image loading
      img.src = URL.createObjectURL(file);
    });
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    setIsUploading(true);

    try {
      // Convert to base64 for persistent storage
      const base64Avatar = await convertImageToBase64(file, 400, 0.8);
      
      if (base64Avatar) {
        setPreviewAvatar(base64Avatar);
        setFormData(prev => ({
          ...prev,
          avatar: base64Avatar
        }));
      } else {
        alert('Failed to process image. Please try again.');
      }
    } catch (error) {
      console.error('Error processing avatar:', error);
      alert('Failed to process image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    if (formData.name.trim().length < 3) {
      alert('Display name must be at least 3 characters');
      return;
    }
    
    if (formData.username.trim().length < 3) {
      alert('Username must be at least 3 characters');
      return;
    }

    // Save the profile data
    onSave(formData);
    
    // Show success message
    console.log('Profile updated:', formData);
    
    // Close modal
    onClose();
    
    // In a real app, show toast notification
    setTimeout(() => {
      alert('Profile updated successfully!');
    }, 100);
  };

  const handleCancel = () => {
    // Reset form data
    setFormData({
      name: user?.name || '',
      username: user?.username || user?.name?.toLowerCase().replace(/\s+/g, '') || '',
      bio: user?.bio || '',
      avatar: user?.avatar || ''
    });
    setPreviewAvatar(user?.avatar || '');
    onClose();
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-backdrop">
      <form className="edit-profile-modal" onSubmit={handleSubmit}>
        <h2>Edit profile</h2>
        
        {/* Avatar Upload */}
        <div className="form-group">
          <label className="avatar-uploader" onClick={handleAvatarClick}>
            <div className="avatar-preview">
              {previewAvatar ? (
                <img src={previewAvatar} alt="Avatar preview" />
              ) : (
                <div className="avatar-placeholder">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
              )}
              <div className="upload-overlay">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                </svg>
                <span>Upload</span>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              style={{ display: 'none' }}
            />
          </label>
          <p className="help-text">Square image, max 5MB</p>
        </div>

        {/* Display Name */}
        <div className="form-group">
          <label htmlFor="name">
            Display name
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter your display name"
              minLength={3}
              maxLength={24}
              required
            />
            <span className="char-count">{formData.name.length}/24</span>
          </label>
        </div>

        {/* Username */}
        <div className="form-group">
          <label htmlFor="username">
            Username
            <div className="username-input">
              <span className="username-prefix">@</span>
              <input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="username"
                minLength={3}
                maxLength={15}
                required
              />
            </div>
            <span className="char-count">{formData.username.length}/15</span>
            <p className="help-text">Only letters, numbers, and underscores allowed</p>
          </label>
        </div>

        {/* Bio */}
        <div className="form-group">
          <label htmlFor="bio">
            Bio
            <textarea
              id="bio"
              name="bio"
              rows={3}
              value={formData.bio}
              onChange={handleInputChange}
              placeholder="Tell us about yourself..."
              maxLength={160}
            />
            <span className="char-count">{formData.bio.length}/160</span>
          </label>
        </div>

        {/* Form Actions */}
        <footer className="modal-footer">
          <button type="button" className="ghost" onClick={handleCancel}>
            Cancel
          </button>
          <button 
            type="submit" 
            className="primary" 
            disabled={isUploading || formData.name.trim().length < 3 || formData.username.trim().length < 3}
          >
            {isUploading ? 'Saving...' : 'Save'}
          </button>
        </footer>
      </form>
    </div>,
    document.body
  );
};

export default EditProfileModal;