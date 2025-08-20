import { NextRequest, NextResponse } from 'next/server';
import { stripe, STRIPE_CONFIG } from '@/lib/stripe';
import { supabaseServer } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const { userId, userEmail } = await request.json();
    
    if (!userId || !userEmail) {
      return NextResponse.json(
        { error: 'User ID and email are required' },
        { status: 400 }
      );
    }

    // Check if user already has an active subscription
    let profile = null;
    try {
      const { data, error: profileError } = await supabaseServer
        .from('user_profiles')
        .select('subscription_id, subscription_status, plan_type')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        // If table doesn't exist, continue without profile check
        if (profileError.code === 'PGRST205') {
          console.log('user_profiles table not found. Continuing without profile check.');
        } else {
          console.error('Error fetching user profile:', profileError);
          throw profileError;
        }
      } else {
        profile = data;
      }
    } catch (error) {
      console.error('Error checking user profile:', error);
      // Continue without profile - allow checkout for users without profiles
    }

    // Don't allow creating checkout if user already has active subscription
    if (profile?.subscription_status === 'active' && profile?.plan_type === 'pro') {
      return NextResponse.json(
        { error: 'User already has an active Pro subscription' },
        { status: 400 }
      );
    }

    // Create or retrieve Stripe customer
    let customerId = '';
    
    // Check if customer already exists
    const existingCustomers = await stripe.customers.list({
      email: userEmail,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
    } else {
      // Create new customer
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          userId: userId,
        },
      });
      customerId = customer.id;
    }

    // Create checkout session
    console.log('Creating checkout session with:', {
      customerId,
      priceId: STRIPE_CONFIG.PRO_PLAN.priceId,
      userId,
      userEmail
    });

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: STRIPE_CONFIG.PRO_PLAN.priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/billing?canceled=true`,
      metadata: {
        userId: userId,
      },
      subscription_data: {
        metadata: {
          userId: userId,
        },
      },
    });

    console.log('Checkout session created successfully:', session.id);

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    // Log the full error details
    if (error && typeof error === 'object' && 'type' in error) {
      console.error('Stripe error details:', {
        type: error.type,
        message: error.message,
        code: error.code,
        param: error.param
      });
    }
    return NextResponse.json(
      { 
        error: 'Failed to create checkout session',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}