/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.vox-cdn.com',
      },
      {
        protocol: 'https',
        hostname: 'techcrunch.com',
      },
      {
        protocol: 'https',
        hostname: '**.techcrunch.com',
      },
      {
        protocol: 'https',
        hostname: 'images.openai.com',
      },
      {
        protocol: 'https',
        hostname: '**.theverge.com',
      },
      {
        protocol: 'https',
        hostname: '**.wired.com',
      },
      {
        protocol: 'https',
        hostname: 'blog.google',
      },
      {
        protocol: 'https',
        hostname: '**.googleblog.com',
      },
      {
        protocol: 'https',
        hostname: '**.artificial-intelligence-news.com',
      }
    ],
  },
}

module.exports = nextConfig 