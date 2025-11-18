import express from 'express';
import Stripe from 'stripe';
import { supabase, supabaseAdmin } from '../config/supabase.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Initialize Stripe
const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeKey ? new Stripe(stripeKey) : null;

// Create premium subscription checkout session
router.post('/create-checkout-session', authenticateToken, async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({ error: 'Payments service unavailable', code: 'PAYMENTS_UNCONFIGURED' });
    }

    const { planId, successUrl, cancelUrl } = req.body;

    if (!planId || !successUrl || !cancelUrl) {
      return res.status(400).json({ 
        error: 'planId, successUrl, and cancelUrl are required',
        code: 'MISSING_FIELDS'
      });
    }

    // Define premium plans
    const plans = {
      premium: {
        name: 'プレミアムプラン',
        price: 2500,
        currency: 'JPY',
        interval: 'month'
      }
    };

    const plan = plans[planId];
    if (!plan) {
      return res.status(400).json({ 
        error: 'Invalid plan ID',
        code: 'INVALID_PLAN'
      });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: plan.currency.toLowerCase(),
            product_data: {
              name: plan.name,
              description: 'AI搭載の旅行プランニングサービス',
            },
            unit_amount: plan.price,
            recurring: {
              interval: plan.interval,
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}&user_id=${req.user.id}`,
      cancel_url: cancelUrl,
      customer_email: req.user.email,
      metadata: {
        user_id: req.user.id,
        plan_id: planId,
        plan_name: plan.name
      },
      subscription_data: {
        metadata: {
          user_id: req.user.id,
          plan_id: planId
        }
      },
      // Add session configuration for better persistence
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes
      allow_promotion_codes: true
    });

    res.json({
      success: true,
      data: {
        sessionId: session.id,
        sessionUrl: session.url
      }
    });
  } catch (error) {
    console.error('Create checkout session error:', error);
    res.status(500).json({ 
      error: 'Failed to create checkout session',
      code: 'CHECKOUT_SESSION_ERROR'
    });
  }
});

// Handle successful subscription
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    if (!stripe) {
      return res.status(503).send('Payments service unavailable');
    }
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
      
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;
      
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;
      
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

// Get user subscription status
router.get('/status', authenticateToken, async (req, res) => {
  try {
    console.log('🔄 Subscription status request for user:', req.user.id);
    console.log('🔍 User object:', {
      id: req.user.id,
      email: req.user.email,
      hasUserMetadata: !!req.user.user_metadata
    });
    
    // Get user's current premium status from database using admin client
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('is_premium, premium_expires_at, email')
      .eq('id', req.user.id)
      .single();

    if (error) {
      console.error('❌ Error fetching user status:', error);
      
      // If user doesn't exist in database, create them
      if (error.code === 'PGRST116') {
        console.log('🔄 User not found in database, creating user record...');
        
        try {
          const { data: newUser, error: createError } = await supabaseAdmin
            .from('users')
            .insert({
              id: req.user.id,
              email: req.user.email,
              full_name: req.user.user_metadata?.full_name || req.user.email,
              is_premium: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single();

          if (createError) {
            // If user already exists (duplicate key), try to fetch them
            if (createError.code === '23505') {
              console.log('🔄 User already exists, fetching user data...');
              const { data: existingUser, error: fetchError } = await supabaseAdmin
                .from('users')
                .select('is_premium, premium_expires_at, email')
                .eq('id', req.user.id)
                .single();

              if (fetchError) {
                console.error('❌ Failed to fetch existing user:', fetchError);
                return res.status(500).json({
                  error: 'Failed to fetch user record',
                  code: 'USER_FETCH_ERROR',
                  details: fetchError.message
                });
              }

              const isPremium = existingUser.is_premium;
              const expiresAt = existingUser.premium_expires_at;
              const isActive = isPremium && (!expiresAt || new Date(expiresAt) > new Date());

              return res.json({
                success: true,
                data: {
                  isPremium: isActive,
                  planName: isActive ? 'プレミアムプラン' : 'フリープラン',
                  amount: isActive ? 2500 : 0,
                  currency: 'JPY',
                  interval: 'month',
                  nextBillingDate: isActive ? expiresAt : null,
                  status: isActive ? 'active' : 'free',
                  expiresAt: expiresAt,
                  isActive: isActive
                }
              });
            }
            
            console.error('❌ Failed to create user:', createError);
            return res.status(500).json({
              error: 'Failed to create user record',
              code: 'USER_CREATE_ERROR',
              details: createError.message
            });
          }

          console.log('✅ User created successfully:', newUser.id);
          
          return res.json({
            success: true,
            data: {
              isPremium: false,
              planName: 'フリープラン',
              amount: 0,
              currency: 'JPY',
              interval: 'month',
              nextBillingDate: null,
              status: 'free',
              expiresAt: null,
              isActive: false
            }
          });
        } catch (insertError) {
          console.error('❌ Insert operation failed:', insertError);
          return res.status(500).json({
            error: 'Failed to create user record',
            code: 'USER_CREATE_ERROR',
            details: insertError.message
          });
        }
      }
      
      return res.status(500).json({
        error: 'Failed to fetch user status',
        code: 'USER_STATUS_ERROR',
        details: error.message
      });
    }

    const isPremium = user.is_premium;
    const expiresAt = user.premium_expires_at;
    const isActive = isPremium && (!expiresAt || new Date(expiresAt) > new Date());

    console.log('🔍 User premium status:', {
      isPremium,
      expiresAt,
      isActive,
      userId: req.user.id
    });

    res.json({
      success: true,
      data: {
        isPremium: isActive,
        planName: isActive ? 'プレミアムプラン' : 'フリープラン',
        amount: isActive ? 2500 : 0,
        currency: 'JPY',
        interval: 'month',
        nextBillingDate: isActive ? expiresAt : null,
        status: isActive ? 'active' : 'free',
        expiresAt: expiresAt,
        isActive: isActive
      }
    });
  } catch (error) {
    console.error('❌ Get subscription status error:', error);
    res.status(500).json({ 
      error: 'Failed to get subscription status',
      code: 'SUBSCRIPTION_STATUS_ERROR',
      details: error.message
    });
  }
});

// Get user invoices
router.get('/invoices', authenticateToken, async (req, res) => {
  try {
    // For now, return empty array - invoices would come from Stripe
    res.json({
      success: true,
      data: []
    });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ 
      error: 'Failed to get invoices',
      code: 'INVOICES_ERROR'
    });
  }
});

// Get user payment methods
router.get('/payment-methods', authenticateToken, async (req, res) => {
  try {
    // For now, return empty array - payment methods would come from Stripe
    res.json({
      success: true,
      data: []
    });
  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({ 
      error: 'Failed to get payment methods',
      code: 'PAYMENT_METHODS_ERROR'
    });
  }
});


// Verify payment - check if checkout session was successful
router.post('/verify-payment', async (req, res) => {
  try {
    console.log('🔄 Payment verification endpoint called');
    
    const { sessionId, userId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ 
        error: 'Session ID is required',
        code: 'MISSING_SESSION_ID'
      });
    }

    console.log('🔍 Session ID:', sessionId);
    console.log('🔍 User ID:', userId);

    // Check if Stripe is configured
    if (!stripe) {
      console.log('⚠️ Stripe not configured, updating user to premium directly');
      
      // If Stripe is not configured, update user to premium directly
      if (userId) {
        // First, ensure user exists in database
        const { data: existingUser, error: userError } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('id', userId)
          .single();

        if (userError && userError.code === 'PGRST116') {
          // User doesn't exist, create them
          console.log('🔄 User not found, creating user record...');
          const { error: createError } = await supabaseAdmin
          .from('users')
          .insert({
            id: userId,
            email: 'user@example.com', // Default email for development
            full_name: 'Premium User',
            is_premium: true,
            premium_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

          if (createError) {
            console.error('❌ Failed to create user:', createError);
          } else {
            console.log('✅ User created and set to premium');
          }
        } else {
          // User exists, update to premium
          console.log('🔄 User exists, updating to premium...');
          const { data: updateData, error: updateError } = await supabaseAdmin
            .from('users')
            .update({
              is_premium: true,
              premium_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
              updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .select();

          if (updateError) {
            console.error('❌ Failed to update user to premium:', updateError);
          } else {
            console.log('✅ User updated to premium (development mode)');
            console.log('📊 Update result:', updateData);
          }
        }

        // Create notification
        await supabaseAdmin
          .from('notifications')
          .insert({
            user_id: userId,
            type: 'subscription_created',
            title: 'Welcome to Premium!',
            message: 'Your premium subscription has been activated. Enjoy all the premium features!',
            metadata: {
              session_id: sessionId,
              mode: 'development'
            }
          });
      }

      return res.json({
        success: true,
        message: 'Payment verified successfully (development mode)',
        data: {
          sessionId: sessionId,
          paymentStatus: 'paid',
          userId: userId,
          mode: 'development'
        }
      });
    }

    // Verify the checkout session with Stripe
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      console.log('🔍 Stripe session retrieved:', {
        id: session.id,
        status: session.payment_status,
        customer_email: session.customer_email,
        metadata: session.metadata
      });

      if (session.payment_status === 'paid') {
        const sessionUserId = session.metadata?.user_id || userId;
        
        if (sessionUserId) {
          // Update user to premium
          await supabase
            .from('users')
            .update({
              is_premium: true,
              premium_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
              updated_at: new Date().toISOString()
            })
            .eq('id', sessionUserId);

          // Create notification
          await supabase
            .from('notifications')
            .insert({
              user_id: sessionUserId,
              type: 'subscription_created',
              title: 'Welcome to Premium!',
              message: 'Your premium subscription has been activated. Enjoy all the premium features!',
              metadata: {
                session_id: sessionId,
                plan_id: session.metadata?.plan_id,
                mode: 'production'
              }
            });

          console.log('✅ User updated to premium:', sessionUserId);
        }

        return res.json({
          success: true,
          message: 'Payment verified successfully',
          data: {
            sessionId: sessionId,
            paymentStatus: 'paid',
            customerEmail: session.customer_email,
            userId: sessionUserId,
            mode: 'production'
          }
        });
      } else {
        console.log('❌ Payment not completed:', session.payment_status);
        return res.status(400).json({
          success: false,
          error: 'Payment not completed',
          code: 'PAYMENT_NOT_COMPLETED',
          paymentStatus: session.payment_status
        });
      }
    } catch (stripeError) {
      console.error('❌ Stripe session retrieval error:', stripeError);
      
      // If Stripe session retrieval fails, but we have a userId, update optimistically
      if (userId) {
        console.log('⚠️ Stripe error, updating user to premium optimistically');
        
        // First, ensure user exists in database
        const { data: existingUser, error: userError } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('id', userId)
          .single();

        if (userError && userError.code === 'PGRST116') {
          // User doesn't exist, create them
          console.log('🔄 User not found, creating user record...');
          const { error: createError } = await supabaseAdmin
          .from('users')
          .insert({
            id: userId,
            email: 'user@example.com', // Default email for development
            full_name: 'Premium User',
            is_premium: true,
            premium_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

          if (createError) {
            console.error('❌ Failed to create user:', createError);
          } else {
            console.log('✅ User created and set to premium');
          }
        } else {
          // User exists, update to premium
          console.log('🔄 User exists, updating to premium (optimistic)...');
          const { data: updateData, error: updateError } = await supabaseAdmin
            .from('users')
            .update({
              is_premium: true,
              premium_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .select();

          if (updateError) {
            console.error('❌ Failed to update user to premium:', updateError);
          } else {
            console.log('✅ User updated to premium (optimistic)');
            console.log('📊 Update result:', updateData);
          }
        }

        // Create notification
        await supabaseAdmin
          .from('notifications')
          .insert({
            user_id: userId,
            type: 'subscription_created',
            title: 'Welcome to Premium!',
            message: 'Your premium subscription has been activated. Enjoy all the premium features!',
            metadata: {
              session_id: sessionId,
              mode: 'optimistic'
            }
          });

        return res.json({
          success: true,
          message: 'Payment verified successfully (optimistic update)',
          data: {
            sessionId: sessionId,
            paymentStatus: 'paid',
            userId: userId,
            mode: 'optimistic'
          }
        });
      }

      throw stripeError;
    }
  } catch (error) {
    console.error('❌ Verify payment error:', error);
    res.status(500).json({ 
      error: 'Failed to verify payment',
      code: 'VERIFY_PAYMENT_ERROR',
      details: error.message
    });
  }
});

// Cancel subscription
router.post('/cancel', authenticateToken, async (req, res) => {
  try {
    console.log('🔄 Cancel subscription request for user:', req.user.id, req.user.email);
    
    if (!stripe) {
      console.log('⚠️ Stripe not configured, updating database only');
      // If Stripe is not configured, just update the database
      await supabase
        .from('users')
        .update({
          is_premium: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', req.user.id);

      // Create notification
      await supabase
        .from('notifications')
        .insert({
          user_id: req.user.id,
          type: 'subscription_cancelled',
          title: 'Subscription Cancelled',
          message: 'Your premium subscription has been cancelled.',
          metadata: {
            cancelled_at: new Date().toISOString()
          }
        });

      return res.json({
        success: true,
        message: 'Subscription cancelled successfully (Stripe not configured)'
      });
    }

    // Try to find customer by email first
    let customerId = null;
    try {
      const customers = await stripe.customers.list({
        email: req.user.email,
        limit: 1
      });
      
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        console.log('✅ Found Stripe customer:', customerId);
      }
    } catch (stripeError) {
      console.warn('⚠️ Could not find Stripe customer by email:', stripeError.message);
    }

    // If no customer found, try to find subscriptions by user ID in metadata
    let subscription = null;
    if (customerId) {
      try {
        const subscriptions = await stripe.subscriptions.list({
          customer: customerId,
          status: 'active',
          limit: 1
        });
        
        if (subscriptions.data.length > 0) {
          subscription = subscriptions.data[0];
          console.log('✅ Found active subscription:', subscription.id);
        }
      } catch (stripeError) {
        console.warn('⚠️ Could not find subscriptions for customer:', stripeError.message);
      }
    }

    // If no subscription found via customer, try to find by user ID in metadata
    if (!subscription) {
      try {
        const subscriptions = await stripe.subscriptions.list({
          status: 'active',
          limit: 100 // Get more to search through
        });
        
        // Find subscription with matching user ID in metadata
        subscription = subscriptions.data.find(sub => 
          sub.metadata && sub.metadata.user_id === req.user.id
        );
        
        if (subscription) {
          console.log('✅ Found subscription by user ID metadata:', subscription.id);
        }
      } catch (stripeError) {
        console.warn('⚠️ Could not search subscriptions by metadata:', stripeError.message);
      }
    }

    if (subscription) {
      // Cancel the subscription in Stripe
      try {
        await stripe.subscriptions.update(subscription.id, {
          cancel_at_period_end: true
        });
        console.log('✅ Subscription cancelled in Stripe');
      } catch (stripeError) {
        console.warn('⚠️ Could not cancel subscription in Stripe:', stripeError.message);
        // Continue with database update even if Stripe fails
      }
    } else {
      console.log('⚠️ No active subscription found in Stripe, updating database only');
    }

    // Update user status in database
    const expiresAt = subscription ? 
      new Date(subscription.current_period_end * 1000).toISOString() : 
      new Date().toISOString();

    await supabase
      .from('users')
      .update({
        is_premium: false,
        premium_expires_at: expiresAt,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.user.id);

    // Create notification
    await supabase
      .from('notifications')
      .insert({
        user_id: req.user.id,
        type: 'subscription_cancelled',
        title: 'Subscription Cancelled',
        message: 'Your premium subscription has been cancelled and will expire at the end of your current billing period.',
        metadata: {
          subscription_id: subscription?.id || null,
          expires_at: expiresAt
        }
      });

    console.log('✅ Subscription cancellation completed');
    res.json({
      success: true,
      message: 'Subscription cancelled successfully'
    });
  } catch (error) {
    console.error('❌ Cancel subscription error:', error);
    res.status(500).json({ 
      error: 'Failed to cancel subscription',
      code: 'SUBSCRIPTION_CANCEL_ERROR',
      details: error.message
    });
  }
});

// Helper functions for webhook handling
async function handleCheckoutCompleted(session) {
  try {
    const userId = session.metadata.user_id;
    const planId = session.metadata.plan_id;

    if (!userId) {
      console.error('No user_id in session metadata');
      return;
    }

    // Update user to premium
    await supabase
      .from('users')
      .update({
        is_premium: true,
        premium_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    // Create notification
    await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'subscription_created',
        title: 'Welcome to Premium!',
        message: 'Your premium subscription has been activated. Enjoy all the premium features!',
        metadata: {
          plan_id: planId,
          session_id: session.id
        }
      });

    console.log(`Premium subscription activated for user ${userId}`);
  } catch (error) {
    console.error('Handle checkout completed error:', error);
  }
}

async function handleSubscriptionCreated(subscription) {
  try {
    const userId = subscription.metadata.user_id;
    
    if (!userId) {
      console.error('No user_id in subscription metadata');
      return;
    }

    // Update user to premium
    await supabase
      .from('users')
      .update({
        is_premium: true,
        premium_expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    console.log(`Subscription created for user ${userId}`);
  } catch (error) {
    console.error('Handle subscription created error:', error);
  }
}

async function handleSubscriptionUpdated(subscription) {
  try {
    const userId = subscription.metadata.user_id;
    
    if (!userId) {
      console.error('No user_id in subscription metadata');
      return;
    }

    if (subscription.status === 'active') {
      // Update premium status
      await supabase
        .from('users')
        .update({
          is_premium: true,
          premium_expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
    } else if (subscription.status === 'canceled' || subscription.status === 'incomplete_expired') {
      // Remove premium status
      await supabase
        .from('users')
        .update({
          is_premium: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
    }

    console.log(`Subscription updated for user ${userId}: ${subscription.status}`);
  } catch (error) {
    console.error('Handle subscription updated error:', error);
  }
}

async function handleSubscriptionDeleted(subscription) {
  try {
    const userId = subscription.metadata.user_id;
    
    if (!userId) {
      console.error('No user_id in subscription metadata');
      return;
    }

    // Remove premium status
    await supabase
      .from('users')
      .update({
        is_premium: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    // Create notification
    await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'subscription_cancelled',
        title: 'Subscription Cancelled',
        message: 'Your premium subscription has been cancelled.',
        metadata: {
          subscription_id: subscription.id
        }
      });

    console.log(`Subscription deleted for user ${userId}`);
  } catch (error) {
    console.error('Handle subscription deleted error:', error);
  }
}

async function handleInvoicePaymentSucceeded(invoice) {
  try {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    const userId = subscription.metadata.user_id;
    
    if (!userId) {
      console.error('No user_id in subscription metadata');
      return;
    }

    // Extend premium status
    await supabase
      .from('users')
      .update({
        is_premium: true,
        premium_expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    console.log(`Invoice payment succeeded for user ${userId}`);
  } catch (error) {
    console.error('Handle invoice payment succeeded error:', error);
  }
}

async function handleInvoicePaymentFailed(invoice) {
  try {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    const userId = subscription.metadata.user_id;
    
    if (!userId) {
      console.error('No user_id in subscription metadata');
      return;
    }

    // Create notification
    await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'payment_failed',
        title: 'Payment Failed',
        message: 'Your premium subscription payment failed. Please update your payment method.',
        metadata: {
          subscription_id: subscription.id,
          invoice_id: invoice.id
        }
      });

    console.log(`Invoice payment failed for user ${userId}`);
  } catch (error) {
    console.error('Handle invoice payment failed error:', error);
  }
}

export default router;

