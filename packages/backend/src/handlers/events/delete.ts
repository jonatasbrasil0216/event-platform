import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { requireAuth, requireRole } from "../../lib/auth";
import { errorResult, getPathParam, noContent } from "../../lib/lambda";
import { deleteEvent } from "../../services/events";

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    const auth = requireAuth(event);
    requireRole(auth, "organizer");
    await deleteEvent(getPathParam(event, "id"), auth.userId.toString());
    return noContent();
  } catch (err) {
    return errorResult(err);
  }
};
