import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { requireAuth, requireRole } from "../../lib/auth";
import { errorResult, getPathParam, ok } from "../../lib/lambda";
import { makeEventDraft } from "../../services/events";

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    const auth = requireAuth(event);
    requireRole(auth, "organizer");
    const result = await makeEventDraft(getPathParam(event, "id"), auth.userId.toString());
    return ok(result);
  } catch (err) {
    return errorResult(err);
  }
};
