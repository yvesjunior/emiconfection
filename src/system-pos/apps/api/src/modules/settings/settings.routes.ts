import { Router, Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../../common/types/index.js';
import { authenticate, requirePermission } from '../../common/middleware/auth.js';
import { PERMISSIONS } from '../../config/constants.js';
import prisma from '../../config/database.js';

const router = Router();

router.use(authenticate);

// GET /api/settings - Get all settings
router.get('/', async (_req: AuthenticatedRequest, res: Response) => {
  const settings = await prisma.setting.findMany({
    orderBy: { key: 'asc' },
  });

  // Convert to key-value object
  const settingsObj = settings.reduce((acc, s) => {
    let value: any = s.value;
    try {
      if (s.type === 'number') value = Number(s.value);
      else if (s.type === 'boolean') value = s.value === 'true';
      else if (s.type === 'json') value = JSON.parse(s.value);
    } catch {
      // Keep as string
    }
    acc[s.key] = value;
    return acc;
  }, {} as Record<string, any>);

  res.json({ success: true, data: settingsObj });
});

// GET /api/settings/:key - Get a specific setting
router.get('/:key', async (req: AuthenticatedRequest, res: Response) => {
  const setting = await prisma.setting.findUnique({
    where: { key: req.params.key },
  });

  if (!setting) {
    res.status(404).json({ success: false, message: 'Setting not found' });
    return;
  }

  let value: any = setting.value;
  try {
    if (setting.type === 'number') value = Number(setting.value);
    else if (setting.type === 'boolean') value = setting.value === 'true';
    else if (setting.type === 'json') value = JSON.parse(setting.value);
  } catch {
    // Keep as string
  }

  res.json({ success: true, data: { key: setting.key, value, type: setting.type } });
});

// PUT /api/settings - Update settings (batch)
const updateSettingsSchema = z.record(z.string(), z.any());

router.put('/', requirePermission(PERMISSIONS.SETTINGS_MANAGE), async (req: AuthenticatedRequest, res: Response) => {
  const input = updateSettingsSchema.parse(req.body);

  const updates = Object.entries(input).map(([key, value]) => {
    let type = 'string';
    let strValue = String(value);

    if (typeof value === 'number') {
      type = 'number';
      strValue = String(value);
    } else if (typeof value === 'boolean') {
      type = 'boolean';
      strValue = String(value);
    } else if (typeof value === 'object') {
      type = 'json';
      strValue = JSON.stringify(value);
    }

    return prisma.setting.upsert({
      where: { key },
      update: { value: strValue, type },
      create: { key, value: strValue, type },
    });
  });

  await Promise.all(updates);

  res.json({ success: true, message: 'Settings updated successfully' });
});

// GET /api/settings/loyalty-points - Get loyalty points settings
router.get('/loyalty-points', async (_req: AuthenticatedRequest, res: Response) => {
  const [attributionRate, conversionRate] = await Promise.all([
    prisma.setting.findUnique({ where: { key: 'loyalty_points_attribution_rate' } }),
    prisma.setting.findUnique({ where: { key: 'loyalty_points_conversion_rate' } }),
  ]);

  res.json({
    success: true,
    data: {
      attributionRate: attributionRate ? Number(attributionRate.value) : 0.01, // Default 1%
      conversionRate: conversionRate ? Number(conversionRate.value) : 1.0, // Default 1:1
    },
  });
});

// PUT /api/settings/loyalty-points - Update loyalty points settings (Admin only)
const loyaltyPointsSettingsSchema = z.object({
  attributionRate: z.number().min(0).max(1).optional(), // 0 to 1 (0% to 100%)
  conversionRate: z.number().positive().optional(), // Points to FCFA ratio
});

router.put('/loyalty-points', requirePermission(PERMISSIONS.SETTINGS_MANAGE), async (req: AuthenticatedRequest, res: Response) => {
  const input = loyaltyPointsSettingsSchema.parse(req.body);

  const updates: Promise<any>[] = [];

  if (input.attributionRate !== undefined) {
    updates.push(
      prisma.setting.upsert({
        where: { key: 'loyalty_points_attribution_rate' },
        update: { value: String(input.attributionRate), type: 'number' },
        create: { key: 'loyalty_points_attribution_rate', value: String(input.attributionRate), type: 'number' },
      })
    );
  }

  if (input.conversionRate !== undefined) {
    updates.push(
      prisma.setting.upsert({
        where: { key: 'loyalty_points_conversion_rate' },
        update: { value: String(input.conversionRate), type: 'number' },
        create: { key: 'loyalty_points_conversion_rate', value: String(input.conversionRate), type: 'number' },
      })
    );
  }

  await Promise.all(updates);

  res.json({ success: true, message: 'Loyalty points settings updated successfully' });
});

export { router as settingsRouter };

