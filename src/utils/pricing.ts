import Subject from "../models/Subject";
import { ApiError } from "./ApiError";

export const getPriceForSubscription = async (subscriptionType: string, referenceId: string) => {
  const subject = await Subject.findById(referenceId);
  if (!subject) throw new ApiError(404, 'Subject not found');
  
  switch(subscriptionType.toUpperCase()) {
    case 'STANDARD':
      return subject.price || 0;
    case 'PREMIUM':
      return subject.price || 0;
    default:
      throw new ApiError(400, 'Invalid subscription type');
  }
}; 