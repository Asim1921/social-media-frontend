'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { FiHome, FiUser, FiLogOut, FiMenu, FiX, FiSearch, FiMessageCircle } from 'react-icons/fi';
import { useRouter, usePathname } from 'next/navigation';
import axios from 'axios';
import { useDebounce } from 'use-debounce';

interface SearchUser {
  _id: string;
  username: string;
  profilePicture: string;
  bio: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchRef = useRef<HTMLDivElement>(null);
  
  // Debounce search query to avoid too many API calls
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Search users when debounced query changes
  useEffect(() => {
    if (debouncedSearchQuery.trim().length >= 2) {
      searchUsers(debouncedSearchQuery.trim());
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [debouncedSearchQuery]);

  // Handle clicks outside search dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const searchUsers = async (query: string) => {
    try {
      setIsSearching(true);
      const response = await axios.get(`${API_BASE_URL}/users/search?q=${encodeURIComponent(query)}&limit=8`);
      setSearchResults(response.data.users || []);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (value.trim().length >= 2) {
      setShowSearchResults(true);
    } else {
      setShowSearchResults(false);
    }
  };

  const handleUserSelect = (username: string) => {
    setSearchQuery('');
    setShowSearchResults(false);
    router.push(`/profile/${username}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // If there are results, go to the first one
      if (searchResults.length > 0) {
        handleUserSelect(searchResults[0].username);
      }
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
    setIsMobileMenuOpen(false);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const isActiveRoute = (route: string) => {
    return pathname === route;
  };

  if (!user) {
    return null; // Don't show navbar on auth pages
  }

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-lg border-b border-gray-200/50 shadow-lg' 
          : 'bg-white/80 backdrop-blur-sm'
      }`}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link 
              href="/" 
              className="flex items-center space-x-3 group"
              onClick={closeMobileMenu}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200 shadow-lg">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent hidden md:block">
                SocialApp
              </span>
            </Link>

            {/* Search Bar - Desktop */}
            <div className="hidden md:flex items-center flex-1 max-w-md mx-8" ref={searchRef}>
              <div className="relative w-full">
                <form onSubmit={handleSearchSubmit}>
                  <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                    className="w-full pl-12 pr-4 py-3 bg-white/50 border-2 border-gray-200 rounded-full text-gray-900 placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:bg-white transition-all duration-200"
                  />
                  {isSearching && (
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-purple-500 rounded-full animate-spin"></div>
                    </div>
                  )}
                </form>

                {/* Search Results Dropdown */}
                {showSearchResults && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-200/50 py-2 z-50 max-h-96 overflow-y-auto">
                    {searchResults.length > 0 ? (
                      <>
                        <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                          Users ({searchResults.length})
                        </div>
                        {searchResults.map((searchUser, index) => (
                          <button
                            key={searchUser._id}
                            onClick={() => handleUserSelect(searchUser.username)}
                            className="w-full px-4 py-3 flex items-center space-x-3 hover:bg-gray-50 transition-colors text-left"
                          >
                            <img
                              src={searchUser.profilePicture || '/default-avatar.png'}
                              alt={searchUser.username}
                              className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 truncate">
                                @{searchUser.username}
                              </p>
                              {searchUser.bio && (
                                <p className="text-sm text-gray-500 truncate">
                                  {searchUser.bio}
                                </p>
                              )}
                            </div>
                          </button>
                        ))}
                      </>
                    ) : (
                      <div className="px-4 py-6 text-center">
                        <FiSearch className="mx-auto text-gray-300 mb-2" size={24} />
                        <p className="text-gray-500 text-sm">
                          {isSearching ? 'Searching...' : 'No users found'}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <Link 
                href="/" 
                className={`p-3 rounded-xl transition-all duration-200 group ${isActiveRoute('/') ? 'bg-purple-100 text-purple-600' : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'}`}
              >
                <FiHome size={24} className="group-hover:scale-110 transition-transform" />
              </Link>

              <button className="p-3 rounded-xl text-gray-600 hover:text-purple-600 hover:bg-purple-50 transition-all duration-200 group">
                <FiMessageCircle size={24} className="group-hover:scale-110 transition-transform" />
              </button>

              {/* User Profile */}
              <div className="flex items-center space-x-4">
                <Link 
                  href={`/profile/${user.username}`}
                  className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-all duration-200 hover:scale-105 ${isActiveRoute(`/profile/${user.username}`) ? 'border-purple-500' : 'border-gray-200 hover:border-purple-300'}`}
                >
                  <img
                    src={user.profilePicture || '/default-avatar.png'}
                    alt={user.username}
                    className="w-full h-full object-cover"
                  />
                </Link>
                
                <button
                  onClick={handleLogout}
                  className="p-3 rounded-xl text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all duration-200 group"
                  title="Logout"
                >
                  <FiLogOut size={20} className="group-hover:scale-110 transition-transform" />
                </button>
              </div>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-3 rounded-xl hover:bg-gray-100 transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <FiX size={24} className="text-gray-900" /> : <FiMenu size={24} className="text-gray-900" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden pb-6">
              {/* Mobile Search */}
              <div className="mb-6" ref={searchRef}>
                <div className="relative">
                  <form onSubmit={handleSearchSubmit}>
                    <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={handleSearchInputChange}
                      className="w-full pl-12 pr-4 py-3 bg-white/50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:bg-white transition-all duration-200"
                    />
                    {isSearching && (
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-purple-500 rounded-full animate-spin"></div>
                      </div>
                    )}
                  </form>

                  {/* Mobile Search Results */}
                  {showSearchResults && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-lg rounded-xl shadow-xl border border-gray-200/50 py-2 z-50 max-h-64 overflow-y-auto">
                      {searchResults.length > 0 ? (
                        searchResults.map((searchUser) => (
                          <button
                            key={searchUser._id}
                            onClick={() => handleUserSelect(searchUser.username)}
                            className="w-full px-4 py-3 flex items-center space-x-3 hover:bg-gray-50 transition-colors text-left"
                          >
                            <img
                              src={searchUser.profilePicture || '/default-avatar.png'}
                              alt={searchUser.username}
                              className="w-8 h-8 rounded-full object-cover border-2 border-gray-200"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 text-sm truncate">
                                @{searchUser.username}
                              </p>
                              {searchUser.bio && (
                                <p className="text-xs text-gray-500 truncate">
                                  {searchUser.bio}
                                </p>
                              )}
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-6 text-center">
                          <p className="text-gray-500 text-sm">
                            {isSearching ? 'Searching...' : 'No users found'}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* User info */}
              <div className="flex items-center space-x-4 p-4 bg-white/50 rounded-2xl mb-6">
                <img
                  src={user.profilePicture || '/default-avatar.png'}
                  alt={user.username}
                  className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                />
                <div>
                  <p className="font-bold text-gray-900 text-lg">{user.username}</p>
                  <p className="text-gray-600">{user.email}</p>
                </div>
              </div>

              {/* Navigation links */}
              <div className="space-y-2">
                <Link 
                  href="/" 
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActiveRoute('/') ? 'bg-purple-100 text-purple-600' : 'text-gray-700 hover:bg-gray-100'}`}
                  onClick={closeMobileMenu}
                >
                  <FiHome size={24} />
                  <span className="font-semibold">Home</span>
                </Link>

                <button className="flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-100 transition-all duration-200 w-full text-left">
                  <FiMessageCircle size={24} />
                  <span className="font-semibold">Messages</span>
                </button>
                
                <Link 
                  href={`/profile/${user.username}`}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActiveRoute(`/profile/${user.username}`) ? 'bg-purple-100 text-purple-600' : 'text-gray-700 hover:bg-gray-100'}`}
                  onClick={closeMobileMenu}
                >
                  <FiUser size={24} />
                  <span className="font-semibold">Profile</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all duration-200 w-full text-left"
                >
                  <FiLogOut size={24} />
                  <span className="font-semibold">Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Click outside to close mobile menu */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 md:hidden"
          onClick={closeMobileMenu}
        />
      )}
    </>
  );
};

export default Navbar;