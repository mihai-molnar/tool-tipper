'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Crown, Check, X, CreditCard, Calendar, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import { useToast } from '@/components/Toast';
import Link from 'next/link';

export default function BillingPage() {
  const searchParams = useSearchParams();
  const { user, profile, loading, refreshProfile } = useAuth();
  const { showToast, ToastComponent } = useToast();
  const [pageLoading, setPageLoading] = useState(true);
  const hasShownToast = useRef(false);

  useEffect(() => {
    // Check for success/cancel params from Stripe
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    const sessionId = searchParams.get('session_id');

    // Only show toast once per page load
    if (!hasShownToast.current) {
      if (success === 'true') {
        showToast('success', 'Welcome to Pro! Your subscription is now active.');
        
        // Aggressive profile refresh with retry logic for payment success
        const refreshWithRetry = async () => {
          for (let i = 0; i < 5; i++) {
            if (refreshProfile) {
              await refreshProfile();
            }
            
            // Wait a bit between retries to allow webhooks to process
            if (i < 4) {
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          }
        };
        
        refreshWithRetry();
        hasShownToast.current = true;
      } else if (canceled === 'true') {
        showToast('info', 'Payment was canceled. You can try again anytime.');
        hasShownToast.current = true;
      }
    }

    setPageLoading(false);
  }, [searchParams, refreshProfile]); // Include refreshProfile dependency

  const handleManageSubscription = async () => {
    if (!user || !profile?.subscription_id || pageLoading) return;
    
    setPageLoading(true);
    
    try {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create portal session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Portal error:', error);
      showToast('error', 'Unable to load billing portal. Please try again.');
      setPageLoading(false);
    }
  };

  if (loading || pageLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading billing information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Sign In Required</h1>
            <p className="text-gray-600 mb-6">You need to be signed in to view billing information.</p>
            <Link 
              href="/auth/login"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isPro = profile?.plan_type === 'pro';
  const isActive = profile?.subscription_status === 'active';

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Billing & Subscription</h1>
            <p className="text-gray-600">Manage your Tool-Tipper subscription and billing details.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Current Plan */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Current Plan</h2>
                {isPro && (
                  <div className="flex items-center space-x-1 bg-gradient-to-r from-orange-100 to-pink-100 text-orange-700 px-3 py-1 rounded-full text-sm">
                    <Crown className="w-4 h-4" />
                    <span className="font-medium">Pro</span>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {isPro ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Plan</span>
                      <span className="font-medium text-gray-900">Tool-Tipper Pro</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Price</span>
                      <span className="font-medium text-gray-900">$1.99/month</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Status</span>
                      <div className="flex items-center space-x-1">
                        {isActive ? (
                          <>
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-green-700 font-medium">Active</span>
                          </>
                        ) : (
                          <>
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                            <span className="text-orange-700 font-medium capitalize">
                              {profile?.subscription_status || 'Unknown'}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="pt-4 border-t">
                      <h3 className="font-medium text-gray-900 mb-2">Pro Features</h3>
                      <ul className="space-y-1 text-sm text-gray-600">
                        <li className="flex items-center space-x-2">
                          <Check className="w-4 h-4 text-green-500" />
                          <span>Unlimited hotspots</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <Check className="w-4 h-4 text-green-500" />
                          <span>Priority support</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <Check className="w-4 h-4 text-green-500" />
                          <span>All current and future features</span>
                        </li>
                      </ul>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Plan</span>
                      <span className="font-medium text-gray-900">Free</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Price</span>
                      <span className="font-medium text-gray-900">$0/month</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Hotspot Limit</span>
                      <span className="font-medium text-gray-900">10 total</span>
                    </div>
                    <div className="pt-4 border-t">
                      <p className="text-sm text-gray-600 mb-4">
                        Upgrade to Pro for unlimited hotspots and priority support.
                      </p>
                      <Link
                        href="/#upgrade"
                        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-md hover:from-blue-700 hover:to-purple-700 transition-colors text-sm font-medium"
                      >
                        <Crown className="w-4 h-4 mr-2" />
                        Upgrade to Pro
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Billing Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Billing Information</h2>
                <CreditCard className="w-5 h-5 text-gray-400" />
              </div>

              {isPro && profile?.subscription_id ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Subscription ID</span>
                    <span className="font-mono text-sm text-gray-900">
                      {profile.subscription_id.substring(0, 12)}...
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Billing Cycle</span>
                    <span className="text-gray-900">Monthly</span>
                  </div>
                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-600 mb-4">
                      Manage your subscription, update payment methods, and view invoices in the Stripe Customer Portal.
                    </p>
                    <button
                      onClick={handleManageSubscription}
                      disabled={pageLoading}
                      className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Manage Subscription
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Billing Information</h3>
                  <p className="text-gray-600 text-sm">
                    You&rsquo;re currently on the free plan. Upgrade to Pro to access billing features.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Help Section */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Need Help?</h3>
            <p className="text-blue-800 text-sm mb-4">
              Have questions about your subscription or billing? We&rsquo;re here to help.
            </p>
            <div className="flex space-x-4">
              <a
                href="mailto:support@tool-tipper.com"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Contact Support
              </a>
              <Link
                href="/help"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View Help Center
              </Link>
            </div>
          </div>
        </div>
      </div>
{ToastComponent()}
    </>
  );
}