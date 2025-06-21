'use client';

import React, { useState, useEffect } from 'react';
import { FiX, FiImage, FiSave } from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';

interface Post {
  _id: string;
  content: string;
  images: string[];
  author: {
    _id: string;
    username: string;
    profilePicture: string;
  };
  likes: string[];
  comments: any[];
  createdAt: string;
  updatedAt: string;
}

interface EditPostModalProps {
  post: Post;
  isOpen: boolean;
  onClose: () => void;
  onPostUpdated: (post: Post) => void;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const EditPostModal: React.FC<EditPostModalProps> = ({
  post,
  isOpen,
  onClose,
  onPostUpdated
}) => {
  const [content, setContent] = useState(post.content);
  const [existingImages, setExistingImages] = useState<string[]>(post.images);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setContent(post.content);
      setExistingImages(post.images);
      setNewImages([]);
      setNewImagePreviews([]);
    }
  }, [isOpen, post]);

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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Calculate total images (existing + new)
    const totalImages = existingImages.length + newImages.length + files.length;
    
    if (totalImages > 5) {
      toast.error('You can have maximum 5 images per post');
      return;
    }

    // Validate file types and sizes
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error(`${file.name} is too large. Maximum size is 5MB`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    // Add to new images array
    setNewImages(prev => [...prev, ...validFiles]);

    // Create previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setNewImagePreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    e.target.value = '';
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
    setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() && existingImages.length === 0 && newImages.length === 0) {
      toast.error('Please add some content or images to your post');
      return;
    }

    setIsSubmitting(true);
    setIsUploadingImages(true);

    try {
      // Upload new images to Cloudinary
      let newImageUrls: string[] = [];
      if (newImages.length > 0) {
        toast.loading('Uploading images...', { id: 'upload' });
        
        const uploadPromises = newImages.map(image => uploadToCloudinary(image));
        newImageUrls = await Promise.all(uploadPromises);
        
        toast.dismiss('upload');
        toast.success('Images uploaded successfully');
      }

      setIsUploadingImages(false);

      // Combine existing and new image URLs
      const allImages = [...existingImages, ...newImageUrls];

      // Update post
      const updateData = {
        content: content.trim(),
        images: allImages,
      };

      const response = await axios.put(`${API_BASE_URL}/posts/${post._id}`, updateData);
      
      onPostUpdated(response.data.post);
      onClose();
      
      toast.success('Post updated successfully!');
    } catch (error: any) {
      console.error('Error updating post:', error);
      toast.error(error.response?.data?.message || 'Failed to update post');
    } finally {
      setIsSubmitting(false);
      setIsUploadingImages(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const totalImages = existingImages.length + newImages.length;

  return (
    <div className="modal-overlay" onClick={handleBackdropClick}>
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Edit Post</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4">
            {/* User Info */}
            <div className="flex items-center space-x-3 mb-4">
              <img
                src={post.author.profilePicture || '/default-avatar.png'}
                alt={post.author.username}
                className="profile-pic-md"
              />
              <div>
                <h4 className="font-medium text-gray-900">{post.author.username}</h4>
                <p className="text-sm text-gray-500">Editing post...</p>
              </div>
            </div>

            {/* Content Input */}
            <div className="mb-4">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind?"
                className="form-textarea w-full h-32 resize-none"
                maxLength={500}
              />
              <div className="text-right text-sm text-gray-400 mt-1">
                {content.length}/500
              </div>
            </div>

            {/* Existing Images */}
            {existingImages.length > 0 && (
              <div className="mb-4">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Current Images</h5>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {existingImages.map((image, index) => (
                    <div key={index} className="image-preview relative">
                      <img
                        src={image}
                        alt={`Existing ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(index)}
                        className="remove-btn"
                        disabled={isSubmitting}
                      >
                        <FiX size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Images */}
            {newImagePreviews.length > 0 && (
              <div className="mb-4">
                <h5 className="text-sm font-medium text-gray-700 mb-2">New Images</h5>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {newImagePreviews.map((preview, index) => (
                    <div key={index} className="image-preview relative">
                      <img
                        src={preview}
                        alt={`New ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeNewImage(index)}
                        className="remove-btn"
                        disabled={isSubmitting}
                      >
                        <FiX size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Image Upload */}
                <label className="cursor-pointer flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <FiImage className="text-gray-600" size={20} />
                  <span className="text-sm text-gray-600">Add Photos</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    disabled={isSubmitting || totalImages >= 5}
                  />
                </label>
                
                <span className="text-sm text-gray-500">
                  {totalImages}/5 images
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  disabled={isSubmitting || (!content.trim() && totalImages === 0)}
                  className="btn-primary flex items-center space-x-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="loading-spinner"></div>
                      <span>{isUploadingImages ? 'Uploading...' : 'Saving...'}</span>
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
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPostModal;