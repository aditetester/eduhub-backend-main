import { Request, Response } from 'express';
import Stripe from 'stripe';
import Subscription from '../../models/Subscription';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY must be defined');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-10-28.acacia'
});

export const createCheckoutSession = async (req: Request, res: Response) => {
  try {
    const { subjectId, type } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Set fixed prices based on type
    const amount = type === 'SUBJECT' ? 499 : 999;

    // Update success URL to include session ID
    const successUrl = `http://localhost:3001/subscription/success?session_id={CHECKOUT_SESSION_ID}&subject_id=${subjectId}`;

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'inr',
          product_data: {
            name: `${type} Subscription`,
            description: type === 'SUBJECT' ? 'Single Subject Access' : 'Full Standard Access'
          },
          unit_amount: amount * 100
        },
        quantity: 1
      }],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: 'http://localhost:3000/resources',
      client_reference_id: userId,
      metadata: {
        userId,
        subjectId,
        type
      }
    });

    res.json({
      success: true,
      url: session.url
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating checkout session'
    });
  }
};

// Add new verification endpoint
export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;
    const userId = req.user?.id;

    if (!sessionId || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Missing session ID or user ID'
        
      });
    }

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Verify that this session belongs to this user
    if (session.client_reference_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    // Check if payment was successful
    if (session.payment_status === 'paid') {
      // Find or create subscription
      const subscription = await Subscription.findOneAndUpdate(
        {
          userId,
          subjectId: session.metadata?.subjectId
        },
        {
          status: 'active',
          paymentId: session.payment_intent,
          startDate: new Date(),
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        },
        { upsert: true, new: true }
      );

      return res.json({
        success: true,
        message: 'Payment verified successfully',
        subscription,
        subjectId: session.metadata?.subjectId
      });
    }

    res.status(400).json({
      success: false,
      message: 'Payment not completed'
    });

  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying payment'
    });
  }
};


export const getSubscriptionStatus = async (req: Request, res: Response) => {
    // Implementation
};

export const handleStripeWebhook = async (req: Request, res: Response) => {
  try {
    const sig = req.headers['stripe-signature'] as string;
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!endpointSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET must be defined');
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle successful payment
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      // Get the metadata we stored during checkout
      const metadata = session.metadata;
      if (!metadata) {
        throw new Error('Session metadata is missing');
      }

      const { subjectId, type } = metadata as { subjectId: string; type: string };
      const userId = session.client_reference_id;

      // Create new subscription record
      const subscription = new Subscription({
        userId,
        type,
        status: 'active',
        ...(type === 'SUBJECT' ? { subjectId } : { standardId: subjectId }),
        paymentId: session.payment_intent,
        startDate: new Date(),
        // Set expiry date (e.g., 1 year from now)
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      });

      await subscription.save();
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
};

export const initiateSubscription = async (req: Request, res: Response) => {
    // Implementation
};

export const confirmSubscription = async (req: Request, res: Response) => {
    // Implementation
};
