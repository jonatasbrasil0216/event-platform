import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { errorResult, getPathParam, ok } from "../../lib/lambda";
import { getEventById } from "../../services/events";

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    const result = await getEventById(getPathParam(event, "id"));
    return ok(result);
  } catch (err) {
    return errorResult(err);
  }
};
