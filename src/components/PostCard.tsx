'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import moment from 'moment';
import { FiHeart, FiMessageCircle, FiMoreHorizontal, FiEdit2, FiTrash2, FiEyeOff, FiSend, FiBookmark, FiShare } from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';
import ImageGallery from './ImageGallery';
import LikesModal from './LikesModal';
import CommentsSection from './CommentsSection';
import EditPostModal from './EditPostModal';

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
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
  isHidden?: boolean;
}

interface Comment {
  _id: string;
  content: string;
  author: {
    _id: string;
    username: string;
    profilePicture: string;
  };
  likes: string[];
  replies: Comment[];
  createdAt: string;
}

interface User {
  _id: string;
  username: string;
  profilePicture: string;
}

interface PostCardProps {
  post: Post;
  currentUser: User;
  onPostUpdate: (post: Post) => void;
  onPostDelete: (postId: string) => void;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const PostCard: React.FC<PostCardProps> = ({ post, currentUser, onPostUpdate, onPostDelete }) => {
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showLikes, setShowLikes] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);

  const isLiked = post.likes.includes(currentUser._id);
  const isOwnPost = post.author._id === currentUser._id;

  // Get the most liked comment
  const mostLikedComment = post.comments.reduce((prev, current) => {
    return (prev?.likes?.length > current?.likes?.length) ? prev : current;
  }, post.comments[0]);

  const handleLike = async () => {
    if (isLiking) return;
    
    setIsLiking(true);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/posts/${post._id}/like`);
      onPostUpdate(response.data.post);
      
      // Add heart animation
      if (!isLiked) {
        const heartElement = document.querySelector(`#heart-${post._id}`);
        if (heartElement) {
          heartElement.classList.add('animate-heart-beat');
          setTimeout(() => {
            heartElement.classList.remove('animate-heart-beat');
          }, 1500);
        }
      }
    } catch (error: any) {
      console.error('Error liking post:', error);
      toast.error(error.response?.data?.message || 'Failed to like post');
    } finally {
      setIsLiking(false);
    }
  };

  const handleProfileClick = (username: string) => {
    router.push(`/profile/${username}`);
  };

  const handleHidePost = async () => {
    try {
      const response = await axios.patch(`${API_BASE_URL}/posts/${post._id}/hide`);
      onPostUpdate(response.data.post);
      toast.success('Post visibility updated');
      setShowDropdown(false);
    } catch (error: any) {
      console.error('Error hiding post:', error);
      toast.error(error.response?.data?.message || 'Failed to update post');
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    
    try {
      await axios.delete(`${API_BASE_URL}/posts/${post._id}`);
      onPostDelete(post._id);
      setShowDropdown(false);
      toast.success('Post deleted successfully');
    } catch (error: any) {
      console.error('Error deleting post:', error);
      toast.error(error.response?.data?.message || 'Failed to delete post');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCommentAdded = (updatedPost: Post) => {
    onPostUpdate(updatedPost);
  };

  const handleSavePost = () => {
    setIsSaved(!isSaved);
    toast.success(isSaved ? 'Post removed from saved' : 'Post saved successfully');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${post.author.username}'s post`,
          text: post.content,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback - copy to clipboard
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  if (post.isHidden && !isOwnPost) {
    return null; // Don't show hidden posts to other users
  }

  const truncatedContent = post.content?.length > 150 ? post.content.slice(0, 150) + '...' : post.content;

  return (
    <div className={`post-card relative ${post.isHidden ? 'opacity-60' : ''} animate-fade-in`}>
      {/* Header */}
      <div className="p-6 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => handleProfileClick(post.author.username)}
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity group"
            >
              <div className="relative">
                <img
                  src={post.author.profilePicture || '/default-avatar.png'}
                  alt={post.author.username}
                  className="profile-pic-md group-hover:scale-105 transition-transform"
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-black"></div>
              </div>
              <div>
                <h3 className="font-bold text-white group-hover:text-pink-500 transition-colors">
                  {post.author.username}
                </h3>
                <p className="text-sm text-gray-400">
                  {moment(post.createdAt).fromNow()}
                  {post.updatedAt !== post.createdAt && (
                    <span className="ml-1 text-pink-500">• edited</span>
                  )}
                </p>
              </div>
            </button>
            {post.isHidden && (
              <div className="flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                <FiEyeOff size={12} className="mr-1" />
                Hidden
              </div>
            )}
          </div>

          {/* Post Options */}
          {isOwnPost && (
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="p-2 rounded-full hover:bg-white/10 transition-colors group"
              >
                <FiMoreHorizontal size={20} className="text-gray-400 group-hover:text-white" />
              </button>

              {showDropdown && (
                <div className="absolute right-0 top-12 glass rounded-2xl shadow-xl border border-white/10 py-2 z-20 min-w-[180px] animate-scale-in">
                  <button
                    onClick={() => {
                      setShowEditModal(true);
                      setShowDropdown(false);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-white/10 flex items-center space-x-3 transition-colors group"
                  >
                    <FiEdit2 size={16} className="text-blue-400 group-hover:scale-110 transition-transform" />
                    <span className="text-white">Edit Post</span>
                  </button>
                  
                  <button
                    onClick={handleHidePost}
                    className="w-full px-4 py-3 text-left hover:bg-white/10 flex items-center space-x-3 transition-colors group"
                  >
                    <FiEyeOff size={16} className="text-yellow-400 group-hover:scale-110 transition-transform" />
                    <span className="text-white">{post.isHidden ? 'Unhide' : 'Hide'} Post</span>
                  </button>
                  
                  <button
                    onClick={handleDeletePost}
                    disabled={isDeleting}
                    className="w-full px-4 py-3 text-left hover:bg-red-500/10 text-red-400 flex items-center space-x-3 disabled:opacity-50 transition-colors group"
                  >
                    <FiTrash2 size={16} className="group-hover:scale-110 transition-transform" />
                    <span>{isDeleting ? 'Deleting...' : 'Delete Post'}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {post.content && (
        <div className="px-6 pb-4 relative z-10">
          <p className="text-white text-lg leading-relaxed whitespace-pre-wrap break-words">
            {showFullContent || post.content.length <= 150 ? post.content : truncatedContent}
            {post.content.length > 150 && (
              <button
                onClick={() => setShowFullContent(!showFullContent)}
                className="text-pink-500 hover:text-pink-400 transition-colors ml-2 font-medium"
              >
                {showFullContent ? 'Show less' : 'Show more'}
              </button>
            )}
          </p>
        </div>
      )}

      {/* Images */}
      {post.images.length > 0 && (
        <div className="relative z-10">
          <ImageGallery images={post.images} />
        </div>
      )}

      {/* Engagement Stats */}
      <div className="px-6 py-4 border-t border-white/10 relative z-10">
        <div className="flex items-center justify-between text-sm">
          <button
            onClick={() => setShowLikes(true)}
            className="flex items-center space-x-2 hover:text-pink-500 transition-colors group"
            disabled={post.likes.length === 0}
          >
            <div className="flex -space-x-2">
              {post.likes.slice(0, 3).map((_, index) => (
                <div
                  key={index}
                  className="w-6 h-6 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full border-2 border-black flex items-center justify-center"
                >
                  <FiHeart size={10} className="text-white fill-current" />
                </div>
              ))}
            </div>
            <span className="text-gray-300 group-hover:text-pink-500 transition-colors font-medium">
              {post.likes.length} {post.likes.length === 1 ? 'like' : 'likes'}
            </span>
          </button>
          
          <button
            onClick={() => setShowComments(!showComments)}
            className="text-gray-300 hover:text-blue-400 transition-colors font-medium"
          >
            {post.comments.length} {post.comments.length === 1 ? 'comment' : 'comments'}
          </button>
        </div>

        {/* Most Liked Comment Preview */}
        {mostLikedComment && mostLikedComment.likes.length > 0 && (
          <div className="mt-4 p-4 glass rounded-xl animate-fade-in">
            <div className="flex items-start space-x-3">
              <img
                src={mostLikedComment.author.profilePicture || '/default-avatar.png'}
                alt={mostLikedComment.author.username}
                className="profile-pic-sm"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <button
                    onClick={() => handleProfileClick(mostLikedComment.author.username)}
                    className="font-semibold text-white hover:text-pink-500 transition-colors text-sm"
                  >
                    {mostLikedComment.author.username}
                  </button>
                  <div className="flex items-center space-x-1">
                    <FiHeart size={12} className="text-pink-500 fill-current" />
                    <span className="text-xs text-gray-400">{mostLikedComment.likes.length}</span>
                  </div>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {mostLikedComment.content.length > 80 
                    ? `${mostLikedComment.content.slice(0, 80)}...` 
                    : mostLikedComment.content
                  }
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="px-6 py-4 border-t border-white/10 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <button
              id={`heart-${post._id}`}
              onClick={handleLike}
              disabled={isLiking}
              className={`flex items-center space-x-2 transition-all duration-300 group ${
                isLiked
                  ? 'text-pink-500'
                  : 'text-gray-400 hover:text-pink-500'
              } disabled:opacity-50`}
            >
              <div className="relative">
                <FiHeart
                  size={24}
                  className={`${isLiked ? 'fill-current' : ''} group-hover:scale-110 transition-transform`}
                />
                {isLiking && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="loading-spinner small"></div>
                  </div>
                )}
              </div>
              <span className="font-semibold">
                {isLiked ? 'Liked' : 'Like'}
              </span>
            </button>

            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-2 text-gray-400 hover:text-blue-400 transition-colors group"
            >
              <FiMessageCircle size={24} className="group-hover:scale-110 transition-transform" />
              <span className="font-semibold">Comment</span>
            </button>

            <button
              onClick={handleShare}
              className="flex items-center space-x-2 text-gray-400 hover:text-green-400 transition-colors group"
            >
              <FiSend size={24} className="group-hover:scale-110 transition-transform" />
              <span className="font-semibold">Share</span>
            </button>
          </div>

          <button
            onClick={handleSavePost}
            className={`p-2 rounded-full transition-all duration-300 group ${
              isSaved
                ? 'text-yellow-500 bg-yellow-500/20'
                : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-500/10'
            }`}
          >
            <FiBookmark
              size={20}
              className={`${isSaved ? 'fill-current' : ''} group-hover:scale-110 transition-transform`}
            />
          </button>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-white/10 animate-slide-up relative z-10">
          <CommentsSection
            postId={post._id}
            comments={post.comments}
            currentUser={currentUser}
            onCommentAdded={handleCommentAdded}
          />
        </div>
      )}

      {/* Modals */}
      {showLikes && (
        <LikesModal
          postId={post._id}
          isOpen={showLikes}
          onClose={() => setShowLikes(false)}
        />
      )}

      {showEditModal && (
        <EditPostModal
          post={post}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onPostUpdated={onPostUpdate}
        />
      )}

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
};

export default PostCard;