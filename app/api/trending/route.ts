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

// First, ensure the categories are strictly defined
const categories = [
  'curated',
  'ai',
  'tech',
  'innovation',
  'robotics',
  'research',
  'skip'  // Keep skip for non-relevant content
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
        items.slice(0, 50).map(async item => { // Increased from 30 to 50 items
          try {
            const { object } = await generateObject({
              model: xai("grok-beta"),
              prompt: `Analyze this topic and categorize it into one of these specific tech categories (lowercase only): ${categories.join(', ')}

              Topic: ${item}
              
              Rules:
              - Only use the exact categories listed above
              - Focus on identifying cutting-edge tech and AI relevance
              - For curated content, it must be high-quality tech news from reputable sources
              - For AI-specific news use 'ai'
              - For robotics and automation use 'robotics'
              - For research papers and scientific breakthroughs use 'research'
              - For new tech products/innovations use 'innovation'
              - For general tech news use 'tech'
              - If not clearly tech/AI related, use 'skip'
              
              Additional Context:
              - 'curated' is for high-impact tech news and developments
              - 'innovation' covers new products, services, and technological breakthroughs
              - 'research' includes academic papers, studies, and scientific discoveries
              - 'robotics' covers automation, drones, and physical AI systems`,
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
        .slice(0, 25); // Increased from 20 to 25 items

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

  // Try multiple regions in parallel for better coverage
  const regions = [
    'US', 'GB', 'CA', 'AU',   // English-speaking countries
    'IN', 'SG', 'NZ',         // More English-speaking regions
    'DE', 'FR', 'JP',         // Major tech hubs
    'KR', 'IL', 'NL'          // Additional tech-focused regions
  ];

  const allTrends = await Promise.all(regions.map(region => fetchTrends(region)));
  const combinedTrends = allTrends
    .flat()
    .filter((trend, index, self) => 
      index === self.findIndex(t => t.text === trend.text)
    );

  if (combinedTrends.length > 0) {
    return combinedTrends.slice(0, 25); // Return top 25 unique trends
  }

  // Update fallback queries to only use our new categories
  const fallbackQueries: TrendingQuery[] = [
    {
      icon: 'curated',
      text: "Most impactful tech developments of the week",
      category: 'curated'
    },
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
        icon: 'curated' as Category,
        text: post.data.title,
        category: 'curated' as Category
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
      return NextResponse.json([
        {
          icon: 'curated',
          text: "Most impactful tech developments of the week",
          category: 'curated'
        },
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
          icon: 'robotics',
          text: "Innovations in humanoid robots",
          category: 'robotics'
        },
        {
          icon: 'research',
          text: "The latest breakthroughs in superconductivity research",
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