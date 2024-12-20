import cron from 'node-cron';
import { subscriptionService } from '../services/subscriptionService';

// Run every day at midnight
cron.schedule('0 0 * * *', async () => {
  try {
    await subscriptionService.checkExpiry();
    await subscriptionService.sendRenewalReminders();
  } catch (error) {
    console.error('Error in subscription cron job:', error);
  }
}); 