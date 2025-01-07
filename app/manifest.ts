import type { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ShinyPerplx - AI-powered Search Engine",
    short_name: "ShinyPerplx",
    description: "A minimalistic AI-powered search engine that helps you find information on the internet using advanced AI models like GPT-4, Claude, and Grok",
    start_url: "/",
    display: "standalone",
    categories: ["search", "ai", "productivity"],
    icons: [
      {
        src: "/logo.png",
        sizes: "any",
        type: "image/png"
      },
    ],
    screenshots: [
      {
        src: "/opengraph-image.png",
        type: "image/png",
        sizes: "1200x630",
      }
    ]
  }
}