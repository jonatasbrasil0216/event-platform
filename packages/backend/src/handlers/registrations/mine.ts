import { myRegistrationsQuerySchema } from "@event-platform/shared";
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { requireAuth, requireRole } from "../../lib/auth";
import { errorResult, ok, parseQuery } from "../../lib/lambda";
import { listMyRegistrations } from "../../services/registrations";

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    const auth = requireAuth(event);
    requireRole(auth, "attendee");
    const query = parseQuery(myRegistrationsQuerySchema, event);
    const result = await listMyRegistrations(auth.userId.toString(), query);
    return ok(result);
  } catch (err) {
    return errorResult(err);
  }
};
