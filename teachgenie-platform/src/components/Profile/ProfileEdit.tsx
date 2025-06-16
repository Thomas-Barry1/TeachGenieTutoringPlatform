'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { toast } from 'react-hot-toast';
import ImageUpload from './ImageUpload';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
}

export default function ProfileEdit() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No user found');

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setProfile(profile);
      } catch (error) {
        console.error('Error loading profile:', error);
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [supabase]);

  const handleImageUpload = (url: string) => {
    if (profile) {
      setProfile({ ...profile, avatar_url: url });
    }
  };

  if (loading) {
    return <div className="animate-pulse">Loading profile...</div>;
  }

  if (!profile) {
    return <div>Profile not found</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>
      
      <div className="space-y-6">
        {/* Profile Image Section */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Profile Image</h2>
          <div className="flex items-start space-x-6">
            {/* Current Avatar */}
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No image
                </div>
              )}
            </div>
            
            {/* Upload Component */}
            <div className="flex-1">
              <ImageUpload
                userId={profile.id}
                onUploadComplete={handleImageUpload}
              />
            </div>
          </div>
        </div>

        {/* Basic Info Section */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input
                type="text"
                value={profile.first_name}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input
                type="text"
                value={profile.last_name}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 