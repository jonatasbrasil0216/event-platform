import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { login } from "../../services/auth";
import { errorResult, getBody, ok } from "../../lib/lambda";

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    const result = await login(getBody(event));
    return ok(result);
  } catch (err) {
    return errorResult(err);
  }
};
