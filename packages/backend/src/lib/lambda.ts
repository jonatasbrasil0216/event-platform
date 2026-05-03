import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import type { z } from "zod";
import { AppError, validationError } from "./errors";

export type LambdaEvent = APIGatewayProxyEventV2;
export type LambdaResult = APIGatewayProxyResultV2;

const JSON_HEADERS = { "Content-Type": "application/json" };

export function getBody(event: LambdaEvent): unknown {
  if (!event.body) return {};
  const raw = event.isBase64Encoded ? Buffer.from(event.body, "base64").toString("utf8") : event.body;
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function getPathParam(event: LambdaEvent, name: string): string {
  return event.pathParameters?.[name] ?? "";
}

export function parseQuery<T extends z.ZodTypeAny>(schema: T, event: LambdaEvent): z.infer<T> {
  const parsed = schema.safeParse(event.queryStringParameters ?? {});
  if (!parsed.success) {
    throw validationError("Invalid query parameters", parsed.error.flatten());
  }
  return parsed.data;
}

export function ok(body: unknown, status = 200): LambdaResult {
  return { statusCode: status, headers: JSON_HEADERS, body: JSON.stringify(body) };
}

export function noContent(): LambdaResult {
  return { statusCode: 204, body: "" };
}

export function errorResult(error: unknown): LambdaResult {
  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      headers: JSON_HEADERS,
      body: JSON.stringify({ error: { code: error.code, message: error.message, details: error.details } })
    };
  }
  console.error("[LAMBDA ERROR]", error);
  return {
    statusCode: 500,
    headers: JSON_HEADERS,
    body: JSON.stringify({ error: { code: "INTERNAL", message: "Internal server error" } })
  };
}
