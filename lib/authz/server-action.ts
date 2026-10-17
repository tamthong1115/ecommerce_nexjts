import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { ForbiddenError, UnauthorizedError } from "./errors";
import { loadSubject } from "./load";
import { can } from "./policy";
import type { AuthzContext, AuthzSubject } from "./types";

export interface ServerActionAuthOptions {
  getContext?: () => Promise<AuthzContext> | AuthzContext;
}

export function createProtectedAction<TArgs extends unknown[], TReturn>(
  requiredPermission: string,
  handler: (subject: AuthzSubject, ...args: TArgs) => Promise<TReturn>,
  options?: ServerActionAuthOptions
) {
  return async function (...args: TArgs): Promise<TReturn> {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      throw new UnauthorizedError("Authentication required to execute this action");
    }

    const subject = await loadSubject(session.user.id);
    if (!subject) {
      throw new UnauthorizedError("Subject could not be resolved");
    }

    const authzCtx = options?.getContext ? await options.getContext() : {};

    const allowed = can(subject, requiredPermission, authzCtx);
    if (!allowed) {
      throw new ForbiddenError(
        `Action forbidden: missing '${requiredPermission}'`,
        requiredPermission,
        authzCtx
      );
    }

    return await handler(subject, ...args);
  };
}

