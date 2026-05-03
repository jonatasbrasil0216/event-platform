import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { signup } from "../../services/auth";
import { errorResult, getBody, ok } from "../../lib/lambda";

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    const result = await signup(getBody(event));
    return ok(result, 201);
  } catch (err) {
    return errorResult(err);
  }
};
