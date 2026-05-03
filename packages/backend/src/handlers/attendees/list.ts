import { attendeesQuerySchema } from "@event-platform/shared";
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { requireAuth, requireRole } from "../../lib/auth";
import { errorResult, getPathParam, ok, parseQuery } from "../../lib/lambda";
import { listEventAttendees } from "../../services/registrations";

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    const auth = requireAuth(event);
    requireRole(auth, "organizer");
    const query = parseQuery(attendeesQuerySchema, event);
    const result = await listEventAttendees(getPathParam(event, "id"), auth.userId.toString(), query);
    return ok(result);
  } catch (err) {
    return errorResult(err);
  }
};
