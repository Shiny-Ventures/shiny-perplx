import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useRouter } from 'next/navigation'

interface UpgradePromptProps {
  isOpen: boolean
  onClose: () => void
}

export function UpgradePrompt({ isOpen, onClose }: UpgradePromptProps) {
  const router = useRouter()

  const handleUpgrade = () => {
    router.push('/pricing')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Daily Limit Reached</DialogTitle>
          <DialogDescription>
            You've reached your daily limit of 3 free queries. Upgrade to our Pro plan for unlimited queries and additional features.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-6 flex justify-end space-x-4">
          <Button variant="outline" onClick={onClose}>
            Maybe Later
          </Button>
          <Button onClick={handleUpgrade}>
            View Pricing
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 