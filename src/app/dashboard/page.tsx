'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function RedirectDashboard() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    const checkRoleAndRedirect = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        console.log('No session found, redirecting to login');
        router.push('/login');
        return;
      }

      const userId = session.user.id;
      console.log('Logged in user ID:', userId);

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle();

      if (error) {
        console.error('Supabase error fetching profile:', error);
        return;
      }

      console.log('Fetched profile:', profile);

      if (!profile || !profile.role) {
        console.error('No role found — redirecting to unauthorized');
        router.push('/unauthorized');
        return;
      }

      const role = profile.role.trim().toLowerCase();
      console.log('Role (trimmed/lowercase):', role);

      if (role === 'admin') {
        router.push('/admin');
      } else if (role === 'student') {
        router.push('/student');
      } else {
        router.push('/unauthorized');
      }
    };

    checkRoleAndRedirect();
  }, []);

  return <p>Redirecting based on role...</p>;
}
