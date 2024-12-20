import express, { Request, Response, RequestHandler, NextFunction } from 'express';
import { 
  getPublicBoards, 
  getPublicBoardDetails 
} from '../../controller/User/boardController';
import { 
  getPublicStandards, 
  getPublicStandardDetails 
} from '../../controller/User/standardController';
import { login, register, updateProfile } from '../../controller/User/authController';
import { getSubjectsByStandard ,searchSubjects,getSubjectDetails} from '../../controller/User/subjectController';
import * as ResourceController from "../../controller/User/resourceController"
import { checkSubscription, checkSubscriptionStatus} from '../../middleware/checkSubscription';
import * as SubscriptionController from '../../controller/User/subscriptionController';
import { authenticateUser } from '../../middleware/auth';
import subscriptionRoutes from '../subscriptionRoutes';

const router = express.Router();

// Board routes
router.get('/boards', async (req: Request, res: Response) => {
    return await getPublicBoards(req, res);
});
router.get('/boards/:boardId', async (req: Request, res: Response) => {
    await getPublicBoardDetails(req, res);
});

// Standard routes
router.get('/boards/:boardId/standards', async (req: Request, res: Response) => {
    await getPublicStandards(req, res);
});
router.get('/standards/:standardId', async (req: Request, res: Response) => {
    await getPublicStandardDetails(req, res);
});


router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await login(req, res);
  } catch (error) {
    next(error);
  }
});
router.post('/register', async (req: Request, res: Response) => {
    await register(req, res);
});
router.put('/profile', async (req: Request, res: Response) => {
    await updateProfile(req, res);
});
// router.put('/change-password', async (req: Request, res: Response) => {
//     await changePassword(req, res);
// });

// router.get('/profile', async (req: Request, res: Response) => {
//     await getProfile(req, res);
// });

router.get('/standards/:standardId/subjects', async (req: Request, res: Response) => {
    await getSubjectsByStandard(req, res);
});

router.get('/search', async (req: Request, res: Response) => {
    await searchSubjects(req, res);
});

    router.get('/:subject_id', async (req: Request, res: Response) => {
    await getSubjectDetails(req, res);
});



router.get("/resources", ResourceController.getResources);

// Get single resource by ID
router.get("/resources/:id", ResourceController.getResourceById as express.RequestHandler);

// Get resources by subject
router.get(
  "/subjects/:subjectId/resources",
  checkSubscription as RequestHandler,
  ResourceController.getResourcesBySubject as RequestHandler
);

// Search resources
router.get("/search/resources", ResourceController.searchResources as express.RequestHandler);

// Add this new route
router.post("/subscribe", ResourceController.subscribeToSubject as express.RequestHandler);

router.get('/subscription/status/:subjectId',
  authenticateUser as RequestHandler,
  SubscriptionController.getSubscriptionStatus as RequestHandler
);

router.post('/webhook/stripe',
  express.raw({ type: 'application/json' }),
  SubscriptionController.handleStripeWebhook as RequestHandler
);

// Add subscription routes
router.post("/subscribe/initiate", SubscriptionController.initiateSubscription as express.RequestHandler);
router.post("/subscribe/confirm", async (req: Request, res: Response, next: NextFunction) => {
    try {
        await SubscriptionController.confirmSubscription(req, res);
        return;
    } catch (error) {
        next(error);
    }

    
    
});

router.use('/resources/subscription', checkSubscriptionStatus as RequestHandler);
router.use('/subscriptions', checkSubscriptionStatus as RequestHandler);

router.use('/subscription', subscriptionRoutes);



export default router;