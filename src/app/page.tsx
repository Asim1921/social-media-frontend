'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import CreatePost from '@/components/CreatePost';
import PostCard from '@/components/PostCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useInView } from 'react-intersection-observer';
import { FiTrendingUp, FiClock, FiHome, FiPlus, FiUsers, FiHeart, FiMessageCircle, FiBookmark } from 'react-icons/fi';
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
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
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

interface UserProfile {
  _id: string;
  username: string;
  profilePicture: string;
  bio: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
}

interface SuggestedUser {
  _id: string;
  username: string;
  profilePicture: string;
  bio: string;
  mutualFriends: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const HomePage: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sortBy, setSortBy] = useState<'new' | 'hot' | 'top'>('hot');
  const [showCreatePost, setShowCreatePost] = useState(false);

  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  });

  // Stories data (mock for now - can be made dynamic later)
  const stories = [
    { id: '1', username: 'your_story', image: user?.profilePicture, isYourStory: true },
    { id: '2', username: 'alex_dev', image: '/api/placeholder/40/40' },
    { id: '3', username: 'sarah_ui', image: '/api/placeholder/40/40' },
    { id: '4', username: 'mike_photo', image: '/api/placeholder/40/40' },
    { id: '5', username: 'emma_art', image: '/api/placeholder/40/40' },
    { id: '6', username: 'david_code', image: '/api/placeholder/40/40' },
  ];

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
    }
  }, [user, router]);

  // Load initial data
  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchSuggestedUsers();
      fetchPosts(1, true);
    }
  }, [user]);

  // Reload posts when sort changes
  useEffect(() => {
    if (user) {
      fetchPosts(1, true);
    }
  }, [sortBy]);

  // Load more posts when intersection observer triggers
  useEffect(() => {
    if (inView && hasMore && !loading && !loadingMore && user) {
      loadMorePosts();
    }
  }, [inView, hasMore, loading, loadingMore, user]);

  const fetchUserProfile = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/users/profile/${user?.username}`);
      setUserProfile(response.data.user);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchSuggestedUsers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/users/suggested?limit=3`);
      setSuggestedUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching suggested users:', error);
      setSuggestedUsers([]);
    }
  };

  const fetchPosts = async (pageNum: number, reset: boolean = false) => {
    try {
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      // Build query parameters for sorting
      let sortParam = '';
      switch (sortBy) {
        case 'top':
          sortParam = 'likes'; // Sort by most likes
          break;
        case 'hot':
          sortParam = 'comments'; // Sort by most comments
          break;
        case 'new':
        default:
          sortParam = 'createdAt'; // Sort by newest
          break;
      }

      const response = await axios.get(`${API_BASE_URL}/posts?page=${pageNum}&limit=10&sortBy=${sortParam}`);
      const newPosts = response.data.posts;

      if (reset) {
        setPosts(newPosts);
        setPage(2); // Reset to page 2 for next load
      } else {
        setPosts(prev => [...prev, ...newPosts]);
        setPage(pageNum + 1);
      }

      setHasMore(newPosts.length === 10);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMorePosts = () => {
    if (!loadingMore && hasMore) {
      fetchPosts(page);
    }
  };

  const handleNewPost = (newPost: Post) => {
    setPosts(prev => [newPost, ...prev]);
    setShowCreatePost(false);
    // Update user profile post count
    if (userProfile) {
      setUserProfile(prev => prev ? { ...prev, postsCount: prev.postsCount + 1 } : null);
    }
    toast.success('Post shared successfully! ✨');
  };

  const handlePostUpdate = (updatedPost: Post) => {
    setPosts(prev => prev.map(post => 
      post._id === updatedPost._id ? updatedPost : post
    ));
  };

  const handlePostDelete = (postId: string) => {
    setPosts(prev => prev.filter(post => post._id !== postId));
    // Update user profile post count
    if (userProfile) {
      setUserProfile(prev => prev ? { ...prev, postsCount: prev.postsCount - 1 } : null);
    }
    toast.success('Post deleted successfully');
  };

  const handleFollowUser = async (userId: string) => {
    try {
      await axios.post(`${API_BASE_URL}/users/${userId}/follow`);
      // Remove from suggested users after following
      setSuggestedUsers(prev => prev.filter(user => user._id !== userId));
      // Update follower count
      if (userProfile) {
        setUserProfile(prev => prev ? { ...prev, followingCount: prev.followingCount + 1 } : null);
      }
      toast.success('User followed successfully!');
    } catch (error) {
      console.error('Error following user:', error);
      toast.error('Failed to follow user');
    }
  };

  const handleSortChange = (newSort: 'new' | 'hot' | 'top') => {
    setSortBy(newSort);
    setPage(1);
    setHasMore(true);
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 animate-pulse">Loading your feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>

      <div className="max-w-6xl mx-auto flex gap-8 px-4 py-6 relative z-10">
        {/* Main Content */}
        <div className="flex-1 max-w-2xl mx-auto">
          {/* Create Post Section */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 mb-6">
            {!showCreatePost ? (
              <button
                onClick={() => setShowCreatePost(true)}
                className="w-full p-6 text-left hover:bg-gray-50/50 transition-all duration-300 rounded-2xl group"
              >
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <img
                      src={user.profilePicture || '/default-avatar.png'}
                      alt={user.username}
                      className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 group-hover:border-blue-300 transition-colors"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-500 text-lg group-hover:text-gray-700 transition-colors">
                      What's on your mind, {user.username}?
                    </p>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <FiPlus size={24} className="text-blue-500" />
                  </div>
                </div>
              </button>
            ) : (
              <div className="p-6">
                <CreatePost onPostCreated={handleNewPost} />
              </div>
            )}
          </div>

          {/* Posts Feed */}
          <div className="space-y-6">
            {posts.length === 0 ? (
              <div className="text-center py-20">
                <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-12 max-w-md mx-auto">
                  <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-8">
                    <FiHome size={48} className="text-blue-500" />
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-4">Welcome to SocialApp!</h3>
                  <p className="text-gray-600 mb-8 leading-relaxed">
                    Your feed is empty. Start following people or create your first post to see content here!
                  </p>
                  <button
                    onClick={() => setShowCreatePost(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold px-8 py-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg"
                  >
                    Share Your First Post ✨
                  </button>
                </div>
              </div>
            ) : (
              posts.map((post, index) => (
                <div 
                  key={post._id} 
                  className="animate-fade-in" 
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <PostCard
                    post={post}
                    currentUser={user}
                    onPostUpdate={handlePostUpdate}
                    onPostDelete={handlePostDelete}
                  />
                </div>
              ))
            )}

            {/* Load More Trigger */}
            {hasMore && !loading && (
              <div ref={loadMoreRef} className="flex justify-center py-12">
                {loadingMore && (
                  <div className="text-center">
                    <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-600">Loading more posts...</p>
                  </div>
                )}
              </div>
            )}

            {/* End of Feed */}
            {!hasMore && posts.length > 0 && (
              <div className="text-center py-16">
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8 max-w-sm mx-auto">
                  <div className="text-4xl mb-4">🎉</div>
                  <p className="text-gray-700 text-lg font-semibold">You're all caught up!</p>
                  <p className="text-gray-500 text-sm mt-2">Check back later for more posts</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="hidden lg:block w-80">
          <div className="sticky top-24 space-y-6">
            {/* User Profile Card */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className="relative">
                  <img
                    src={user.profilePicture || '/default-avatar.png'}
                    alt={user.username}
                    className="w-16 h-16 rounded-full object-cover border-3 border-gray-200"
                  />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{user.username}</h3>
                  <p className="text-gray-600">Welcome back! ✨</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-6 text-center">
                <div className="group cursor-pointer" onClick={() => router.push(`/profile/${user.username}`)}>
                  <p className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {userProfile?.postsCount || posts.filter(p => p.author._id === user._id).length}
                  </p>
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Posts</p>
                </div>
                <div className="group cursor-pointer" onClick={() => router.push(`/profile/${user.username}`)}>
                  <p className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {userProfile?.followersCount || 0}
                  </p>
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Followers</p>
                </div>
                <div className="group cursor-pointer" onClick={() => router.push(`/profile/${user.username}`)}>
                  <p className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {userProfile?.followingCount || 0}
                  </p>
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Following</p>
                </div>
              </div>
            </div>

            {/* Suggested Users */}
            {suggestedUsers.length > 0 && (
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-gray-900 text-lg">Suggested for you</h3>
                  <button 
                    onClick={() => router.push('/explore/people')}
                    className="text-blue-600 hover:text-blue-800 transition-colors text-sm font-semibold"
                  >
                    See All
                  </button>
                </div>
                
                <div className="space-y-4">
                  {suggestedUsers.map((suggestedUser, index) => (
                    <div 
                      key={suggestedUser._id} 
                      className="flex items-center justify-between group"
                    >
                      <button
                        onClick={() => router.push(`/profile/${suggestedUser.username}`)}
                        className="flex items-center space-x-3 flex-1 text-left"
                      >
                        <img
                          src={suggestedUser.profilePicture || '/default-avatar.png'}
                          alt={suggestedUser.username}
                          className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 group-hover:border-blue-300 transition-colors"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm group-hover:text-blue-600 transition-colors truncate">
                            {suggestedUser.username}
                          </p>
                          <p className="text-gray-500 text-xs truncate">
                            {suggestedUser.bio || `${suggestedUser.mutualFriends || 0} mutual connections`}
                          </p>
                        </div>
                      </button>
                      <button 
                        onClick={() => handleFollowUser(suggestedUser._id)}
                        className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200 shadow-sm"
                      >
                        Follow
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
              <h3 className="font-bold text-gray-900 text-lg mb-6">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => router.push('/liked-posts')}
                  className="flex flex-col items-center p-4 rounded-xl bg-gray-50/50 hover:bg-gray-100/50 transition-all group border border-gray-200/50"
                >
                  <FiHeart className="text-red-500 mb-2 group-hover:scale-110 transition-transform" size={24} />
                  <span className="text-xs text-gray-600 group-hover:text-gray-900 transition-colors font-medium">Liked Posts</span>
                </button>
                <button 
                  onClick={() => router.push('/saved-posts')}
                  className="flex flex-col items-center p-4 rounded-xl bg-gray-50/50 hover:bg-gray-100/50 transition-all group border border-gray-200/50"
                >
                  <FiBookmark className="text-blue-500 mb-2 group-hover:scale-110 transition-transform" size={24} />
                  <span className="text-xs text-gray-600 group-hover:text-gray-900 transition-colors font-medium">Saved</span>
                </button>
                <button 
                  onClick={() => router.push('/following')}
                  className="flex flex-col items-center p-4 rounded-xl bg-gray-50/50 hover:bg-gray-100/50 transition-all group border border-gray-200/50"
                >
                  <FiUsers className="text-green-500 mb-2 group-hover:scale-110 transition-transform" size={24} />
                  <span className="text-xs text-gray-600 group-hover:text-gray-900 transition-colors font-medium">Following</span>
                </button>
                <button 
                  onClick={() => router.push('/messages')}
                  className="flex flex-col items-center p-4 rounded-xl bg-gray-50/50 hover:bg-gray-100/50 transition-all group border border-gray-200/50"
                >
                  <FiMessageCircle className="text-purple-500 mb-2 group-hover:scale-110 transition-transform" size={24} />
                  <span className="text-xs text-gray-600 group-hover:text-gray-900 transition-colors font-medium">Messages</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;