import { NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { z } from 'zod';
import { xai } from '@ai-sdk/xai';

export interface TrendingQuery {
  icon: string;
  text: string;
  category: string;
}

interface RedditPost {
  data: {
    title: string;
  };
}

async function fetchGoogleTrends(): Promise<TrendingQuery[]> {
  const fetchTrends = async (geo: string): Promise<TrendingQuery[]> => {
    try {
      const response = await fetch(`https://trends.google.com/trends/trendingsearches/daily/rss?geo=${geo}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch from Google Trends RSS for geo: ${geo}`);
      }

      const xmlText = await response.text();
      const items = xmlText.match(/<title>(?!Daily Search Trends)(.*?)<\/title>/g) || [];

      const categories = [
        'ai',           // Artificial Intelligence topics
        'tech',         // General technology
        'innovation',   // New technological innovations
        'science',      // Scientific discoveries
        'startup',      // Tech startups and companies
        'cybersec',     // Cybersecurity
        'data',         // Data science and analytics
        'robotics',     // Robotics and automation
        'dev',          // Software development
        'research',     // Tech research and papers
        'skip'          // For non-tech topics
      ] as const;

      const schema = z.object({
        category: z.enum(categories),
      });

      const itemsWithCategoryAndIcon = await Promise.all(items.map(async item => {
        const { object } = await generateObject({
          model: xai("grok-beta"),
          prompt: `Analyze this topic and categorize it into one of these tech-focused categories (lowercase only): ${categories.join(', ')}

          Topic: ${item.replace(/<\/?title>/g, '')}
          
          Rules:
          - Only use the exact categories listed above
          - Focus on identifying tech and AI relevance
          - If not clearly tech/AI related, skip this item by returning 'skip'
          - For general tech news use 'tech'
          - For AI-specific news use 'ai'
          - For new tech products/services use 'innovation'`,
          schema,
          temperature: 0,
        });

        return {
          icon: object.category,
          text: item.replace(/<\/?title>/g, ''),
          category: object.category
        };
      }));

      // Filter out non-tech topics and limit to most relevant
      const techItems = itemsWithCategoryAndIcon
        .filter(item => item.category !== 'skip')
        .slice(0, 20);

      return techItems;
    } catch (error) {
      console.error(`Failed to fetch Google Trends for geo: ${geo}`, error);
      return [];
    }
  };

  const trends = await fetchTrends("US");

  return [ ...trends];
}

async function fetchRedditQuestions(): Promise<TrendingQuery[]> {
  try {
    const response = await fetch(
      'https://www.reddit.com/r/askreddit/hot.json?limit=100',
      {
        headers: {
          'User-Agent': 'MiniPerplx/1.0'
        }
      }
    );

    const data = await response.json();
    const maxLength = 50;

    return data.data.children
      .map((post: RedditPost) => ({
        icon: 'question',
        text: post.data.title,
        category: 'community'
      }))
      .filter((query: TrendingQuery) => query.text.length <= maxLength)
      .slice(0, 15);
  } catch (error) {
    console.error('Failed to fetch Reddit questions:', error);
    return [];
  }
}

async function fetchFromMultipleSources() {
  const [googleTrends,
    // redditQuestions
  ] = await Promise.all([
    fetchGoogleTrends(),
    // fetchRedditQuestions(),
  ]);

  const allQueries = [...googleTrends,
  // ...redditQuestions
  ];
  return allQueries
    .sort(() => Math.random() - 0.5);
}

export async function GET(req: Request) {
  try {
    const trends = await fetchFromMultipleSources();

    if (trends.length === 0) {
      // Tech-focused fallback queries
      console.error('Failed to fetch trends, returning fallback tech queries');
      return NextResponse.json([
        {
          icon: 'ai',
          text: "Latest developments in GPT-4 and large language models",
          category: 'ai'
        },
        {
          icon: 'tech',
          text: "Breakthrough in quantum computing research",
          category: 'tech'
        },
        {
          icon: 'innovation',
          text: "New advancements in autonomous vehicles",
          category: 'innovation'
        },
        {
          icon: 'cybersec',
          text: "Latest trends in AI cybersecurity",
          category: 'cybersec'
        },
        {
          icon: 'robotics',
          text: "Innovations in humanoid robots",
          category: 'robotics'
        }
      ]);
    }

    return NextResponse.json(trends);
  } catch (error) {
    console.error('Failed to fetch trends:', error);
    return NextResponse.error();
  }
}