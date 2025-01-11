'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';
import {
  Brain,
  Sparkles,
  Cpu,
  Lightbulb,
  Atom,
  Rocket,
  Shield,
  Database,
  Bot,
  Code2,
  Microscope,
  ExternalLink,
  MessageSquare,
  Clock,
  ThumbsUp,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useDiscover } from '@/hooks/use-discover';

const categories = [
  { id: 'curated', name: 'Curated AI', icon: Sparkles },
  { id: 'ai', name: 'AI', icon: Brain },
  { id: 'tech', name: 'Tech', icon: Cpu },
  { id: 'innovation', name: 'Innovation', icon: Lightbulb },
  { id: 'robotics', name: 'Robotics', icon: Bot },
  { id: 'research', name: 'Research', icon: Microscope },
] as const;

export default function DiscoverPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('day');
  const { theme } = useTheme();
  
  const { data: articles, isLoading } = useDiscover(selectedCategory, timeRange);

  const getIconForCategory = (category: string) => {
    const foundCategory = categories.find(c => c.id === category);
    const Icon = foundCategory?.icon || Brain;
    return <Icon className="w-5 h-5" />;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
          Discover
        </h1>
        
        <div className="flex gap-4">
          <Select
            value={selectedCategory}
            onValueChange={setSelectedCategory}
          >
            <SelectTrigger className="w-[180px] bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  <div className="flex items-center gap-2">
                    {getIconForCategory(category.id)}
                    {category.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={timeRange}
            onValueChange={setTimeRange}
          >
            <SelectTrigger className="w-[180px] bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Past 24 Hours</SelectItem>
              <SelectItem value="week">Past Week</SelectItem>
              <SelectItem value="month">Past Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))
        ) : articles?.map((article, index) => (
          <motion.div
            key={article.url}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className="w-full hover:shadow-lg transition-shadow duration-200 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getIconForCategory(article.category)}
                    <Badge variant="secondary" className="bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
                      {categories.find(c => c.id === article.category)?.name || 'Tech'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400">
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="w-4 h-4" />
                      {article.score}
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      {article.num_comments}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {article.time_ago}
                    </div>
                  </div>
                </div>
                <CardTitle className="mt-2">
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:text-primary hover:underline"
                  >
                    {article.title}
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </CardTitle>
              </CardHeader>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
} 