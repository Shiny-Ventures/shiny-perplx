import type { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Shiny - Step into the future",
    short_name: "Shiny",
    description: "A minimalistic AI-powered search engine that helps you find information on the internet using advanced AI models like GPT-4, Claude, and Grok",
    start_url: "/",
    display: "standalone",
    categories: ["search", "ai", "productivity"],
    icons: [
      {
        src: "/icon.png",
        sizes: "any",
        type: "image/png"
      },
    ],
    screenshots: [
      {
        src: "/open-graph-image.png",
        type: "image/png",
        sizes: "1200x630",
      }
    ]
  }
}