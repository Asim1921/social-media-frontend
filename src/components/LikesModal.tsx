'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiX } from 'react-icons/fi';
import axios from 'axios';
import LoadingSpinner from './LoadingSpinner';
import { useInView } from 'react-intersection-observer';

interface User {
  _id: string;
  username: string;
  profilePicture: string;
  bio: string;
}

interface LikesModalProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const LikesModal: React.FC<LikesModalProps> = ({ postId, isOpen, onClose }) => {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  });

  useEffect(() => {
    if (isOpen) {
      fetchLikes(1, true);
    }
  }, [isOpen, postId]);

  useEffect(() => {
    if (inView && hasMore && !loading && !loadingMore) {
      loadMoreLikes();
    }
  }, [inView, hasMore, loading, loadingMore]);

  const fetchLikes = async (pageNum: number, reset: boolean = false) => {
    try {
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await axios.get(`${API_BASE_URL}/posts/${postId}/likes?page=${pageNum}&limit=20`);
      const newUsers = response.data.users;

      if (reset) {
        setUsers(newUsers);
      } else {
        setUsers(prev => [...prev, ...newUsers]);
      }

      setHasMore(newUsers.length === 20);
      setPage(pageNum + 1);
    } catch (error) {
      console.error('Error fetching likes:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreLikes = () => {
    if (!loadingMore && hasMore) {
      fetchLikes(page);
    }
  };

  const handleUserClick = (username: string) => {
    router.push(`/profile/${username}`);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleBackdropClick}>
      <div className="bg-white rounded-lg max-w-md w-full mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Likes</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="large" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No likes yet</p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {users.map((user) => (
                <div
                  key={user._id}
                  onClick={() => handleUserClick(user.username)}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                >
                  <img
                    src={user.profilePicture || '/default-avatar.png'}
                    alt={user.username}
                    className="profile-pic-md"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">
                      {user.username}
                    </h4>
                    {user.bio && (
                      <p className="text-sm text-gray-500 truncate">
                        {user.bio}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {/* Load More Trigger */}
              {hasMore && (
                <div ref={loadMoreRef} className="flex justify-center py-4">
                  {loadingMore && <LoadingSpinner />}
                </div>
              )}

              {!hasMore && users.length > 0 && (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">End of list</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LikesModal;