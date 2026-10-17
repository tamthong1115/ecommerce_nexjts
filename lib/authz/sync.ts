import { prisma } from "@/lib/db";
import { PERMISSION_REGISTRY, SYSTEM_ROLE_DEFINITIONS } from "./registry";

export async function syncPermissionsAndSystemRoles(): Promise<{
  permissionsSynced: number;
  rolesSynced: number;
}> {
  let permissionsSynced = 0;
  let rolesSynced = 0;

  for (const perm of PERMISSION_REGISTRY) {
    const parts = perm.key.split(":");
    const resource = parts.length > 1 ? parts[parts.length - 2] : "all";
    const action = parts[parts.length - 1];

    await prisma.permission.upsert({
      where: { key: perm.key },
      create: {
        key: perm.key,
        displayName: perm.displayName,
        description: perm.description,
        module: perm.module,
        resource,
        action,
        scope: perm.scope,
      },
      update: {
        displayName: perm.displayName,
        description: perm.description,
        module: perm.module,
        resource,
        action,
        scope: perm.scope,
      },
    });
    permissionsSynced++;
  }

  const allDbPermissions = await prisma.permission.findMany({
    select: { id: true, key: true },
  });
  const permMap = new Map(allDbPermissions.map((p) => [p.key, p.id]));

  for (const roleDef of SYSTEM_ROLE_DEFINITIONS) {
    let role = await prisma.authRole.findFirst({
      where: {
        key: roleDef.code,
        shopId: null,
      },
    });

    if (!role) {
      role = await prisma.authRole.create({
        data: {
          key: roleDef.code,
          name: roleDef.name,
          description: roleDef.description,
          scope: roleDef.scope,
          isSystem: roleDef.isSystem,
          shopId: null,
        },
      });
    } else {
      role = await prisma.authRole.update({
        where: { id: role.id },
        data: {
          name: roleDef.name,
          description: roleDef.description,
          isSystem: roleDef.isSystem,
          scope: roleDef.scope,
        },
      });
    }

    rolesSynced++;

    await prisma.rolePermission.deleteMany({
      where: { roleId: role.id },
    });

    const rolePermData = roleDef.permissions
      .map((permKey) => {
        const permId = permMap.get(permKey);
        if (!permId) return null;
        return {
          roleId: role.id,
          permissionId: permId,
          effect: "ALLOW" as const,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    if (rolePermData.length > 0) {
      await prisma.rolePermission.createMany({
        data: rolePermData,
        skipDuplicates: true,
      });
    }
  }

  return { permissionsSynced, rolesSynced };
}

