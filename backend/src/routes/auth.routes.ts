import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { registerUser, loginUser, getUserById } from '../services/auth.service';
import { createAuditLog } from '../services/artifact.service';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;
      const result = await registerUser(email, password);

      await createAuditLog(result.user.id, null, 'user_registered', { email });

      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;
      const result = await loginUser(email, password);

      await createAuditLog(result.user.id, null, 'user_logged_in', { email });

      res.json(result);
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  }
);

router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = await getUserById(req.userId!);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
