import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { requireAuth, requireRole } from "../../lib/auth";
import { errorResult, getBody, getPathParam, ok } from "../../lib/lambda";
import { updateEvent } from "../../services/events";

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    const auth = requireAuth(event);
    requireRole(auth, "organizer");
    const result = await updateEvent(getPathParam(event, "id"), auth.userId.toString(), getBody(event));
    return ok(result);
  } catch (err) {
    return errorResult(err);
  }
};
