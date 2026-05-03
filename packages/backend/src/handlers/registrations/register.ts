import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { requireAuth, requireRole } from "../../lib/auth";
import { errorResult, getPathParam, ok } from "../../lib/lambda";
import { registerForEvent } from "../../services/registrations";

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    const auth = requireAuth(event);
    requireRole(auth, "attendee");
    const result = await registerForEvent(getPathParam(event, "id"), auth.userId.toString());
    return ok(result);
  } catch (err) {
    return errorResult(err);
  }
};
