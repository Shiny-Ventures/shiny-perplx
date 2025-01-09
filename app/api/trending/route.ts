import { NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { z } from 'zod';
import { xai } from '@ai-sdk/xai';

export interface TrendingQuery {
  icon: Category;
  text: string;
  category: Category;
}

interface RedditPost {
  data: {
    title: string;
  };
}

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

type Category = typeof categories[number];

async function fetchGoogleTrends(): Promise<TrendingQuery[]> {
  const fetchTrends = async (geo: string): Promise<TrendingQuery[]> => {
    try {
      const response = await fetch(`https://trends.google.com/trends/trendingsearches/daily/rss?geo=${geo}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/rss+xml',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        next: { revalidate: 3600 } // Cache for 1 hour
      });

      if (!response.ok) {
        console.error(`Google Trends API error: ${response.status} ${response.statusText}`);
        throw new Error(`Failed to fetch from Google Trends RSS for geo: ${geo}`);
      }

      const xmlText = await response.text();
      
      // More robust XML parsing
      const titleMatches = xmlText.match(/<title>(?!Daily Search Trends)([^<]+)<\/title>/g) || [];
      const items = titleMatches.map(match => match.replace(/<\/?title>/g, '').trim());

      if (items.length === 0) {
        console.error('No trending items found in the RSS feed');
        throw new Error('No trending items found');
      }

      const schema = z.object({
        category: z.enum(categories),
      });

      const itemsWithCategoryAndIcon = await Promise.all(
        items.slice(0, 30).map(async item => { // Process more items initially
          try {
            const { object } = await generateObject({
              model: xai("grok-beta"),
              prompt: `Analyze this topic and categorize it into one of these tech-focused categories (lowercase only): ${categories.join(', ')}

              Topic: ${item}
              
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

            const category = object.category as Category;
            const result: TrendingQuery = {
              icon: category,
              text: item,
              category: category
            };
            return result;
          } catch (error) {
            console.error(`Failed to categorize item: ${item}`, error);
            return null;
          }
        })
      );

      // Filter out nulls and non-tech topics
      const techItems = itemsWithCategoryAndIcon
        .filter((item): item is TrendingQuery => 
          item !== null && 
          item.category !== 'skip'
        )
        .slice(0, 20);

      if (techItems.length < 5) {
        console.error('Not enough tech items found, using fallback');
        throw new Error('Insufficient tech items');
      }

      return techItems;
    } catch (error) {
      console.error(`Failed to fetch Google Trends for geo: ${geo}`, error);
      return [];
    }
  };

  // Try multiple regions if one fails
  const regions = ['US', 'GB', 'CA', 'AU'];
  for (const region of regions) {
    const trends = await fetchTrends(region);
    if (trends.length > 0) {
      return trends;
    }
  }

  // If all regions fail, return tech-focused fallback queries
  const fallbackQueries: TrendingQuery[] = [
    {
      icon: 'ai',
      text: "Latest developments in GPT-4 and large language models",
      category: 'ai'
    },
    {
      icon: 'ai',
      text: "Emerging AI tools for personalized education",
      category: 'ai'
    },
    {
      icon: 'tech',
      text: "Breakthrough in quantum computing research",
      category: 'tech'
    },
    {
      icon: 'tech',
      text: "The future of 6G networks and connectivity",
      category: 'tech'
    },
    {
      icon: 'innovation',
      text: "New advancements in autonomous vehicles",
      category: 'innovation'
    },
    {
      icon: 'innovation',
      text: "Revolutionary energy storage technologies",
      category: 'innovation'
    },
    {
      icon: 'cybersec',
      text: "Breakthroughs in quantum-proof cryptography",
      category: 'cybersec'
    },
    {
      icon: 'cybersec',
      text: "How AI is reshaping threat detection",
      category: 'cybersec'
    },
    {
      icon: 'robotics',
      text: "Innovations in humanoid robots",
      category: 'robotics'
    },
    {
      icon: 'robotics',
      text: "Advancements in collaborative industrial robots",
      category: 'robotics'
    },
    {
      icon: 'data',
      text: "Trends in big data analytics for business intelligence",
      category: 'data'
    },
    {
      icon: 'data',
      text: "The rise of synthetic data in AI model training",
      category: 'data'
    },
    {
      icon: 'dev',
      text: "Best practices for building AI-powered applications",
      category: 'dev'
    },
    {
      icon: 'dev',
      text: "The future of serverless computing in app development",
      category: 'dev'
    },
    {
      icon: 'research',
      text: "The latest breakthroughs in superconductivity research",
      category: 'research'
    },
    {
      icon: 'research',
      text: "Innovative uses of AI in scientific experimentation",
      category: 'research'
    }
  ];

  return fallbackQueries;
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
          icon: 'ai',
          text: "Emerging AI tools for personalized education",
          category: 'ai'
        },
        {
          icon: 'tech',
          text: "Breakthrough in quantum computing research",
          category: 'tech'
        },
        {
          icon: 'tech',
          text: "The future of 6G networks and connectivity",
          category: 'tech'
        },
        {
          icon: 'innovation',
          text: "New advancements in autonomous vehicles",
          category: 'innovation'
        },
        {
          icon: 'innovation',
          text: "Revolutionary energy storage technologies",
          category: 'innovation'
        },
        {
          icon: 'science',
          text: "Discoveries in gene editing and synthetic biology",
          category: 'science'
        },
        {
          icon: 'science',
          text: "Progress in understanding dark matter",
          category: 'science'
        },
        {
          icon: 'startup',
          text: "Top startups revolutionizing clean energy",
          category: 'startup'
        },
        {
          icon: 'startup',
          text: "AI-driven companies transforming retail",
          category: 'startup'
        },
        {
          icon: 'cybersec',
          text: "Breakthroughs in quantum-proof cryptography",
          category: 'cybersec'
        },
        {
          icon: 'cybersec',
          text: "How AI is reshaping threat detection",
          category: 'cybersec'
        },
        {
          icon: 'data',
          text: "Trends in big data analytics for business intelligence",
          category: 'data'
        },
        {
          icon: 'data',
          text: "The rise of synthetic data in AI model training",
          category: 'data'
        },
        {
          icon: 'robotics',
          text: "Innovations in humanoid robots",
          category: 'robotics'
        },
        {
          icon: 'robotics',
          text: "Advancements in collaborative industrial robots",
          category: 'robotics'
        },
        {
          icon: 'dev',
          text: "Best practices for building AI-powered applications",
          category: 'dev'
        },
        {
          icon: 'dev',
          text: "The future of serverless computing in app development",
          category: 'dev'
        },
        {
          icon: 'research',
          text: "The latest breakthroughs in superconductivity research",
          category: 'research'
        },
        {
          icon: 'research',
          text: "Innovative uses of AI in scientific experimentation",
          category: 'research'
        }
      ]);
    }

    return NextResponse.json(trends);
  } catch (error) {
    console.error('Failed to fetch trends:', error);
    return NextResponse.error();
  }
}