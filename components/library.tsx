'use client';

import { useAuth } from '@/contexts/auth-context';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { Book, Clock } from 'lucide-react';
import { useQueries } from '@/hooks/use-queries';

export function Library() {
  const { user } = useAuth();
  const { data: queries, isLoading } = useQueries();

  if (!user) {
    return (
      <div className="container max-w-4xl py-8 space-y-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Book className="h-5 w-5" />
          Library
        </h1>
        <p className="text-sm text-muted-foreground">
          Please sign in to view your query history.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-8 space-y-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Book className="h-5 w-5" />
          Library
        </h1>
        <p className="text-sm text-muted-foreground">Loading your queries...</p>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8 space-y-8">
      <h1 className="text-3xl font-bold flex items-center gap-2">
        <Book className="h-5 w-5" />
        Library
      </h1>
      <div className="space-y-4">
        {!queries?.length ? (
          <p className="text-sm text-muted-foreground">
            You haven&apos;t made any queries yet.
          </p>
        ) : (
          <ScrollArea className="h-[600px]">
            <div className="space-y-4 pr-4">
              {queries.map((query) => (
                <div
                  key={query.id}
                  className="flex flex-col gap-1 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <p className="font-medium">{query.query_details.query}</p>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>
                      {formatDistanceToNow(new Date(query.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
} 