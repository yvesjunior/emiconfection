import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateManagerPermissions() {
  console.log('🔄 Updating manager permissions...\n');

  try {
    // Get manager role
    const managerRole = await prisma.role.findUnique({
      where: { name: 'manager' },
    });

    if (!managerRole) {
      console.error('❌ Manager role not found');
      return;
    }

    // Get permissions to add
    const permissionsToAdd = ['inventory:manage', 'expenses:view', 'expenses:create'];
    
    const permMap = new Map();
    for (const permName of permissionsToAdd) {
      const perm = await prisma.permission.findUnique({
        where: { name: permName },
      });
      if (perm) {
        permMap.set(permName, perm.id);
      } else {
        console.warn(`⚠️  Permission ${permName} not found`);
      }
    }

    // Add permissions to manager role
    let addedCount = 0;
    for (const [permName, permId] of permMap.entries()) {
      try {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: managerRole.id,
              permissionId: permId,
            },
          },
          update: {},
          create: {
            roleId: managerRole.id,
            permissionId: permId,
          },
        });
        console.log(`✅ Added permission: ${permName}`);
        addedCount++;
      } catch (error: any) {
        if (error.code === 'P2002') {
          console.log(`ℹ️  Permission ${permName} already exists for manager`);
        } else {
          console.error(`❌ Error adding ${permName}:`, error.message);
        }
      }
    }

    console.log(`\n✅ Updated manager permissions: ${addedCount} permission(s) added`);
    
    // List current manager permissions
    const currentPerms = await prisma.rolePermission.findMany({
      where: { roleId: managerRole.id },
      include: { permission: true },
    });
    
    console.log(`\n📋 Current manager permissions (${currentPerms.length}):`);
    currentPerms.forEach((rp) => {
      console.log(`   - ${rp.permission.name}`);
    });
  } catch (error) {
    console.error('❌ Error updating manager permissions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updateManagerPermissions()
  .catch((e) => {
    console.error('❌ Script failed:', e);
    process.exit(1);
  });

