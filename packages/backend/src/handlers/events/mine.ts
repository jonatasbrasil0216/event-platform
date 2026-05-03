import { myEventsQuerySchema } from "@event-platform/shared";
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { requireAuth, requireRole } from "../../lib/auth";
import { errorResult, ok, parseQuery } from "../../lib/lambda";
import { listMyEvents } from "../../services/events";

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    const auth = requireAuth(event);
    requireRole(auth, "organizer");
    const query = parseQuery(myEventsQuerySchema, event);
    const result = await listMyEvents(auth.userId.toString(), query);
    return ok(result);
  } catch (err) {
    return errorResult(err);
  }
};
