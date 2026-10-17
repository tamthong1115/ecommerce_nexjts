import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ResponseFactory } from "@/lib/api-response";
import { withPermission } from "@/lib/authz/with-permission";
import { invalidateSubjectCache } from "@/lib/authz/load";
import { HttpStatus } from "@/types/api";
import { z } from "zod";

const assignRoleSchema = z.object({
  userId: z.string().uuid(),
  roleId: z.string().uuid(),
  shopId: z.string().uuid().optional().nullable(),
});

export const POST = withPermission("platform:roles:assign")(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const validated = assignRoleSchema.parse(body);

    const assignment = await prisma.userRole.upsert({
      where: {
        userId_roleId_shopId: {
          userId: validated.userId,
          roleId: validated.roleId,
          shopId: validated.shopId ?? "00000000-0000-0000-0000-000000000000",
        },
      },
      create: {
        userId: validated.userId,
        roleId: validated.roleId,
        shopId: validated.shopId ?? null,
      },
      update: {},
    });

    await invalidateSubjectCache(validated.userId);

    return ResponseFactory.toNextResponse(
      ResponseFactory.success({
        data: assignment,
        message: "Role assigned successfully",
        code: HttpStatus.OK,
      })
    );
  } catch (error) {
    return ResponseFactory.toNextResponse(ResponseFactory.handleError(error));
  }
});

export const DELETE = withPermission("platform:roles:assign")(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const validated = assignRoleSchema.parse(body);

    await prisma.userRole.deleteMany({
      where: {
        userId: validated.userId,
        roleId: validated.roleId,
        shopId: validated.shopId ?? null,
      },
    });

    await invalidateSubjectCache(validated.userId);

    return ResponseFactory.toNextResponse(
      ResponseFactory.success({
        data: null,
        message: "Role removed successfully",
        code: HttpStatus.OK,
      })
    );
  } catch (error) {
    return ResponseFactory.toNextResponse(ResponseFactory.handleError(error));
  }
});

