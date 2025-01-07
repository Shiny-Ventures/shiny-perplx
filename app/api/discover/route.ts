import { NextResponse } from 'next/server';
import Exa from 'exa-js';
import { serverEnv } from '@/env/server';

// Temporarily disabled - To be implemented later
export async function GET(req: Request) {
  return NextResponse.json({ items: [] });
}

/*
// Sources we want to monitor - with specific sections for latest content
const SOURCES = [
  // AI News & Blogs
  {
    domain: 'openai.com',
    section: 'openai.com'
  }
];

interface ContentItem {
  title: string;
  content: string;
  url: string;
  description: string;
  image: string | null;
  publishedAt: string | null;
  author: string | null;
}

export async function GET(req: Request) {
  const exa = new Exa(serverEnv.EXA_API_KEY as string);
  
  try {
    console.log('Starting Exa content fetch for sources:', SOURCES);
    
    // Fetch content from all sources in parallel
    const contentPromises = SOURCES.map(async ({ domain, section }) => {
      try {
        console.log(`Fetching latest content from ${section}...`);
        
        // Search for the most recent content from this source
        const response = await exa.searchAndContents(
          `site:${domain}`,
          {
            type: 'keyword',
            numResults: 5,
            text: true,
            images: true,
            highlights: true,
            useAutoprompt: false,
            startPublishedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            sortBy: 'date',
            sortOrder: 'desc'
          }
        );

        console.log(`Raw Exa response for ${domain}:`, JSON.stringify(response, null, 2));

        if (!response.results?.[0]) {
          console.log(`No recent content found in the last 30 days for ${section}`);
          return null;
        }

        // Process all results
        const validResults = response.results
          .filter(result => {
            // Filter for blog-like content URLs
            const isContentUrl = result.url?.includes(domain) && 
              (result.url?.includes('/index/') || 
               result.url?.includes('/blog/') || 
               result.url?.includes('/research/'));
            
            return isContentUrl && result.title && result.url && result.text;
          })
          .map(result => ({
            title: result.title,
            content: result.text,
            url: result.url,
            description: result.highlights?.[0] || result.text.slice(0, 200) + '...',
            image: result.image || null,
            publishedAt: result.publishedDate || null,
            author: result.author || null
          }));

        return validResults.length > 0 ? validResults[0] : null;
      } catch (error) {
        console.error(`Error fetching from ${domain}:`, error);
        return null;
      }
    });

    const results = await Promise.all(contentPromises);
    const validResults = results.filter((item): item is ContentItem => item !== null);

    // Sort by published date if available, newest first
    const sortedResults = [...validResults].sort((a, b) => {
      const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return dateB - dateA;
    });

    return NextResponse.json({ items: sortedResults });
  } catch (error) {
    console.error('Discover API error:', error);
    return NextResponse.error();
  }
}
*/ 