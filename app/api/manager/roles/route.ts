import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ResponseFactory } from "@/lib/api-response";
import { withPermission } from "@/lib/authz/with-permission";
import { HttpStatus } from "@/types/api";
import { z } from "zod";

const createRoleSchema = z.object({
  key: z.string().min(2),
  name: z.string().min(2),
  description: z.string().optional(),
  scope: z.enum(["PLATFORM", "SHOP", "BOTH"]).default("PLATFORM"),
  permissionIds: z.array(z.string().uuid()).default([]),
});

export const GET = withPermission("platform:roles:read")(async (_req: NextRequest) => {
  try {
    const [roles, permissions] = await Promise.all([
      prisma.authRole.findMany({
        where: { shopId: null },
        include: {
          rolePermissions: {
            include: {
              permission: true,
            },
          },
          _count: {
            select: { userRoles: true },
          },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.permission.findMany({
        orderBy: [{ module: "asc" }, { key: "asc" }],
      }),
    ]);

    return ResponseFactory.toNextResponse(
      ResponseFactory.success({
        data: { roles, permissions },
        message: "Roles and permissions retrieved successfully",
        code: HttpStatus.OK,
      })
    );
  } catch (error) {
    return ResponseFactory.toNextResponse(ResponseFactory.handleError(error));
  }
});

export const POST = withPermission("platform:roles:write")(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const validated = createRoleSchema.parse(body);

    const existingRole = await prisma.authRole.findFirst({
      where: {
        key: validated.key,
        shopId: null,
      },
    });

    if (existingRole) {
      return ResponseFactory.toNextResponse(
        ResponseFactory.error({
          message: "Role key already exists",
          code: HttpStatus.CONFLICT,
        })
      );
    }

    const createdRole = await prisma.authRole.create({
      data: {
        key: validated.key,
        name: validated.name,
        description: validated.description,
        scope: validated.scope,
        isSystem: false,
        shopId: null,
        rolePermissions: {
          create: validated.permissionIds.map((pId) => ({
            permissionId: pId,
            effect: "ALLOW",
          })),
        },
      },
      include: {
        rolePermissions: {
          include: { permission: true },
        },
      },
    });

    return ResponseFactory.toNextResponse(
      ResponseFactory.success({
        data: createdRole,
        message: "Role created successfully",
        code: HttpStatus.CREATED,
      })
    );
  } catch (error) {
    return ResponseFactory.toNextResponse(ResponseFactory.handleError(error));
  }
});

