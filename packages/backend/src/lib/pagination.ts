import { ObjectId } from "mongodb";

type CursorPayload = {
  value: string;
  id: string;
};

export const encodeCursor = (payload: CursorPayload) => Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");

export const decodeCursor = (cursor: string | undefined): CursorPayload | null => {
  if (!cursor) return null;
  try {
    const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as CursorPayload;
    if (!parsed.value || !ObjectId.isValid(parsed.id)) return null;
    return parsed;
  } catch {
    return null;
  }
};

export const dateCursorFilter = (
  field: string,
  cursor: CursorPayload | null,
  direction: 1 | -1
): Record<string, unknown> => {
  if (!cursor) return {};
  const value = new Date(cursor.value);
  const id = new ObjectId(cursor.id);
  const op = direction === 1 ? "$gt" : "$lt";
  return {
    $or: [
      { [field]: { [op]: value } },
      { [field]: value, _id: { [op]: id } }
    ]
  };
};

export const pageInfoFromDocs = <T extends { _id: ObjectId }>(
  docs: T[],
  limit: number,
  valueSelector: (doc: T) => Date
) => {
  const pageDocs = docs.slice(0, limit);
  const last = pageDocs[pageDocs.length - 1];
  return {
    data: pageDocs,
    pageInfo: {
      hasNextPage: docs.length > limit,
      nextCursor: last ? encodeCursor({ value: valueSelector(last).toISOString(), id: last._id.toString() }) : null
    }
  };
};
