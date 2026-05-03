import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { errorResult, getBody, ok } from "../../lib/lambda";
import { parseAndSearch } from "../../services/search";

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    const result = await parseAndSearch(getBody(event));
    return ok(result);
  } catch (err) {
    return errorResult(err);
  }
};
