import express from 'express';
import Stripe from 'stripe';
import { supabase } from '../config/supabase.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Initialize Stripe
const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeKey ? new Stripe(stripeKey) : null;

// Create payment intent
router.post('/create-intent', authenticateToken, async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({ error: 'Payments service unavailable', code: 'PAYMENTS_UNCONFIGURED' });
    }
    const { amount, currency = 'USD', booking_id, metadata = {} } = req.body;

    if (!amount || !booking_id) {
      return res.status(400).json({ 
        error: 'Amount and booking_id are required',
        code: 'MISSING_FIELDS'
      });
    }

    // Verify booking belongs to user
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', booking_id)
      .eq('user_id', req.user.id)
      .single();

    if (bookingError || !booking) {
      return res.status(404).json({ 
        error: 'Booking not found',
        code: 'BOOKING_NOT_FOUND'
      });
    }

    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      metadata: {
        user_id: req.user.id,
        booking_id,
        ...metadata
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Store payment record in database
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: req.user.id,
        booking_id,
        stripe_payment_intent_id: paymentIntent.id,
        amount,
        currency,
        status: 'pending'
      })
      .select()
      .single();

    if (paymentError) {
      return res.status(400).json({ 
        error: 'Failed to create payment record',
        code: 'PAYMENT_CREATE_ERROR',
        details: paymentError.message
      });
    }

    res.json({
      success: true,
      data: {
        client_secret: paymentIntent.client_secret,
        payment_id: payment.id,
        amount,
        currency
      }
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({ 
      error: 'Failed to create payment intent',
      code: 'PAYMENT_INTENT_ERROR'
    });
  }
});

// Confirm payment
router.post('/confirm', authenticateToken, async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({ error: 'Payments service unavailable', code: 'PAYMENTS_UNCONFIGURED' });
    }
    const { payment_intent_id } = req.body;

    if (!payment_intent_id) {
      return res.status(400).json({ 
        error: 'Payment intent ID is required',
        code: 'MISSING_PAYMENT_INTENT'
      });
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ 
        error: 'Payment not successful',
        code: 'PAYMENT_NOT_SUCCESSFUL',
        status: paymentIntent.status
      });
    }

    // Update payment record in database
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .update({
        status: 'paid',
        transaction_id: paymentIntent.charges.data[0]?.id,
        payment_method: paymentIntent.payment_method_types[0],
        updated_at: new Date().toISOString()
      })
      .eq('stripe_payment_intent_id', payment_intent_id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (paymentError) {
      return res.status(400).json({ 
        error: 'Failed to update payment record',
        code: 'PAYMENT_UPDATE_ERROR',
        details: paymentError.message
      });
    }

    // Update booking status
    await supabase
      .from('bookings')
      .update({
        status: 'confirmed',
        updated_at: new Date().toISOString()
      })
      .eq('id', payment.booking_id);

    // Create notification
    await supabase
      .from('notifications')
      .insert({
        user_id: req.user.id,
        type: 'payment_success',
        title: 'Payment Successful',
        message: `Your payment of ${payment.currency} ${payment.amount} has been processed successfully.`,
        metadata: {
          payment_id: payment.id,
          booking_id: payment.booking_id
        }
      });

    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ 
      error: 'Failed to confirm payment',
      code: 'PAYMENT_CONFIRM_ERROR'
    });
  }
});

// Get payment history
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, limit = 20, offset = 0 } = req.query;

    let query = supabase
      .from('payments')
      .select(`
        *,
        bookings!payments_booking_id_fkey(
          *,
          trips!bookings_trip_id_fkey(title, destination)
        )
      `)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: payments, error } = await query;

    if (error) {
      return res.status(400).json({ 
        error: 'Failed to fetch payments',
        code: 'PAYMENTS_FETCH_ERROR'
      });
    }

    res.json({
      success: true,
      data: payments
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch payments',
      code: 'PAYMENTS_FETCH_ERROR'
    });
  }
});

// Get single payment
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: payment, error } = await supabase
      .from('payments')
      .select(`
        *,
        bookings!payments_booking_id_fkey(
          *,
          trips!bookings_trip_id_fkey(*)
        )
      `)
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !payment) {
      return res.status(404).json({ 
        error: 'Payment not found',
        code: 'PAYMENT_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch payment',
      code: 'PAYMENT_FETCH_ERROR'
    });
  }
});

