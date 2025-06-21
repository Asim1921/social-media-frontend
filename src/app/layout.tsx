import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import Navbar from '@/components/Navbar';

const inter = Inter({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SocialApp • Connect & Share',
  description: 'A beautiful, modern social media platform inspired by Instagram. Connect with friends, share moments, and discover amazing content.',
  keywords: 'social media, instagram, connect, share, photos, community',
  authors: [{ name: 'SocialApp Team' }],
  openGraph: {
    title: 'SocialApp • Connect & Share',
    description: 'A beautiful, modern social media platform inspired by Instagram',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SocialApp • Connect & Share',
    description: 'A beautiful, modern social media platform inspired by Instagram',
  },
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  themeColor: '#ffffff',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light">
      <body className={`${inter.className} bg-gradient-to-br from-gray-50 via-white to-gray-100 min-h-screen text-gray-900 antialiased`}>
        <AuthProvider>
          <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
            {/* Background Pattern */}
            <div className="fixed inset-0 opacity-[0.03] pointer-events-none">
              <div className="absolute inset-0" style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, rgba(0,0,0,0.1) 1px, transparent 0)`,
                backgroundSize: '40px 40px'
              }}></div>
            </div>
            
            {/* Light Theme Gradient Orbs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-pink-200 to-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float"></div>
              <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-200 to-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float" style={{animationDelay: '2s'}}></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-gradient-to-br from-orange-200 to-orange-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{animationDelay: '4s'}}></div>
              <div className="absolute top-20 left-1/3 w-40 h-40 bg-gradient-to-br from-blue-200 to-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-25 animate-float" style={{animationDelay: '1s'}}></div>
              <div className="absolute bottom-20 right-1/3 w-50 h-50 bg-gradient-to-br from-green-200 to-green-300 rounded-full mix-blend-multiply filter blur-xl opacity-25 animate-float" style={{animationDelay: '3s'}}></div>
            </div>

            {/* Subtle Grid Overlay */}
            <div className="fixed inset-0 opacity-[0.02] pointer-events-none">
              <div className="absolute inset-0" style={{
                backgroundImage: `linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)`,
                backgroundSize: '20px 20px'
              }}></div>
            </div>

            <Navbar />
            
            <main className="relative z-10 pt-20 min-h-screen">
              <div className="animate-fade-in">
                {children}
              </div>
            </main>
          </div>
          
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'rgba(255, 255, 255, 0.95)',
                color: '#1f2937',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                borderRadius: '16px',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
                fontWeight: '500',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
                style: {
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#fff',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
                style: {
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: '#fff',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                },
              },
              loading: {
                style: {
                  background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  color: '#fff',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}