'use client';

import React, { useState, useEffect } from 'react';
import { FiX, FiCamera, FiSave, FiUser, FiFileText, FiMail } from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';

interface UserProfile {
  _id: string;
  username: string;
  email: string;
  bio: string;
  profilePicture: string;
  createdAt: string;
  postsCount: number;
  followersCount: number;
  followingCount: number;
}

interface EditProfileModalProps {
  profile: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated: (profile: UserProfile) => void;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  profile,
  isOpen,
  onClose,
  onProfileUpdated
}) => {
  const [formData, setFormData] = useState({
    username: profile.username,
    bio: profile.bio,
  });
  const [profilePicture, setProfilePicture] = useState(profile.profilePicture);
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        username: profile.username,
        bio: profile.bio,
      });
      setProfilePicture(profile.profilePicture);
      setProfilePictureFile(null);
    }
  }, [isOpen, profile]);

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'social_media_app');
    
    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new Error('Failed to upload image');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setIsUploadingImage(true);
    
    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePicture(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      setProfilePictureFile(file);
      toast.success('Image selected successfully! ✨');
    } catch (error) {
      console.error('Error handling image:', error);
      toast.error('Error processing image');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.username.trim()) {
      toast.error('Username is required');
      return;
    }

    if (formData.username.length < 3) {
      toast.error('Username must be at least 3 characters long');
      return;
    }

    if (!formData.bio.trim()) {
      toast.error('Bio is required');
      return;
    }

    setIsSubmitting(true);

    try {
      let profilePictureUrl = profile.profilePicture;

      // Upload new profile picture if selected
      if (profilePictureFile) {
        profilePictureUrl = await uploadToCloudinary(profilePictureFile);
      }

      const updateData = {
        username: formData.username.trim(),
        bio: formData.bio.trim(),
        profilePicture: profilePictureUrl,
      };

      const response = await axios.put(`${API_BASE_URL}/users/profile`, updateData);
      
      onProfileUpdated(response.data.user);
      onClose();
      
      toast.success('Profile updated successfully! 🎉');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      if (error.response?.data?.message?.includes('username')) {
        toast.error('Username is already taken');
      } else {
        toast.error(error.response?.data?.message || 'Failed to update profile');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={handleBackdropClick}
      ></div>
      
      {/* Modal */}
      <div className="relative bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 max-w-md w-full max-h-[90vh] flex flex-col animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200/50">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Edit Profile</h3>
            <p className="text-sm text-gray-600 mt-1">Update your profile information</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-all duration-200 hover:scale-110"
          >
            <FiX size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Profile Picture Upload */}
            <div className="text-center">
              <label className="block text-sm font-semibold text-gray-700 mb-4">
                Profile Picture
              </label>
              <div className="relative inline-block group">
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 p-1 shadow-lg">
                  <div className="w-full h-full rounded-full bg-white p-1 overflow-hidden">
                    {profilePicture ? (
                      <img
                        src={profilePicture}
                        alt="Profile preview"
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center">
                        <FiUser size={32} className="text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>
                <label
                  htmlFor="profile-picture"
                  className="absolute bottom-1 right-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-2.5 rounded-full cursor-pointer hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg group-hover:scale-110"
                >
                  <FiCamera size={16} />
                </label>
                <input
                  id="profile-picture"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={isSubmitting}
                />
              </div>
              {isUploadingImage && (
                <div className="flex items-center justify-center mt-3">
                  <div className="w-4 h-4 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin mr-2"></div>
                  <p className="text-sm text-purple-600">Processing image...</p>
                </div>
              )}
            </div>

            {/* Username Input */}
            <div className="space-y-2">
              <label htmlFor="username" className="block text-sm font-semibold text-gray-700">
                Username *
              </label>
              <div className="relative group">
                <FiUser className={`absolute left-4 top-1/2 transform -translate-y-1/2 transition-all duration-200 ${
                  focusedField === 'username' ? 'text-purple-600 scale-110' : 'text-gray-400'
                }`} size={20} />
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleInputChange}
                  onFocus={() => setFocusedField('username')}
                  onBlur={() => setFocusedField(null)}
                  className={`w-full pl-12 pr-4 py-4 bg-white/50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:bg-white transition-all duration-200 ${
                    focusedField === 'username' ? 'border-purple-500 ring-4 ring-purple-500/10' : 'hover:border-gray-300'
                  }`}
                  placeholder="Enter your username"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <p className="text-xs text-gray-500 flex items-center">
                <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                This will be visible to other users
              </p>
            </div>

            {/* Bio Input */}
            <div className="space-y-2">
              <label htmlFor="bio" className="block text-sm font-semibold text-gray-700">
                Bio *
              </label>
              <div className="relative group">
                <FiFileText className={`absolute left-4 top-4 transition-all duration-200 ${
                  focusedField === 'bio' ? 'text-purple-600 scale-110' : 'text-gray-400'
                }`} size={20} />
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  onFocus={() => setFocusedField('bio')}
                  onBlur={() => setFocusedField(null)}
                  className={`w-full pl-12 pr-4 py-4 h-24 bg-white/50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:bg-white transition-all duration-200 resize-none ${
                    focusedField === 'bio' ? 'border-purple-500 ring-4 ring-purple-500/10' : 'hover:border-gray-300'
                  }`}
                  placeholder="Tell us about yourself..."
                  required
                  disabled={isSubmitting}
                  maxLength={200}
                />
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500 flex items-center">
                  <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                  A short description about yourself
                </span>
                <span className={`font-medium transition-colors ${
                  formData.bio.length > 180 ? 'text-red-500' : 'text-gray-500'
                }`}>
                  {formData.bio.length}/200
                </span>
              </div>
            </div>

            {/* Email (Read-only) */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Email Address
              </label>
              <div className="relative">
                <FiMail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  value={profile.email}
                  className="w-full pl-12 pr-4 py-4 bg-gray-100/50 border-2 border-gray-200 rounded-xl text-gray-600 cursor-not-allowed"
                  disabled
                  readOnly
                />
              </div>
              <p className="text-xs text-gray-500 flex items-center">
                <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                Email cannot be changed for security reasons
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200/50 p-6 bg-gray-50/30">
            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-all duration-200"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={isSubmitting || isUploadingImage}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-4 focus:ring-purple-500/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-lg"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <FiSave size={16} />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;