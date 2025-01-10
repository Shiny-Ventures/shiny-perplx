'use client';

import { useQuery } from '@tanstack/react-query';

interface Article {
  title: string;
  url: string;
  score: number;
  num_comments: number;
  time_ago: string;
  category: string;
}

interface FetchArticlesParams {
  category: string;
  timeRange: string;
}

async function fetchArticles({ category, timeRange }: FetchArticlesParams): Promise<Article[]> {
  const response = await fetch('/api/discover', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      category,
      timeRange,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch articles');
  }

  return response.json();
}

export function useDiscover(category: string, timeRange: string) {
  return useQuery({
    queryKey: ['discover', category, timeRange],
    queryFn: () => fetchArticles({ category, timeRange }),
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep data in cache for 30 minutes
  });
} 