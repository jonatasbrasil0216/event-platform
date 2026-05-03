import { publishedEventsQuerySchema } from "@event-platform/shared";
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { errorResult, ok, parseQuery } from "../../lib/lambda";
import { listPublishedEvents } from "../../services/events";

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    const query = parseQuery(publishedEventsQuerySchema, event);
    const result = await listPublishedEvents(query);
    return ok(result);
  } catch (err) {
    return errorResult(err);
  }
};
