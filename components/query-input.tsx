'use client';

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/contexts/auth-context'
import { useQueryLimit } from '@/hooks/use-query-limit'
import { UpgradePrompt } from '@/components/upgrade-prompt'

export function QueryInput() {
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuth()
  const { checkAndTrackQuery, isExceeded } = useQueryLimit()
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim() || !user) return

    setIsLoading(true)
    try {
      const canProceed = await checkAndTrackQuery({ query })
      if (!canProceed) {
        setShowUpgradePrompt(true)
        return
      }

      // TODO: Implement your query processing logic here
      console.log('Processing query:', query)

    } catch (error) {
      if (error instanceof Error && error.message.includes('limit exceeded')) {
        setShowUpgradePrompt(true)
      } else {
        console.error('Error processing query:', error)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter your query here..."
          className="min-h-[100px] resize-none"
        />
        <Button 
          type="submit" 
          disabled={isLoading || !query.trim() || isExceeded}
          className="w-full"
        >
          {isLoading ? 'Processing...' : 'Submit Query'}
        </Button>
      </form>

      <UpgradePrompt 
        isOpen={showUpgradePrompt} 
        onClose={() => setShowUpgradePrompt(false)} 
      />
    </div>
  )
} 