// Request refund
router.post('/:id/refund', authenticateToken, async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({ error: 'Payments service unavailable', code: 'PAYMENTS_UNCONFIGURED' });
    }
    const { id } = req.params;
    const { reason, amount } = req.body;

    // Get payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (paymentError || !payment) {
      return res.status(404).json({ 
        error: 'Payment not found',
        code: 'PAYMENT_NOT_FOUND'
      });
    }

    if (payment.status !== 'paid') {
      return res.status(400).json({ 
        error: 'Only paid payments can be refunded',
        code: 'INVALID_REFUND_STATUS'
      });
    }

    // Create refund with Stripe
    const refundAmount = amount ? Math.round(amount * 100) : undefined;
    const stripeRefund = await stripe.refunds.create({
      payment_intent: payment.stripe_payment_intent_id,
      amount: refundAmount,
      reason: 'requested_by_customer',
      metadata: {
        user_id: req.user.id,
        payment_id: id,
        reason
      }
    });

    // Update payment record
    const refundAmountDecimal = refundAmount ? refundAmount / 100 : payment.amount;
    const { data: updatedPayment, error: updateError } = await supabase
      .from('payments')
      .update({
        status: 'refunded',
        refund_amount: refundAmountDecimal,
        refund_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return res.status(400).json({ 
        error: 'Failed to update payment record',
        code: 'PAYMENT_UPDATE_ERROR',
        details: updateError.message
      });
    }

    // Create notification
    await supabase
      .from('notifications')
      .insert({
        user_id: req.user.id,
        type: 'refund_processed',
        title: 'Refund Processed',
        message: `Your refund of ${payment.currency} ${refundAmountDecimal} has been processed.`,
        metadata: {
          payment_id: id,
          refund_id: stripeRefund.id
        }
      });

    res.json({
      success: true,
      data: {
        refund_id: stripeRefund.id,
        amount: refundAmountDecimal,
        status: stripeRefund.status
      }
    });
  } catch (error) {
    console.error('Refund payment error:', error);
    res.status(500).json({ 
      error: 'Failed to process refund',
      code: 'REFUND_ERROR'
    });
  }
});

// Stripe webhook handler
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
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        await handlePaymentSuccess(paymentIntent);
        break;
      
      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        await handlePaymentFailure(failedPayment);
        break;
      
      case 'charge.dispute.created':
        const dispute = event.data.object;
        await handleDispute(dispute);
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

// Helper functions for webhook handling
async function handlePaymentSuccess(paymentIntent) {
  try {
    const { data: payment, error } = await supabase
      .from('payments')
      .update({
        status: 'paid',
        transaction_id: paymentIntent.charges.data[0]?.id,
        payment_method: paymentIntent.payment_method_types[0],
        updated_at: new Date().toISOString()
      })
      .eq('stripe_payment_intent_id', paymentIntent.id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update payment on success:', error);
      return;
    }

    // Update booking status
    await supabase
      .from('bookings')
      .update({
        status: 'confirmed',
        updated_at: new Date().toISOString()
      })
      .eq('id', payment.booking_id);

    // Create notification
    await supabase
      .from('notifications')
      .insert({
        user_id: payment.user_id,
        type: 'payment_success',
        title: 'Payment Successful',
        message: `Your payment of ${payment.currency} ${payment.amount} has been processed successfully.`,
        metadata: {
          payment_id: payment.id,
          booking_id: payment.booking_id
        }
      });
  } catch (error) {
    console.error('Handle payment success error:', error);
  }
}

async function handlePaymentFailure(paymentIntent) {
  try {
    const { data: payment, error } = await supabase
      .from('payments')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_payment_intent_id', paymentIntent.id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update payment on failure:', error);
      return;
    }

    // Create notification
    await supabase
      .from('notifications')
      .insert({
        user_id: payment.user_id,
        type: 'payment_failed',
        title: 'Payment Failed',
        message: `Your payment of ${payment.currency} ${payment.amount} could not be processed. Please try again.`,
        metadata: {
          payment_id: payment.id,
          booking_id: payment.booking_id
        }
      });
  } catch (error) {
    console.error('Handle payment failure error:', error);
  }
}

async function handleDispute(dispute) {
  try {
    // Find the payment record
    const { data: payment, error } = await supabase
      .from('payments')
      .select('*')
      .eq('transaction_id', dispute.charge)
      .single();

    if (error || !payment) {
      console.error('Payment not found for dispute:', error);
      return;
    }

    // Create notification
    await supabase
      .from('notifications')
      .insert({
        user_id: payment.user_id,
        type: 'dispute_created',
        title: 'Payment Dispute',
        message: `A dispute has been created for your payment of ${payment.currency} ${payment.amount}.`,
        metadata: {
          payment_id: payment.id,
          dispute_id: dispute.id
        }
      });
  } catch (error) {
    console.error('Handle dispute error:', error);
  }
}

export default router;
