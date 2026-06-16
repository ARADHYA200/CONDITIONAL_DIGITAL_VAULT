import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead
} from '../services/notification.service';
import { isValidObjectId } from '../utils/serialize';

const router = Router();

router.use(authenticateToken);

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const unreadOnly = req.query.unread === 'true';
    const notifications = await getUserNotifications(req.userId!, unreadOnly);
    res.json(notifications);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/read-all', async (req: AuthRequest, res: Response) => {
  try {
    await markAllNotificationsRead(req.userId!);
    res.json({ message: 'All notifications marked as read' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/read', async (req: AuthRequest, res: Response) => {
  try {
    const notificationId = req.params.id;
    if (!isValidObjectId(notificationId)) {
      return res.status(400).json({ error: 'Invalid notification ID' });
    }

    await markNotificationRead(notificationId, req.userId!);
    res.json({ message: 'Notification marked as read' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
