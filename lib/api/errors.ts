export type HttpStatusCode = 200 | 201 | 400 | 401 | 403 | 404 | 409 | 422 | 429 | 500;

export class AppError extends Error {
  public readonly statusCode: HttpStatusCode;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: HttpStatusCode = 400,
    code: string = "BAD_REQUEST",
    details?: unknown
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  static badRequest(message: string, details?: unknown) {
    return new AppError(message, 400, "BAD_REQUEST", details);
  }

  static unauthorized(message: string = "Authentication required") {
    return new AppError(message, 401, "UNAUTHORIZED");
  }

  static forbidden(message: string = "You do not have permission to access this resource") {
    return new AppError(message, 403, "FORBIDDEN");
  }

  static notFound(message: string = "Resource not found") {
    return new AppError(message, 404, "NOT_FOUND");
  }

  static conflict(message: string, details?: unknown) {
    return new AppError(message, 409, "CONFLICT", details);
  }

  static unprocessable(message: string, details?: unknown) {
    return new AppError(message, 422, "UNPROCESSABLE_ENTITY", details);
  }

  static tooManyRequests(message: string = "Rate limit exceeded. Please try again later.") {
    return new AppError(message, 429, "TOO_MANY_REQUESTS");
  }

  static internal(message: string = "Internal server error", details?: unknown) {
    return new AppError(message, 500, "INTERNAL_SERVER_ERROR", details);
  }
}
