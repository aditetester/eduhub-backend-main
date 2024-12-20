import Subscription from '../models/Subscription';
import { addDays } from 'date-fns';

export const subscriptionService = {
  async checkExpiry() {
    try {
      // Find and update expired subscriptions
      await Subscription.updateMany(
        {
          status: 'active',
          endDate: { $lt: new Date() }
        },
        {
          status: 'expired'
        }
      );
    } catch (error) {
      console.error('Error checking subscription expiry:', error);
    }
  },
  
  async sendRenewalReminders() {
    try {
      // Find subscriptions expiring in 3 days and 1 day
      const threeDaysFromNow = addDays(new Date(), 3);
      const oneDayFromNow = addDays(new Date(), 1);
      
      const expiringSubscriptions = await Subscription.find({
        status: 'active',
        endDate: {
          $gte: new Date(),
          $lte: threeDaysFromNow
        },
        renewalReminder: false
      }).populate('user subject standard');

      for (const subscription of expiringSubscriptions) {
        const daysUntilExpiry = Math.ceil(
          (subscription.expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );

        // Send appropriate reminder based on days remaining
        if (daysUntilExpiry <= 1) {
          // Send urgent reminder
          // await emailService.sendUrgentRenewalReminder(subscription);
        } else {
          // Send regular reminder
          // await emailService.sendRenewalReminder(subscription);
        }

        (subscription as any).renewalReminder = true;
        await subscription.save();
      }
    } catch (error) {
      console.error('Error sending renewal reminders:', error);
    }
  },
  
  async activateSubscription(
    subscriptionId: string,
    userId?: string,
    entityId?: string,
    subscriptionType?: string,
    paymentIntentId?: string
  ): Promise<void> {
    try {
      await Subscription.findByIdAndUpdate(
        subscriptionId,
        {
          status: 'active',
          paymentStatus: 'completed',
          startDate: new Date(),
          endDate: addDays(new Date(), 30)
        },
        { new: true }
      );
    } catch (error) {
      console.error('Error activating subscription:', error);
      throw error;
    }
  },
  
  handleFailedPayment: async (subscriptionId: string) => {
    // Implementation for handling failed payments
    // For example:
    try {
      // Update subscription status to failed
      // Notify user
      // Any other failure handling logic
    } catch (error) {
      console.error('Failed to handle payment failure:', error);
      throw error;
    }
  }
}; 