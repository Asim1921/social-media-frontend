'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FiImage, FiX, FiSend, FiSmile, FiMapPin, FiUsers } from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';

interface CreatePostProps {
  onPostCreated: (post: any) => void;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const CreatePost: React.FC<CreatePostProps> = ({ onPostCreated }) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const emojis = ['😀', '😂', '🥰', '😍', '🤔', '👍', '❤️', '🔥', '✨', '🎉', '💯', '🚀'];

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
    
    // Validate number of images (max 5)
    if (images.length + files.length > 5) {
      toast.error('You can upload maximum 5 images per post');
      return;
    }

    // Validate file types and sizes
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error(`${file.name} is too large. Maximum size is 10MB`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    // Add to images array
    setImages(prev => [...prev, ...validFiles]);

    // Create previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const addEmoji = (emoji: string) => {
    setContent(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() && images.length === 0) {
      toast.error('Please add some content or images to your post');
      return;
    }

    setIsSubmitting(true);
    setIsUploadingImages(true);

    try {
      // Upload images to Cloudinary
      let imageUrls: string[] = [];
      if (images.length > 0) {
        const uploadPromises = images.map(image => uploadToCloudinary(image));
        imageUrls = await Promise.all(uploadPromises);
        toast.success('Images uploaded successfully! ✨');
      }

      setIsUploadingImages(false);

      // Create post
      const postData = {
        content: content.trim(),
        images: imageUrls,
      };

      const response = await axios.post(`${API_BASE_URL}/posts`, postData);
      
      // Reset form
      setContent('');
      setImages([]);
      setImagePreviews([]);
      
      // Notify parent component
      onPostCreated(response.data.post);
      
      toast.success('Post shared successfully! 🎉');
    } catch (error: any) {
      console.error('Error creating post:', error);
      toast.error(error.response?.data?.message || 'Failed to create post');
    } finally {
      setIsSubmitting(false);
      setIsUploadingImages(false);
    }
  };

  if (!user) return null;

  return (
    <div className="glass rounded-2xl p-6 animate-scale-in">
      <form onSubmit={handleSubmit}>
        {/* User Info */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative">
            <img
              src={user.profilePicture || '/default-avatar.png'}
              alt={user.username}
              className="profile-pic-lg"
            />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-black"></div>
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">{user.username}</h3>
            <p className="text-gray-400">Share your thoughts with the world ✨</p>
          </div>
        </div>

        {/* Content Input */}
        <div className="mb-6">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's happening in your world? Share your story..."
            className="w-full h-32 bg-transparent border-none resize-none text-white text-lg placeholder-gray-400 focus:outline-none leading-relaxed"
            maxLength={2000}
          />
          <div className="flex justify-between items-center mt-2">
            <div className="text-sm text-gray-400">
              {content.length}/2000 characters
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full border-2 ${
                content.length > 1800 ? 'border-red-500' : 
                content.length > 1500 ? 'border-yellow-500' : 
                'border-gray-600'
              } flex items-center justify-center`}>
                <div className={`w-4 h-4 rounded-full ${
                  content.length > 1800 ? 'bg-red-500' : 
                  content.length > 1500 ? 'bg-yellow-500' : 
                  'bg-gray-600'
                }`}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Image Previews */}
        {imagePreviews.length > 0 && (
          <div className="mb-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-32 object-cover rounded-xl border border-white/20"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 w-8 h-8 bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/70 hover:scale-110"
                    disabled={isSubmitting}
                  >
                    <FiX size={16} className="text-white" />
                  </button>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <div className="flex items-center space-x-4">
            {/* Image Upload */}
            <label className="cursor-pointer flex items-center space-x-2 px-4 py-2 rounded-xl hover:bg-white/10 transition-all group">
              <FiImage className="text-blue-400 group-hover:scale-110 transition-transform" size={20} />
              <span className="text-gray-300 group-hover:text-white font-medium">Photos</span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
                disabled={isSubmitting || images.length >= 5}
              />
            </label>

            {/* Emoji Picker */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl hover:bg-white/10 transition-all group"
              >
                <FiSmile className="text-yellow-400 group-hover:scale-110 transition-transform" size={20} />
                <span className="text-gray-300 group-hover:text-white font-medium">Emoji</span>
              </button>

              {showEmojiPicker && (
                <div className="absolute bottom-12 left-0 glass rounded-2xl p-4 shadow-xl border border-white/10 z-20 animate-scale-in">
                  <div className="grid grid-cols-6 gap-2">
                    {emojis.map((emoji, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => addEmoji(emoji)}
                        className="w-10 h-10 rounded-xl hover:bg-white/10 transition-all hover:scale-110 text-xl"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Location (placeholder) */}
            <button
              type="button"
              className="flex items-center space-x-2 px-4 py-2 rounded-xl hover:bg-white/10 transition-all group"
            >
              <FiMapPin className="text-green-400 group-hover:scale-110 transition-transform" size={20} />
              <span className="text-gray-300 group-hover:text-white font-medium">Location</span>
            </button>

            {/* Tag People (placeholder) */}
            <button
              type="button"
              className="flex items-center space-x-2 px-4 py-2 rounded-xl hover:bg-white/10 transition-all group"
            >
              <FiUsers className="text-purple-400 group-hover:scale-110 transition-transform" size={20} />
              <span className="text-gray-300 group-hover:text-white font-medium">Tag</span>
            </button>
            
            {images.length > 0 && (
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span>{images.length}/5 images selected</span>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || (!content.trim() && images.length === 0)}
            className="btn-primary flex items-center space-x-3 px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-all"
          >
            {isSubmitting ? (
              <>
                <div className="loading-spinner small"></div>
                <span className="font-semibold">
                  {isUploadingImages ? 'Uploading...' : 'Sharing...'}
                </span>
              </>
            ) : (
              <>
                <FiSend size={18} />
                <span className="font-semibold">Share Post</span>
              </>
            )}
          </button>
        </div>

        {/* Progress Indicator */}
        {isSubmitting && (
          <div className="mt-4">
            <div className="flex items-center space-x-3">
              <div className="flex-1 bg-gray-700 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full bg-gradient-to-r from-pink-500 to-purple-600 transition-all duration-1000 ${
                    isUploadingImages ? 'w-1/2' : 'w-full'
                  }`}
                ></div>
              </div>
              <span className="text-sm text-gray-400 font-medium">
                {isUploadingImages ? 'Uploading media...' : 'Publishing post...'}
              </span>
            </div>
          </div>
        )}
      </form>

      {/* Click outside to close emoji picker */}
      {showEmojiPicker && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowEmojiPicker(false)}
        />
      )}
    </div>
  );
};

export default CreatePost;