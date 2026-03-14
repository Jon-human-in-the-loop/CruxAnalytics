import { Router } from 'express';
import { getSubscriptionStatus } from '../services/subscription-service';

const router = Router();

router.get('/status', async (req, res) => {
  try {
    const openId = req.headers['x-user-openid'] as string | undefined;

    // In Open Source mode, we always provide premium status
    const status = await getSubscriptionStatus(openId || 'guest');

    res.json({
      ...status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting subscription status:', error);

    res.status(500).json({
      error: 'Failed to get subscription status',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
