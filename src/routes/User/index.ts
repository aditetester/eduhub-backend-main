import express, { Request, Response } from 'express';
import { 
  getPublicBoards, 
  getPublicBoardDetails 
} from '../../controller/User/boardController';
import { 
  getPublicStandards, 
  getPublicStandardDetails 
} from '../../controller/User/standardController';
import { login, register, updateProfile, changePassword, getProfile } from '../../controller/User/adminController';
import { getSubjectsByStandard ,searchSubjects,getSubjectDetails} from '../../controller/User/subjectController';

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


router.post('/login', async (req: Request, res: Response) => {
    await login(req, res);
});
router.post('/register', async (req: Request, res: Response) => {
    await register(req, res);
});
router.put('/profile', async (req: Request, res: Response) => {
    await updateProfile(req, res);
});
router.put('/change-password', async (req: Request, res: Response) => {
    await changePassword(req, res);
});

router.get('/profile', async (req: Request, res: Response) => {
    await getProfile(req, res);
});

router.get('/standard/:standard_id', async (req: Request, res: Response) => {
    await getSubjectsByStandard(req, res);
});

router.get('/search', async (req: Request, res: Response) => {
    await searchSubjects(req, res);
});

    router.get('/:subject_id', async (req: Request, res: Response) => {
    await getSubjectDetails(req, res);
});

export default router;