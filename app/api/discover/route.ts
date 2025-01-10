import { NextResponse } from 'next/server';
import Exa from 'exa-js';
import { serverEnv } from '@/env/server';
import { formatDistanceToNow } from 'date-fns';
import { Redis } from '@upstash/redis';

// Initialize Exa client
const exa = new Exa(serverEnv.EXA_API_KEY as string);

// Initialize Redis client
const redis = new Redis({
  url: serverEnv.UPSTASH_REDIS_REST_URL,
  token: serverEnv.UPSTASH_REDIS_REST_TOKEN,
});

interface ExaResult {
  id: string;
  url: string;
  title: string | null;
  text: string | null;
  publishedDate?: string;
  author?: string;
}

interface CachedArticle extends Article {
  timestamp?: string;
}

// Add trusted domains for curated content
const TRUSTED_DOMAINS = [
  'bensbites.com/blog',
  'wired.com',
  'nature.com',
  'science.org',
  'arxiv.org',
  'technologyreview.com',
  'arstechnica.com',
  'theverge.com',
  'venturebeat.com',
  'zdnet.com'
];

// Update categories to include 'curated'
const categories = [
  'curated',
  'ai',
  'tech',
  'innovation',
  'science',
  'startup',
  'cybersec',
  'data',
  'robotics',
  'dev',
  'research'
] as const;

type Category = typeof categories[number];

interface Article {
  title: string;
  url: string;
  score: number;
  num_comments: number;
  time_ago: string;
  category: Category;
}

function appendReferral(url: string): string {
  try {
    const urlObj = new URL(url);
    // Remove any existing ref parameter
    urlObj.searchParams.delete('ref');
    // Add our ref parameter
    urlObj.searchParams.append('ref', 'shinyobjects');
    return urlObj.toString();
  } catch (error) {
    // If URL parsing fails, check if ref parameter already exists
    if (url.includes('ref=shinyobjects')) {
      return url;
    }
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}ref=shinyobjects`;
  }
}

function determineCategory(title: string, content: string): Category {
  const titleLower = title.toLowerCase();
  const contentLower = content.toLowerCase();
  const text = `${titleLower} ${contentLower}`;

  // Define keywords for each category
  const categoryKeywords: Record<Category, string[]> = {
    curated: ['technology', 'innovation', 'research', 'breakthrough', 'expert'],
    ai: ['ai', 'artificial intelligence', 'machine learning', 'deep learning', 'neural network', 'gpt', 'llm'],
    tech: ['technology', 'tech', 'digital', 'software', 'hardware', 'computing'],
    innovation: ['innovation', 'breakthrough', 'revolutionary', 'pioneering', 'cutting-edge'],
    science: ['science', 'scientific', 'research', 'discovery', 'study', 'experiment'],
    startup: ['startup', 'company', 'business', 'venture', 'founder', 'entrepreneur'],
    cybersec: ['security', 'cyber', 'hack', 'privacy', 'encryption', 'vulnerability'],
    data: ['data', 'analytics', 'database', 'big data', 'visualization', 'statistics'],
    robotics: ['robot', 'automation', 'autonomous', 'drone', 'mechanical'],
    dev: ['developer', 'programming', 'code', 'software', 'engineering', 'api'],
    research: ['research', 'paper', 'study', 'analysis', 'investigation', 'findings']
  };

  // Score each category based on keyword matches
  const scores = Object.entries(categoryKeywords).map(([category, keywords]) => {
    const score = keywords.reduce((acc, keyword) => {
      return acc + (text.includes(keyword) ? 1 : 0);
    }, 0);
    return { category, score };
  });

  // Return the category with the highest score, or 'tech' as default
  const bestMatch = scores.reduce((a, b) => a.score > b.score ? a : b);
  return (bestMatch.score > 0 ? bestMatch.category : 'tech') as Category;
}

function getTimeFilter(timeRange: string): string {
  const now = new Date();
  switch (timeRange) {
    case 'day':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    case 'week':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    case 'month':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    default:
      return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  }
}

export async function POST(req: Request) {
  try {
    const { category, timeRange } = await req.json();
    
    // Create a cache key based on the request parameters
    const cacheKey = `discover:${category}:${timeRange}`;
    
    // Try to get cached results
    const cachedResults = await redis.get<CachedArticle[]>(cacheKey);
    if (cachedResults) {
      // Update relative timestamps before returning cached results
      const updatedResults = cachedResults.map(article => ({
        ...article,
        time_ago: article.timestamp 
          ? formatDistanceToNow(new Date(article.timestamp), { addSuffix: true })
          : article.time_ago,
        url: appendReferral(article.url) // Ensure cached URLs also have referral params
      }));
      return NextResponse.json(updatedResults);
    }

    // Build the search query based on category
    let searchQuery = 'technology OR programming OR AI';
    const baseSearchOptions = {
      numResults: 30,
      startPublishedDate: getTimeFilter(timeRange),
      useAutoprompt: true,
      contents: {
        text: true,
        html: false
      }
    };

    let curatedSearchOptions;
    if (category === 'curated') {
      // For curated content, focus on AI content from trusted sources
      searchQuery = 'artificial intelligence AI machine learning deep learning neural networks LLM GPT transformers';
      curatedSearchOptions = {
        ...baseSearchOptions,
        includeDomains: TRUSTED_DOMAINS,
        numResults: 50, // Fetch more results since we're filtering by domain
        useAutoprompt: false // Disable autoprompt for more precise AI-focused results
      };
    } else if (category !== 'all') {
      searchQuery = `${category} technology news`;
    }

    // Fetch articles from Exa
    const response = await exa.searchAndContents(
      searchQuery,
      category === 'curated' ? curatedSearchOptions : baseSearchOptions
    );

    if (!response.results) {
      return NextResponse.json([]);
    }

    // Transform and categorize the results
    const articles: CachedArticle[] = response.results
      .filter((result): result is ExaResult & { title: string; text: string } => 
        result.title !== null && 
        result.text !== null
      )
      .map(result => {
        // For curated content, keep the original category
        const articleCategory = category === 'curated' ? 'curated' : determineCategory(result.title, result.text);
        const timestamp = result.publishedDate || new Date().toISOString();
        
        return {
          title: result.title,
          url: appendReferral(result.url),
          score: Math.floor(Math.random() * 1000) + 100,
          num_comments: Math.floor(Math.random() * 100) + 10,
          time_ago: formatDistanceToNow(new Date(timestamp), { addSuffix: true }),
          category: articleCategory,
          timestamp,
        };
      });

    // Filter by category if specified
    const filteredArticles = category === 'all' 
      ? articles 
      : articles.filter(article => article.category === category);

    // Cache the results
    await redis.set(cacheKey, filteredArticles, {
      ex: 5 * 60 // Cache for 5 minutes
    });

    return NextResponse.json(filteredArticles);
  } catch (error) {
    console.error('Error in discover API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 