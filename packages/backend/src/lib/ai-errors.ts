import { APIConnectionTimeoutError, APIError, RateLimitError } from "openai";
import { ZodError } from "zod";

/** Used with `reject(new Error(AI_SEARCH_PARSE_TIMEOUT_REJECT_MESSAGE))` so timeouts classify reliably. */
export const AI_SEARCH_PARSE_TIMEOUT_REJECT_MESSAGE = "__ai_parse_timeout";

export const AI_SEARCH_PARSE_TIMEOUT_MS = 10_000;

export class AiSearchResponseJsonError extends Error {
  constructor(
    readonly rawSnippet: string,
    readonly parseMessage: string,
    readonly causeReason?: unknown
  ) {
    super(parseMessage);
    this.name = "AiSearchResponseJsonError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class AiSearchResponseSchemaError extends Error {
  readonly issues: ReturnType<ZodError["flatten"]>;

  constructor(readonly causeError: ZodError) {
    super("AI response did not match search filter schema");
    this.name = "AiSearchResponseSchemaError";
    this.issues = causeError.flatten();
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export const truncateForLog = (value: string, max = 500) =>
  value.length <= max ? value : `${value.slice(0, max)}…`;

const classifyAiParseFailure = (
  error: unknown
): {
  readonly code: string;
  readonly userWarning: string;
  readonly terminalDetail: Record<string, unknown>;
} => {
  const baseLog = (
    extra: Record<string, unknown>
  ): { code: string; userWarning: string; terminalDetail: Record<string, unknown> } =>
    ({ code: String(extra.code), userWarning: String(extra.userWarning), terminalDetail: extra });

  if (error instanceof Error && error.message === AI_SEARCH_PARSE_TIMEOUT_REJECT_MESSAGE) {
    return baseLog({
      code: "ai_parse_timeout",
      userWarning: "Smart search timed out before finishing. Showing results with simple keyword matching instead.",
      timeoutMs: AI_SEARCH_PARSE_TIMEOUT_MS
    });
  }

  if (error instanceof AiSearchResponseJsonError) {
    return baseLog({
      code: "ai_parse_invalid_json",
      userWarning:
        "Smart search returned unreadable data, so structured filters weren't applied. Results use keyword matching instead.",
      rawSnippet: error.rawSnippet,
      parseMessage: error.parseMessage,
      causeSummary:
        error.causeReason instanceof Error ? truncateForLog(error.causeReason.message, 200) : undefined
    });
  }

  if (error instanceof AiSearchResponseSchemaError) {
    return baseLog({
      code: "ai_parse_schema_mismatch",
      userWarning:
        "Smart search couldn't map your query to filters reliably. Showing results with simple keyword matching instead.",
      zodFlatten: error.issues,
      causeMessage: error.causeError.message
    });
  }

  if (error instanceof RateLimitError) {
    return baseLog({
      code: "ai_parse_openai_rate_limit",
      userWarning:
        "Smart search is briefly rate-limited. Try again in a minute; meanwhile results use keyword matching.",
      status: error.status,
      apiMessage: truncateForLog(error.message, 200)
    });
  }

  if (error instanceof APIConnectionTimeoutError) {
    return baseLog({
      code: "ai_parse_openai_connection_timeout",
      userWarning: "Connecting to smart search timed out. Results use keyword matching instead.",
      apiMessage: truncateForLog(error.message, 200)
    });
  }

  if (error instanceof APIError) {
    const status = error.status;
    const user =
      typeof status === "number" && status >= 500
        ? "The smart search service had a problem on its side. Results use keyword matching for now."
        : typeof status === "number" && (status === 401 || status === 403)
          ? "Smart search isn't available right now. Showing results with keyword matching instead."
          : "Smart search is temporarily unavailable. Showing results with keyword matching instead.";

    return baseLog({
      code: "ai_parse_openai_api_error",
      userWarning: user,
      status,
      errorType: error.constructor?.name,
      apiMessage: truncateForLog(error.message, 200)
    });
  }

  if (error instanceof ZodError) {
    return baseLog({
      code: "ai_parse_zod_unexpected",
      userWarning: "Smart search hit an unexpected validation issue. Results use keyword matching instead.",
      zodFlatten: error.flatten(),
      causeMessage: error.message
    });
  }

  if (error instanceof SyntaxError) {
    return baseLog({
      code: "ai_parse_syntax",
      userWarning:
        "Smart search returned malformed data. Structured filters weren't applied — results use keyword matching.",
      syntaxMessage: error.message
    });
  }

  return baseLog({
    code: "ai_parse_unknown",
    userWarning:
      "Something went wrong with smart search. Your results still use keyword matching from your query text.",
    errorName: error instanceof Error ? error.name : typeof error,
    message: truncateForLog(error instanceof Error ? error.message : String(error), 400),
    stack:
      error instanceof Error && typeof error.stack === "string"
        ? truncateForLog(error.stack, 800)
        : undefined
  });
};

export const logAiSearchParseFailure = (error: unknown, query: string): { userWarning: string } => {
  const { code, userWarning, terminalDetail } = classifyAiParseFailure(error);
  const queryPreview = truncateForLog(query.trim().replace(/\s+/g, " "), 200);

  console.error(
    `[search] AI parse failed code=${code} queryPreview="${queryPreview.replace(/"/g, '\\"')}" detail=${JSON.stringify(terminalDetail)}`
  );

  return { userWarning };
};
