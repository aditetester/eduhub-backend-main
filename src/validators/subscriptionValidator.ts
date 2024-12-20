import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

const subscriptionSchema = Joi.object({
  userId: Joi.string().required(),
  subjectId: Joi.string().required()
});

const paymentSchema = Joi.object({
  subscriptionId: Joi.string().required(),
  paymentIntentId: Joi.string().required()
});

export const validateSubscription = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { error } = subscriptionSchema.validate(req.body);
    if (error) {
      return next(error);
    }
    next();
  } catch (error) {
    next(error);
  }
};

export const validatePayment = (req: Request, res: Response, next: NextFunction) => {
  const { error } = paymentSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }
  next();
}; 