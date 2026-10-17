import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ResponseFactory } from "@/lib/api-response";
import { loadSubject } from "@/lib/authz/load";
import { HttpStatus } from "@/types/api";

export async function GET(_req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return ResponseFactory.toNextResponse(
        ResponseFactory.error({
          message: "Authentication required",
          code: HttpStatus.UNAUTHORIZED,
        })
      );
    }

    const subject = await loadSubject(session.user.id);

    return ResponseFactory.toNextResponse(
      ResponseFactory.success({
        data: subject,
        message: "Subject retrieved successfully",
        code: HttpStatus.OK,
      })
    );
  } catch (error) {
    return ResponseFactory.toNextResponse(ResponseFactory.handleError(error));
  }
}

