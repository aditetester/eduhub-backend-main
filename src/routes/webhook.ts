import express from 'express';
import { stripeService } from '../services/stripeService';
import { subscriptionService } from '../services/subscriptionService';

const router = express.Router();

router.post('/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'] as string;
    const event = stripeService.verifyWebhookSignature(
      req.body,
      sig
    );

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        if (!session.metadata) {
          throw new Error('Missing metadata in session');
        }
        await subscriptionService.activateSubscription(
          session.metadata.userId,
          session.metadata.entityId,
          session.metadata.subscriptionType,
          session.payment_intent as string
        );
        break;
      }
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        await subscriptionService.handleFailedPayment(
          paymentIntent.metadata.subscriptionId
        );
        break;
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).send(`Webhook Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

export default router;