export class AuthzError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(message: string, statusCode = 403, code = "AUTHZ_FORBIDDEN") {
    super(message);
    this.name = "AuthzError";
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class UnauthorizedError extends AuthzError {
  constructor(message = "Authentication required") {
    super(message, 401, "UNAUTHORIZED");
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AuthzError {
  public readonly requiredPermission?: string;
  public readonly context?: Record<string, unknown>;

  constructor(
    message = "You do not have permission to perform this action",
    requiredPermission?: string,
    context?: Record<string, unknown>
  ) {
    super(message, 403, "FORBIDDEN");
    this.name = "ForbiddenError";
    this.requiredPermission = requiredPermission;
    this.context = context;
  }
}

