import { Request, Response } from 'express';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-10-28.acacia'
});

export const createCheckoutSession = async (req: Request, res: Response) => {
  try {
    // Log the incoming request
    console.log('Creating checkout session:', {
      body: req.body,
      user: req.user,
      headers: req.headers
    });

    const { subjectId, type } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Create Stripe session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'inr',
          product_data: {
            name: `${type} Subscription`,
          },
          unit_amount: type === 'SUBJECT' ? 49900 : 99900, // Amount in paise
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/subscription/cancel`,
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
    console.error('Checkout session error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating checkout session'
    });
  }
};