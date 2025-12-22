import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../common/types/index.js';
import { authenticate, requireRole } from '../../common/middleware/auth.js';
import { ROLES } from '../../config/constants.js';
import prisma from '../../config/database.js';
import { z } from 'zod';

const router = Router();

router.use(authenticate);

// Validation schemas
const createRoleSchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().max(255).optional(),
  permissionIds: z.array(z.string().uuid()).optional(),
});

const updateRoleSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  description: z.string().max(255).optional().nullable(),
  permissionIds: z.array(z.string().uuid()).optional(),
});

// GET /api/roles - List all roles
router.get('/', async (_req: AuthenticatedRequest, res: Response) => {
  const roles = await prisma.role.findMany({
    include: {
      permissions: {
        include: { permission: true },
      },
      _count: { select: { employees: true } },
    },
    orderBy: { name: 'asc' },
  });

  // Transform permissions for easier consumption
  const transformedRoles = roles.map(role => ({
    ...role,
    permissions: role.permissions.map(rp => rp.permission),
    employeeCount: role._count.employees,
  }));

  res.json({ success: true, data: transformedRoles });
});

// GET /api/roles/permissions/all - List all available permissions (must be before :id route)
router.get('/permissions/all', requireRole(ROLES.ADMIN), async (_req: AuthenticatedRequest, res: Response) => {
  const permissions = await prisma.permission.findMany({
    orderBy: [{ resource: 'asc' }, { action: 'asc' }],
  });

  // Group permissions by resource
  const grouped = permissions.reduce((acc, perm) => {
    if (!acc[perm.resource]) {
      acc[perm.resource] = [];
    }
    acc[perm.resource].push(perm);
    return acc;
  }, {} as Record<string, typeof permissions>);

  res.json({ 
    success: true, 
    data: permissions,
    grouped,
  });
});

// GET /api/roles/:id - Get role by ID
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const role = await prisma.role.findUnique({
    where: { id: req.params.id },
    include: {
      permissions: {
        include: { permission: true },
      },
      _count: { select: { employees: true } },
    },
  });

  if (!role) {
    res.status(404).json({ success: false, message: 'Role not found' });
    return;
  }

  const transformedRole = {
    ...role,
    permissions: role.permissions.map(rp => rp.permission),
    employeeCount: role._count.employees,
  };

  res.json({ success: true, data: transformedRole });
});

// POST /api/roles - Create new role (admin only)
router.post('/', requireRole(ROLES.ADMIN), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validation = createRoleSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ 
        success: false, 
        message: 'Validation error', 
        errors: validation.error.flatten().fieldErrors 
      });
      return;
    }

    const { name, description, permissionIds } = validation.data;

    // Check if role name already exists
    const existing = await prisma.role.findUnique({ where: { name } });
    if (existing) {
      res.status(400).json({ success: false, message: 'Role name already exists' });
      return;
    }

    // Create role with permissions
    const role = await prisma.role.create({
      data: {
        name,
        description,
        permissions: permissionIds ? {
          create: permissionIds.map(permissionId => ({ permissionId })),
        } : undefined,
      },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });

    const transformedRole = {
      ...role,
      permissions: role.permissions.map(rp => rp.permission),
    };

    res.status(201).json({ success: true, data: transformedRole });
  } catch (error) {
    console.error('Create role error:', error);
    res.status(500).json({ success: false, message: 'Failed to create role' });
  }
});

// PUT /api/roles/:id - Update role (admin only)
router.put('/:id', requireRole(ROLES.ADMIN), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const validation = updateRoleSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ 
        success: false, 
        message: 'Validation error', 
        errors: validation.error.flatten().fieldErrors 
      });
      return;
    }

    const { name, description, permissionIds } = validation.data;

    // Check if role exists
    const existing = await prisma.role.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Role not found' });
      return;
    }

    // Prevent editing system roles
    if (existing.isSystem) {
      res.status(403).json({ success: false, message: 'Cannot modify system roles' });
      return;
    }

    // Check for duplicate name
    if (name && name !== existing.name) {
      const duplicate = await prisma.role.findUnique({ where: { name } });
      if (duplicate) {
        res.status(400).json({ success: false, message: 'Role name already exists' });
        return;
      }
    }

    // Update role
    const role = await prisma.role.update({
      where: { id },
      data: {
        name,
        description,
        // If permissionIds provided, replace all permissions
        ...(permissionIds !== undefined && {
          permissions: {
            deleteMany: {},
            create: permissionIds.map(permissionId => ({ permissionId })),
          },
        }),
      },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });

    const transformedRole = {
      ...role,
      permissions: role.permissions.map(rp => rp.permission),
    };

    res.json({ success: true, data: transformedRole });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ success: false, message: 'Failed to update role' });
  }
});

// DELETE /api/roles/:id - Delete role (admin only)
router.delete('/:id', requireRole(ROLES.ADMIN), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if role exists
    const role = await prisma.role.findUnique({ 
      where: { id },
      include: { _count: { select: { employees: true } } },
    });
    
    if (!role) {
      res.status(404).json({ success: false, message: 'Role not found' });
      return;
    }

    // Prevent deleting system roles
    if (role.isSystem) {
      res.status(403).json({ success: false, message: 'Cannot delete system roles' });
      return;
    }

    // Prevent deleting roles with assigned employees
    if (role._count.employees > 0) {
      res.status(400).json({ 
        success: false, 
        message: `Cannot delete role. ${role._count.employees} employee(s) are assigned to this role.` 
      });
      return;
    }

    await prisma.role.delete({ where: { id } });

    res.json({ success: true, message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Delete role error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete role' });
  }
});

// PUT /api/roles/:id/permissions - Update role permissions (admin only)
router.put('/:id/permissions', requireRole(ROLES.ADMIN), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { permissionIds } = req.body as { permissionIds: string[] };

    if (!Array.isArray(permissionIds)) {
      res.status(400).json({ success: false, message: 'permissionIds must be an array' });
      return;
    }

    // Check if role exists
    const role = await prisma.role.findUnique({ where: { id } });
    if (!role) {
      res.status(404).json({ success: false, message: 'Role not found' });
      return;
    }

    // Prevent editing system roles
    if (role.isSystem) {
      res.status(403).json({ success: false, message: 'Cannot modify system role permissions' });
      return;
    }

    // Verify all permission IDs exist
    const permissions = await prisma.permission.findMany({
      where: { id: { in: permissionIds } },
    });

    if (permissions.length !== permissionIds.length) {
      res.status(400).json({ success: false, message: 'Some permission IDs are invalid' });
      return;
    }

    // Update permissions (replace all)
    await prisma.$transaction([
      prisma.rolePermission.deleteMany({ where: { roleId: id } }),
      prisma.rolePermission.createMany({
        data: permissionIds.map(permissionId => ({ roleId: id, permissionId })),
      }),
    ]);

    // Fetch updated role
    const updatedRole = await prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });

    const transformedRole = {
      ...updatedRole,
      permissions: updatedRole!.permissions.map(rp => rp.permission),
    };

    res.json({ success: true, data: transformedRole });
  } catch (error) {
    console.error('Update role permissions error:', error);
    res.status(500).json({ success: false, message: 'Failed to update permissions' });
  }
});

export { router as rolesRouter };
