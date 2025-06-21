'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import moment from 'moment';
import { FiHeart, FiSend, FiMessageCircle } from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useInView } from 'react-intersection-observer';
import LoadingSpinner from './LoadingSpinner';

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

interface CommentsSectionProps {
  postId: string;
  comments: Comment[];
  currentUser: User;
  onCommentAdded: (updatedPost: any) => void;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const CommentsSection: React.FC<CommentsSectionProps> = ({
  postId,
  comments,
  currentUser,
  onCommentAdded
}) => {
  const router = useRouter();
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [likingComments, setLikingComments] = useState<Set<string>>(new Set());
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [visibleComments, setVisibleComments] = useState(5);
  const [loadingMore, setLoadingMore] = useState(false);

  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  });

  React.useEffect(() => {
    if (inView && visibleComments < comments.length && !loadingMore) {
      setLoadingMore(true);
      setTimeout(() => {
        setVisibleComments(prev => Math.min(prev + 5, comments.length));
        setLoadingMore(false);
      }, 500);
    }
  }, [inView, visibleComments, comments.length, loadingMore]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/posts/${postId}/comments`, {
        content: newComment.trim()
      });

      onCommentAdded(response.data.post);
      setNewComment('');
      toast.success('Comment added successfully!');
    } catch (error: any) {
      console.error('Error adding comment:', error);
      toast.error(error.response?.data?.message || 'Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReply = async (commentId: string) => {
    if (!replyContent.trim()) {
      toast.error('Please enter a reply');
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/posts/${postId}/comments/${commentId}/replies`, {
        content: replyContent.trim()
      });

      onCommentAdded(response.data.post);
      setReplyContent('');
      setReplyingTo(null);
      setExpandedComments(prev => new Set([...prev, commentId]));
      toast.success('Reply added successfully!');
    } catch (error: any) {
      console.error('Error adding reply:', error);
      toast.error(error.response?.data?.message || 'Failed to add reply');
    }
  };

  const handleLikeComment = async (commentId: string, isReply: boolean = false, parentCommentId?: string) => {
    if (likingComments.has(commentId)) return;

    setLikingComments(prev => new Set([...prev, commentId]));

    try {
      const url = isReply 
        ? `${API_BASE_URL}/posts/${postId}/comments/${parentCommentId}/replies/${commentId}/like`
        : `${API_BASE_URL}/posts/${postId}/comments/${commentId}/like`;
        
      const response = await axios.post(url);
      onCommentAdded(response.data.post);
    } catch (error: any) {
      console.error('Error liking comment:', error);
      toast.error(error.response?.data?.message || 'Failed to like comment');
    } finally {
      setLikingComments(prev => {
        const newSet = new Set(prev);
        newSet.delete(commentId);
        return newSet;
      });
    }
  };

  const handleProfileClick = (username: string) => {
    router.push(`/profile/${username}`);
  };

  const toggleReplies = (commentId: string) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  const renderComment = (comment: Comment, isReply: boolean = false, parentCommentId?: string) => {
    const isLiked = comment.likes.includes(currentUser._id);
    const isLiking = likingComments.has(comment._id);

    return (
      <div key={comment._id} className={`${isReply ? 'ml-8 border-l-2 border-gray-100 pl-4' : ''}`}>
        <div className="flex items-start space-x-3">
          <button
            onClick={() => handleProfileClick(comment.author.username)}
            className="flex-shrink-0"
          >
            <img
              src={comment.author.profilePicture || '/default-avatar.png'}
              alt={comment.author.username}
              className="profile-pic-sm"
            />
          </button>

          <div className="flex-1 min-w-0">
            <div className="bg-gray-100 rounded-lg px-3 py-2">
              <button
                onClick={() => handleProfileClick(comment.author.username)}
                className="font-medium text-sm text-gray-900 hover:text-primary-600"
              >
                {comment.author.username}
              </button>
              <p className="text-sm text-gray-800 mt-1 break-words">
                {comment.content}
              </p>
            </div>

            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
              <span>{moment(comment.createdAt).fromNow()}</span>
              
              <button
                onClick={() => handleLikeComment(comment._id, isReply, parentCommentId)}
                disabled={isLiking}
                className={`flex items-center space-x-1 hover:text-red-600 transition-colors ${
                  isLiked ? 'text-red-600' : ''
                } disabled:opacity-50`}
              >
                <FiHeart size={12} className={isLiked ? 'fill-current' : ''} />
                <span>{comment.likes.length > 0 ? comment.likes.length : 'Like'}</span>
              </button>

              {!isReply && (
                <button
                  onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
                  className="hover:text-primary-600 transition-colors"
                >
                  Reply
                </button>
              )}

              {!isReply && comment.replies.length > 0 && (
                <button
                  onClick={() => toggleReplies(comment._id)}
                  className="hover:text-primary-600 transition-colors flex items-center space-x-1"
                >
                  <FiMessageCircle size={12} />
                  <span>
                    {expandedComments.has(comment._id) ? 'Hide' : 'View'} {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                  </span>
                </button>
              )}
            </div>

            {/* Reply Input */}
            {replyingTo === comment._id && (
              <div className="mt-3">
                <div className="flex items-start space-x-2">
                  <img
                    src={currentUser.profilePicture || '/default-avatar.png'}
                    alt={currentUser.username}
                    className="profile-pic-sm"
                  />
                  <div className="flex-1">
                    <textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder={`Reply to ${comment.author.username}...`}
                      className="form-textarea w-full h-16 text-sm resize-none"
                      maxLength={200}
                    />
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-400">{replyContent.length}/200</span>
                      <div className="space-x-2">
                        <button
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyContent('');
                          }}
                          className="btn-secondary text-xs px-3 py-1"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSubmitReply(comment._id)}
                          disabled={!replyContent.trim()}
                          className="btn-primary text-xs px-3 py-1 disabled:opacity-50"
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Replies */}
            {expandedComments.has(comment._id) && comment.replies.length > 0 && (
              <div className="mt-3 space-y-3">
                {comment.replies.map((reply) => 
                  renderComment(reply, true, comment._id)
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 space-y-4">
      {/* Add Comment Form */}
      <form onSubmit={handleSubmitComment} className="flex items-start space-x-3">
        <img
          src={currentUser.profilePicture || '/default-avatar.png'}
          alt={currentUser.username}
          className="profile-pic-sm"
        />
        <div className="flex-1">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="form-textarea w-full h-16 resize-none"
            maxLength={500}
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-400">{newComment.length}/500</span>
            <button
              type="submit"
              disabled={isSubmitting || !newComment.trim()}
              className="btn-primary text-sm flex items-center space-x-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="loading-spinner"></div>
                  <span>Posting...</span>
                </>
              ) : (
                <>
                  <FiSend size={14} />
                  <span>Comment</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Comments List */}
      {comments.length > 0 ? (
        <div className="space-y-4">
          {comments.slice(0, visibleComments).map((comment) => 
            renderComment(comment)
          )}

          {/* Load More Comments */}
          {visibleComments < comments.length && (
            <div ref={loadMoreRef} className="flex justify-center py-4">
              {loadingMore ? (
                <LoadingSpinner />
              ) : (
                <button
                  onClick={() => setVisibleComments(prev => Math.min(prev + 5, comments.length))}
                  className="btn-secondary text-sm"
                >
                  Load more comments ({comments.length - visibleComments} remaining)
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-gray-500 text-sm">No comments yet. Be the first to comment!</p>
        </div>
      )}
    </div>
  );
};

export default CommentsSection;