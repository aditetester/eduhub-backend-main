import express from 'express';
import { createCheckoutSession, verifyPayment } from '../controller/User/subscriptionController';
import { authenticateUser } from '../middleware/auth';



const router = express.Router();


router.post('/checkout/create-session', authenticateUser, async (req, res) => {
  await createCheckoutSession(req, res);
});

router.post('/verify', authenticateUser, async (req, res) => {
  await verifyPayment(req, res);
});

export default router;