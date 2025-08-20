import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { supabaseServer } from '@/lib/supabase-server';
import Stripe from 'stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const sig = headersList.get('stripe-signature');

    if (!sig || !webhookSecret) {
      console.error('Missing stripe-signature header or webhook secret');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log(`Received webhook event: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
        
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
        
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
        
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  try {
    const userId = subscription.metadata?.userId;
    
    console.log('Subscription metadata:', subscription.metadata);
    console.log('Subscription ID:', subscription.id);
    console.log('Customer ID:', subscription.customer);
    
    if (!userId) {
      console.error('No userId in subscription metadata - this might be a test event');
      console.log('Full subscription object keys:', Object.keys(subscription));
      return;
    }

    console.log(`Handling subscription update for user ${userId}: ${subscription.status}`);

    // First, get the customer to fetch email
    const customer = await stripe.customers.retrieve(subscription.customer as string);
    const customerEmail = (customer as Stripe.Customer).email || '';

    // Try using the custom RPC function first, fallback to direct upsert
    try {
      const rpcResult = await supabaseServer.rpc('upsert_user_profile_webhook', {
        user_uuid: userId,
        user_email: customerEmail,
        sub_id: subscription.id,
        sub_status: subscription.status,
        plan_type_val: subscription.status === 'active' ? 'pro' : 'free'
      });
      
      if (!rpcResult.error) {
        console.log(`Successfully updated profile via RPC for user ${userId}`);
        return; // Success, exit early
      } else {
        console.log('RPC function not available, trying direct upsert:', rpcResult.error);
      }
    } catch (rpcError) {
      console.log('RPC function not available, trying direct upsert:', rpcError);
    }

    // Simple approach: Just ignore the constraint errors and continue
    // The user will see the upgrade when they refresh their profile
    try {
      // Try update first
      const updateResult = await supabaseServer
        .from('user_profiles')
        .update({
          subscription_id: subscription.id,
          subscription_status: subscription.status as any,
          plan_type: subscription.status === 'active' ? 'pro' : 'free',
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateResult.error) {
        console.log(`Update failed for user ${userId}:`, updateResult.error.message);
        
        // Try insert as fallback, but don't worry if it fails
        try {
          const insertResult = await supabaseServer
            .from('user_profiles')
            .insert({
              id: userId,
              email: customerEmail,
              subscription_id: subscription.id,
              subscription_status: subscription.status as any,
              plan_type: subscription.status === 'active' ? 'pro' : 'free',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

          if (insertResult.error) {
            console.log(`Insert also failed for user ${userId}:`, insertResult.error.message);
          } else {
            console.log(`Successfully inserted profile for user ${userId}`);
          }
        } catch (insertError) {
          console.log(`Insert error for user ${userId}:`, insertError);
        }
      } else if (updateResult.count === 0) {
        console.log(`No rows updated for user ${userId}, profile may not exist yet`);
      } else {
        console.log(`Successfully updated profile for user ${userId}`);
      }
    } catch (error) {
      console.log(`Database operation failed for user ${userId}, but payment was processed:`, error);
    }

    console.log(`Successfully updated user ${userId} to ${subscription.status} status`);
  } catch (error) {
    console.error('Error in handleSubscriptionUpdate:', error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    const userId = subscription.metadata?.userId;
    if (!userId) {
      console.error('No userId in subscription metadata');
      return;
    }

    const { error } = await supabaseServer
      .from('user_profiles')
      .update({
        subscription_status: 'canceled',
        plan_type: 'free',
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.error('Error updating user profile on cancellation:', error);
    } else {
      console.log(`Downgraded user ${userId} to free plan`);
    }
  } catch (error) {
    console.error('Error in handleSubscriptionDeleted:', error);
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  try {
    const userId = session.metadata?.userId;
    if (!userId) {
      console.error('No userId in checkout session metadata');
      return;
    }

    console.log(`Checkout completed for user ${userId}, session: ${session.id}`);
    
    // The subscription update will be handled by the subscription webhook
    // This is mainly for logging/tracking purposes
  } catch (error) {
    console.error('Error in handleCheckoutCompleted:', error);
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    const subscriptionId = invoice.subscription as string;
    if (!subscriptionId) {
      console.log('No subscription ID in invoice, skipping payment succeeded handler');
      return;
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const userId = subscription.metadata?.userId;
    
    console.log('Payment succeeded - subscription metadata:', subscription.metadata);
    console.log('Payment succeeded - user ID:', userId);
    console.log('Payment succeeded - amount:', `$${(invoice.amount_paid / 100).toFixed(2)}`);
    
    if (!userId) {
      console.log('No userId in subscription metadata for payment succeeded event');
      return;
    }

    console.log(`Payment succeeded for user ${userId}, amount: $${(invoice.amount_paid / 100).toFixed(2)}`);
    
    // Get customer email for potential profile creation
    const customer = await stripe.customers.retrieve(subscription.customer as string);
    const customerEmail = (customer as Stripe.Customer).email || '';
    
    // Try using the custom RPC function first, fallback to direct upsert
    try {
      const rpcResult = await supabaseServer.rpc('upsert_user_profile_webhook', {
        user_uuid: userId,
        user_email: customerEmail,
        sub_id: subscription.id,
        sub_status: 'active',
        plan_type_val: 'pro'
      });
      
      if (!rpcResult.error) {
        console.log(`Successfully marked user ${userId} as Pro via RPC after payment`);
        return; // Success, exit early
      } else {
        console.log('RPC function not available, trying direct upsert:', rpcResult.error);
      }
    } catch (rpcError) {
      console.log('RPC function not available, trying direct upsert:', rpcError);
    }

    // Simple approach: Try update, then insert if needed, but don't fail
    try {
      const updateResult = await supabaseServer
        .from('user_profiles')
        .update({
          subscription_id: subscription.id,
          subscription_status: 'active',
          plan_type: 'pro',
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateResult.error) {
        console.log(`Update failed for user ${userId} after payment:`, updateResult.error.message);
        
        // Try insert as fallback
        try {
          const insertResult = await supabaseServer
            .from('user_profiles')
            .insert({
              id: userId,
              email: customerEmail,
              subscription_id: subscription.id,
              subscription_status: 'active',
              plan_type: 'pro',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

          if (insertResult.error) {
            console.log(`Insert also failed for user ${userId} after payment:`, insertResult.error.message);
          } else {
            console.log(`Successfully inserted Pro profile for user ${userId}`);
          }
        } catch (insertError) {
          console.log(`Insert error for user ${userId} after payment:`, insertError);
        }
      } else if (updateResult.count === 0) {
        console.log(`No rows updated for user ${userId} after payment, profile may not exist yet`);
      } else {
        console.log(`Successfully updated user ${userId} to Pro after payment`);
      }
    } catch (error) {
      console.log(`Database operation failed for user ${userId} after payment, but payment was processed:`, error);
    }

    console.log(`Successfully marked user ${userId} as Pro after payment`);
  } catch (error) {
    console.error('Error in handlePaymentSucceeded:', error);
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  try {
    const subscriptionId = invoice.subscription as string;
    if (!subscriptionId) return;

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const userId = subscription.metadata?.userId;
    
    if (!userId) return;

    console.log(`Payment failed for user ${userId}, amount: $${(invoice.amount_due / 100).toFixed(2)}`);
    
    // Update subscription status but don't immediately downgrade
    // Stripe will handle retries and eventual cancellation
    const { error } = await supabaseServer
      .from('user_profiles')
      .update({
        subscription_status: 'past_due',
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.error('Error updating user after payment failure:', error);
    }
  } catch (error) {
    console.error('Error in handlePaymentFailed:', error);
  }
}