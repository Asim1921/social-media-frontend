'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { FiEdit2, FiCalendar, FiUser, FiPlus, FiGrid, FiCamera } from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';
import moment from 'moment';
import PostCard from '@/components/PostCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import CreatePost from '@/components/CreatePost';
import EditProfileModal from '@/components/EditProfileModal';
import { useInView } from 'react-intersection-observer';

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
  isHidden?: boolean;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const ProfilePage: React.FC = () => {
  const { username } = useParams();
  const router = useRouter();
  const { user: currentUser, updateUser } = useAuth();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'about'>('posts');

  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!currentUser) {
      router.push('/auth/login');
    }
  }, [currentUser, router]);

  // Fetch profile data
  useEffect(() => {
    if (username && currentUser) {
      fetchProfile();
    }
  }, [username, currentUser]);

  // Fetch posts
  useEffect(() => {
    if (profile) {
      fetchPosts(1, true);
    }
  }, [profile]);

  // Load more posts when intersection observer triggers
  useEffect(() => {
    if (inView && hasMore && !postsLoading && !loadingMore) {
      loadMorePosts();
    }
  }, [inView, hasMore, postsLoading, loadingMore]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/users/profile/${username}`);
      setProfile(response.data.user);
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      if (error.response?.status === 404) {
        toast.error('User not found');
        router.push('/');
      } else {
        toast.error('Failed to load profile');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async (pageNum: number, reset: boolean = false) => {
    try {
      if (reset) {
        setPostsLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await axios.get(`${API_BASE_URL}/posts/user/${username}?page=${pageNum}&limit=10`);
      const newPosts = response.data.posts;

      if (reset) {
        setPosts(newPosts);
      } else {
        setPosts(prev => [...prev, ...newPosts]);
      }

      setHasMore(newPosts.length === 10);
      setPage(pageNum + 1);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to load posts');
    } finally {
      setPostsLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMorePosts = () => {
    if (!loadingMore && hasMore) {
      fetchPosts(page);
    }
  };

  const handlePostUpdate = (updatedPost: Post) => {
    setPosts(prev => prev.map(post => 
      post._id === updatedPost._id ? updatedPost : post
    ));
  };

  const handlePostDelete = (postId: string) => {
    setPosts(prev => prev.filter(post => post._id !== postId));
    setProfile(prev => prev ? { ...prev, postsCount: prev.postsCount - 1 } : null);
    toast.success('Post deleted successfully');
  };

  const handleNewPost = (newPost: Post) => {
    setPosts(prev => [newPost, ...prev]);
    setProfile(prev => prev ? { ...prev, postsCount: prev.postsCount + 1 } : null);
    setShowCreatePost(false);
    toast.success('Post shared successfully! ✨');
  };

  const handleProfileUpdate = (updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
    if (currentUser && updatedProfile._id === currentUser._id) {
      // Update auth context if editing own profile
      updateUser({
        username: updatedProfile.username,
        bio: updatedProfile.bio,
        profilePicture: updatedProfile.profilePicture,
      });
    }
  };

  if (!currentUser) {
    return null; // Don't render anything while redirecting
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 animate-pulse">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-12 text-center max-w-md">
          <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiUser size={32} className="text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">User Not Found</h2>
          <p className="text-gray-600 mb-6">The user you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push('/')}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold px-6 py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser._id === profile._id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 relative z-10">
        {/* Profile Header */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8 mb-6">
          <div className="flex flex-col lg:flex-row items-center lg:items-start space-y-6 lg:space-y-0 lg:space-x-8">
            {/* Profile Picture */}
            <div className="flex-shrink-0 relative group">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 p-1">
                <img
                  src={profile.profilePicture || '/default-avatar.png'}
                  alt={profile.username}
                  className="w-full h-full rounded-full object-cover bg-white p-1"
                />
              </div>
              {isOwnProfile && (
                <button
                  onClick={() => setShowEditModal(true)}
                  className="absolute bottom-2 right-2 bg-white rounded-full p-2 shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors group-hover:scale-110 duration-200"
                >
                  <FiCamera size={16} className="text-gray-600" />
                </button>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center lg:text-left">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {profile.username}
                  </h1>
                  <p className="text-gray-600 text-lg">{profile.email}</p>
                </div>

                {isOwnProfile && (
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold px-6 py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg flex items-center space-x-2 mt-4 lg:mt-0"
                  >
                    <FiEdit2 size={16} />
                    <span>Edit Profile</span>
                  </button>
                )}
              </div>

              {/* Bio */}
              {profile.bio && (
                <div className="bg-gray-50/50 rounded-xl p-4 mb-6">
                  <p className="text-gray-700 leading-relaxed">
                    {profile.bio}
                  </p>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 mb-6">
                <div className="text-center p-4 bg-gray-50/50 rounded-xl">
                  <span className="block text-2xl font-bold text-gray-900 mb-1">
                    {posts.length}
                  </span>
                  <span className="text-sm text-gray-600 font-medium">Posts</span>
                </div>
                <div className="text-center p-4 bg-gray-50/50 rounded-xl">
                  <span className="block text-2xl font-bold text-gray-900 mb-1">
                    {profile.followersCount || 0}
                  </span>
                  <span className="text-sm text-gray-600 font-medium">Followers</span>
                </div>
                <div className="text-center p-4 bg-gray-50/50 rounded-xl">
                  <span className="block text-2xl font-bold text-gray-900 mb-1">
                    {profile.followingCount || 0}
                  </span>
                  <span className="text-sm text-gray-600 font-medium">Following</span>
                </div>
              </div>

              {/* Join Date */}
              <div className="flex items-center justify-center lg:justify-start space-x-2 text-gray-500">
                <FiCalendar size={18} />
                <span className="font-medium">Joined {moment(profile.createdAt).format('MMMM YYYY')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-2 mb-6">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('posts')}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl transition-all duration-300 font-semibold ${
                activeTab === 'posts' 
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <FiGrid size={18} />
              <span>Posts</span>
              <span className="bg-white/20 text-xs px-2 py-1 rounded-full">{posts.length}</span>
            </button>
            
            <button
              onClick={() => setActiveTab('about')}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl transition-all duration-300 font-semibold ${
                activeTab === 'about' 
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <FiUser size={18} />
              <span>About</span>
            </button>
          </div>
        </div>

        {/* Create Post Section (Only for own profile) */}
        {isOwnProfile && activeTab === 'posts' && (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 mb-6">
            {!showCreatePost ? (
              <button
                onClick={() => setShowCreatePost(true)}
                className="w-full p-6 text-left hover:bg-gray-50/50 transition-all duration-300 rounded-2xl group"
              >
                <div className="flex items-center space-x-4">
                  <img
                    src={currentUser.profilePicture || '/default-avatar.png'}
                    alt={currentUser.username}
                    className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 group-hover:border-purple-300 transition-colors"
                  />
                  <div className="flex-1">
                    <p className="text-gray-500 text-lg group-hover:text-gray-700 transition-colors">
                      Share something new with your followers...
                    </p>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <FiPlus size={24} className="text-purple-500" />
                  </div>
                </div>
              </button>
            ) : (
              <div className="p-6">
                <CreatePost onPostCreated={handleNewPost} />
              </div>
            )}
          </div>
        )}

        {/* Content */}
        {activeTab === 'posts' ? (
          <div>
            {/* Posts Feed */}
            {postsLoading ? (
              <div className="flex justify-center py-12">
                <div className="text-center">
                  <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-600">Loading posts...</p>
                </div>
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-20">
                <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-12 max-w-md mx-auto">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FiUser size={32} className="text-purple-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    No posts yet
                  </h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {isOwnProfile 
                      ? "You haven't shared anything yet. Create your first post!" 
                      : `${profile.username} hasn't posted anything yet.`
                    }
                  </p>
                  {isOwnProfile && (
                    <button
                      onClick={() => setShowCreatePost(true)}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold px-6 py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg"
                    >
                      Create Your First Post ✨
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {posts.map((post, index) => (
                  <div 
                    key={post._id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <PostCard
                      post={post}
                      currentUser={currentUser}
                      onPostUpdate={handlePostUpdate}
                      onPostDelete={handlePostDelete}
                    />
                  </div>
                ))}

                {/* Load More Trigger */}
                {hasMore && !postsLoading && (
                  <div ref={loadMoreRef} className="flex justify-center py-8">
                    {loadingMore && (
                      <div className="text-center">
                        <div className="w-6 h-6 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-2"></div>
                        <p className="text-gray-600 text-sm">Loading more posts...</p>
                      </div>
                    )}
                  </div>
                )}

                {/* End of Posts */}
                {!hasMore && posts.length > 0 && (
                  <div className="text-center py-12">
                    <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 max-w-sm mx-auto">
                      <div className="text-3xl mb-2">🎉</div>
                      <p className="text-gray-700 font-semibold">All caught up!</p>
                      <p className="text-gray-500 text-sm mt-1">You've seen all posts</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* About Tab */
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">About {profile.username}</h3>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50/50 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Username</h4>
                  <p className="text-gray-700">@{profile.username}</p>
                </div>
                
                <div className="bg-gray-50/50 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Email</h4>
                  <p className="text-gray-700">{profile.email}</p>
                </div>
                
                <div className="bg-gray-50/50 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Member Since</h4>
                  <p className="text-gray-700">{moment(profile.createdAt).format('MMMM Do, YYYY')}</p>
                </div>
                
                <div className="bg-gray-50/50 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Total Posts</h4>
                  <p className="text-gray-700">{posts.length} posts shared</p>
                </div>
              </div>

              {profile.bio && (
                <div className="bg-gray-50/50 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Bio</h4>
                  <p className="text-gray-700 leading-relaxed">{profile.bio}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <EditProfileModal
          profile={profile}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onProfileUpdated={handleProfileUpdate}
        />
      )}
    </div>
  );
};

export default ProfilePage;