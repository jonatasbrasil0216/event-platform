import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { requireAuth, requireRole } from "../../lib/auth";
import { errorResult, getBody, ok } from "../../lib/lambda";
import { createEvent } from "../../services/events";

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    const auth = requireAuth(event);
    requireRole(auth, "organizer");
    const result = await createEvent(auth.userId.toString(), getBody(event));
    return ok(result, 201);
  } catch (err) {
    return errorResult(err);
  }
};
