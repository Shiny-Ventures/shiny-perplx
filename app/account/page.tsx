'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/auth-context';
import { useSubscription } from '@/hooks/use-subscription';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AccountPage() {
  const { user } = useAuth();
  const { tier, loading: subscriptionLoading } = useSubscription();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async () => {
    router.push('/pricing');
  };

  const handleManageSubscription = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/stripe/create-portal', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error accessing billing portal:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="container max-w-4xl py-8 space-y-8">
      <h1 className="text-3xl font-bold">Account Settings</h1>
      
      <Tabs defaultValue="subscription">
        <TabsList>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="subscription" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Current Plan</h2>
            {subscriptionLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading subscription...</span>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <p className="text-2xl font-bold mb-2">
                    {tier === 'pro' ? 'Pro Plan' : 'Free Plan'}
                  </p>
                  <p className="text-muted-foreground">
                    {tier === 'pro' 
                      ? 'You have access to all premium features.'
                      : 'Upgrade to Pro for unlimited access.'}
                  </p>
                </div>
                {tier === 'pro' ? (
                  <Button
                    onClick={handleManageSubscription}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Manage Subscription'
                    )}
                  </Button>
                ) : (
                  <Button onClick={handleUpgrade}>
                    Upgrade to Pro
                  </Button>
                )}
              </>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Email</label>
                <p className="text-muted-foreground">{user.email}</p>
              </div>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/auth/update-password'}
              >
                Change Password
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 