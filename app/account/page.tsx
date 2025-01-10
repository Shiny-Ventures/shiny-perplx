'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/auth-context';
import { useSubscription } from '@/hooks/use-subscription';
import { useRouter } from 'next/navigation';
import { Loader2, Mail, Github, Chrome, MessageSquare, User2 } from 'lucide-react';
import Image from 'next/image';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import Link from 'next/link';

// Helper function to get provider icon and name
function getProviderInfo(providerId: string) {
  switch (providerId) {
    case 'google':
      return { icon: Chrome, name: 'Google' };
    case 'discord':
      return { icon: MessageSquare, name: 'Discord' };
    case 'github':
      return { icon: Github, name: 'GitHub' };
    case 'email':
    default:
      return { icon: Mail, name: 'Email' };
  }
}

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

  // Determine the auth provider
  const provider = user.app_metadata?.provider || 'email';
  const { icon: ProviderIcon, name: providerName } = getProviderInfo(provider);
  const isEmailAuth = provider === 'email';

  // Get user's avatar URL from their identity data
  const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;
  const userName = user.user_metadata?.full_name || user.user_metadata?.name || user.email;

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
                  </Button> // replace with onClick={handleUpgrade} to add back in the full Stripe checkout
                ) : (
                  <Link
                    href="https://buy.stripe.com/fZe7vc5Rzcyx9Tq6ox"
                    className="inline-flex items-center justify-center rounded-md bg-[#333] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#444]"
                  >
                    Upgrade to Pro
                  </Link>
                )}
              </>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={avatarUrl} alt={userName} />
                  <AvatarFallback>
                    <User2 className="h-10 w-10" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-medium">{userName}</h3>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Sign in Method</label>
                <div className="flex items-center space-x-2 mt-1 text-muted-foreground">
                  <ProviderIcon className="h-4 w-4" />
                  <span>{providerName}</span>
                </div>
              </div>

              {isEmailAuth && (
                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/auth/update-password'}
                >
                  Change Password
                </Button>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 