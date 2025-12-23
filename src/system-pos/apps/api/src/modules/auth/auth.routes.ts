import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../common/types/index.js';
import { authenticate } from '../../common/middleware/auth.js';
import * as authService from './auth.service.js';
import {
  loginSchema,
  pinLoginSchema,
  refreshTokenSchema,
  changePinSchema,
  changePasswordSchema,
} from './auth.schema.js';

const router = Router();

// POST /api/auth/login - Admin login with email/password
router.post('/login', async (req, res: Response) => {
  const input = loginSchema.parse(req.body);
  const result = await authService.login(input);
  res.json({ success: true, data: result });
});

// POST /api/auth/pin-login - Mobile POS login with PIN
router.post('/pin-login', async (req, res: Response) => {
  const input = pinLoginSchema.parse(req.body);
  const result = await authService.pinLogin(input);
  res.json({ success: true, data: result });
});

// POST /api/auth/refresh - Refresh access token
router.post('/refresh', async (req, res: Response) => {
  const { refreshToken } = refreshTokenSchema.parse(req.body);
  const result = await authService.refreshToken(refreshToken);
  res.json({ success: true, data: result });
});

// GET /api/auth/me - Get current user info
router.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const result = await authService.getMe(req.employee!.id);
  res.json({ success: true, data: result });
});

// PUT /api/auth/pin - Change PIN
router.put('/pin', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const input = changePinSchema.parse(req.body);
  const result = await authService.changePin(req.employee!.id, input);
  res.json({ success: true, data: result });
});

// PUT /api/auth/password - Change password
router.put('/password', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const input = changePasswordSchema.parse(req.body);
  const result = await authService.changePassword(req.employee!.id, input);
  res.json({ success: true, data: result });
});

// POST /api/auth/logout - Logout (client-side token removal, server-side audit)
router.post('/logout', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  await prisma.auditLog.create({
    data: {
      employeeId: req.employee!.id,
      action: 'logout',
      resource: 'auth',
    },
  });
  res.json({ success: true, message: 'Logged out successfully' });
});

// Import prisma for logout audit
import prisma from '../../config/database.js';

export { router as authRouter };

