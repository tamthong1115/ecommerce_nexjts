import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ResponseFactory } from "@/lib/api-response";
import { loadSubject } from "./load";
import { can } from "./policy";
import type { AuthzContext, AuthzSubject } from "./types";

export interface PermissionRouteOptions {
  shopIdParam?: string;
  getContext?: (req: NextRequest, params: Record<string, string | string[] | undefined>) => Promise<AuthzContext> | AuthzContext;
}

export type AuthorizedRouteHandler = (
  req: NextRequest,
  context: {
    params: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;
    subject: AuthzSubject;
  }
) => Promise<Response | NextResponse> | Response | NextResponse;

export function withPermission(
  requiredPermission: string,
  options?: PermissionRouteOptions
) {
  return function (handler: AuthorizedRouteHandler) {
    return async function (
      req: NextRequest,
      routeContext: {
        params?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;
      }
    ) {
      try {
        const session = await auth.api.getSession({
          headers: await headers(),
        });

        if (!session?.user?.id) {
          return ResponseFactory.toNextResponse(
            ResponseFactory.error({
              message: "Authentication required",
              code: 401,
            })
          );
        }

        const subject = await loadSubject(session.user.id);
        if (!subject) {
          return ResponseFactory.toNextResponse(
            ResponseFactory.error({
              message: "Subject could not be resolved",
              code: 401,
            })
          );
        }

        let resolvedParams: Record<string, string | string[] | undefined> = {};
        if (routeContext?.params) {
          resolvedParams = await Promise.resolve(routeContext.params);
        }

        let authzCtx: AuthzContext = {};
        if (options?.getContext) {
          authzCtx = await options.getContext(req, resolvedParams);
        } else {
          const shopParamKey = options?.shopIdParam || "shopId";
          const paramShopId = resolvedParams[shopParamKey];
          if (typeof paramShopId === "string") {
            authzCtx.targetShopId = paramShopId;
          }
        }

        const allowed = can(subject, requiredPermission, authzCtx);
        if (!allowed) {
          return ResponseFactory.toNextResponse(
            ResponseFactory.error({
              message: `Forbidden: requires permission '${requiredPermission}'`,
              code: 403,
            })
          );
        }

        return await handler(req, {
          params: resolvedParams,
          subject,
        });
      } catch (error) {
        return ResponseFactory.toNextResponse(ResponseFactory.handleError(error));
      }
    };
  };
}

