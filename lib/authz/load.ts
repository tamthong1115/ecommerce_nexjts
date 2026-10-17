import { prisma } from "@/lib/db";
import { redisClient } from "@/lib/redis";
import type { AuthzRoleAssignment, AuthzSubject, PermissionCondition, ResolvedPermissionRule } from "./types";

const AUTHZ_CACHE_TTL_SECONDS = 600;

export async function loadSubject(userId: string): Promise<AuthzSubject | null> {
  if (!userId) return null;

  try {
    const userMeta = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        authzVersion: true,
      },
    });

    if (!userMeta) return null;

    const cacheKey = `authz:${userId}:${userMeta.authzVersion}`;

    if (redisClient) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          return JSON.parse(cached) as AuthzSubject;
        }
      } catch (cacheErr) {
        console.warn("[Authz] Redis read error, falling back to DB", cacheErr);
      }
    }

    const [userRoles, overrides] = await Promise.all([
      prisma.userRole.findMany({
        where: { userId },
        include: {
          role: {
            include: {
              rolePermissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      }),
      prisma.permissionOverride.findMany({
        where: { userId },
        include: {
          permission: true,
        },
      }),
    ]);

    const roles: AuthzRoleAssignment[] = userRoles.map((ur) => ({
      roleId: ur.role.id,
      roleKey: ur.role.key,
      roleName: ur.role.name,
      scope: ur.role.scope,
      shopId: ur.shopId,
    }));

    const rules: ResolvedPermissionRule[] = [];

    for (const ur of userRoles) {
      for (const rp of ur.role.rolePermissions) {
        rules.push({
          key: rp.permission.key,
          scope: rp.permission.scope,
          effect: rp.effect,
          shopId: ur.shopId,
          conditions: (rp.conditions as unknown as PermissionCondition[]) ?? null,
        });
      }
    }

    for (const ov of overrides) {
      rules.push({
        key: ov.permission.key,
        scope: ov.permission.scope,
        effect: ov.effect,
        shopId: ov.shopId,
        conditions: (ov.conditions as unknown as PermissionCondition[]) ?? null,
      });
    }

    const subject: AuthzSubject = {
      userId: userMeta.id,
      email: userMeta.email,
      authzVersion: userMeta.authzVersion,
      roles,
      rules,
    };

    if (redisClient) {
      try {
        await redisClient.set(cacheKey, JSON.stringify(subject), "EX", AUTHZ_CACHE_TTL_SECONDS);
      } catch (cacheErr) {
        console.warn("[Authz] Redis write error", cacheErr);
      }
    }

    return subject;
  } catch (error) {
    console.error("[Authz] Failed to load subject", error);
    return null;
  }
}

export async function invalidateSubjectCache(userId: string): Promise<number> {
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      authzVersion: { increment: 1 },
    },
    select: {
      authzVersion: true,
    },
  });

  return updatedUser.authzVersion;
}

export async function invalidateAllSubjects(): Promise<void> {
  await prisma.user.updateMany({
    data: {
      authzVersion: { increment: 1 },
    },
  });
}
