'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';

interface QueryHistory {
  id: string;
  query_details: {
    query: string;
  };
  created_at: string;
}

async function fetchQueries(userId: string | undefined) {
  if (!userId) return [];

  const { data, error } = await supabase
    .from('user_queries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return data || [];
}

export function useQueries() {
  const { user } = useAuth();

  return useQuery<QueryHistory[]>({
    queryKey: ['queries', user?.id],
    queryFn: () => fetchQueries(user?.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    gcTime: 1000 * 60 * 60, // Keep unused data in cache for 1 hour
  });
} 