import { and, desc, eq, ilike, isNotNull, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { hall } from "@/db/schema";
import {
  defaultHallsPageSize,
  hallsFilterSchema,
  hallsInitialPayloadSchema,
  hallsMapPointCap,
  hallsSearchRequestSchema,
  hallsSearchResponseSchema,
  type HallsFilter,
  type HallsInitialPayload,
  type HallsSearchResponse,
} from "@/features/halls/schemas/halls-search.schema";

type CursorPayload = {
  updatedAt: string;
  id: string;
  relevance?: number;
};

type SearchPageParams = {
  activity?: string;
  location?: string;
  whenDate?: string;
  cursor?: string;
  limit?: number | string;
};

function normalizeQueryValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function encodeCursor(payload: CursorPayload) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodeCursor(token?: string) {
  if (!token) {
    return null;
  }

  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    return JSON.parse(decoded) as CursorPayload;
  } catch {
    return null;
  }
}

function buildRelevanceExpression(activity: string) {
  const activityPattern = `%${activity}%`;
  return sql<number>`
    CASE
      WHEN ${hall.name} ILIKE ${activityPattern} THEN 2
      WHEN COALESCE(${hall.description}, '') ILIKE ${activityPattern} THEN 1
      ELSE 0
    END
  `;
}

function buildBaseConditions(filters: HallsFilter) {
  const clauses = [eq(hall.status, "published")];
  const activity = filters.activity.trim();
  const location = filters.location.trim();

  if (activity.length > 0) {
    const activityPattern = `%${activity}%`;
    clauses.push(
      or(
        ilike(hall.name, activityPattern),
        sql`COALESCE(${hall.description}, '') ILIKE ${activityPattern}`,
      )!,
    );
  }

  if (location.length > 0) {
    const locationPattern = `%${location}%`;
    clauses.push(or(ilike(hall.city, locationPattern), ilike(hall.state, locationPattern))!);
  }

  return clauses;
}

export function readHallsFiltersFromSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
) {
  return hallsFilterSchema.parse({
    activity: normalizeQueryValue(searchParams.activity),
    location: normalizeQueryValue(searchParams.location),
    whenDate: normalizeQueryValue(searchParams.whenDate),
  });
}

export async function searchHallsPage(params: SearchPageParams): Promise<HallsSearchResponse> {
  const parsed = hallsSearchRequestSchema.parse(params);
  const filters = hallsFilterSchema.parse(parsed);
  const hasActivity = filters.activity.length > 0;
  const relevanceExpression = hasActivity
    ? buildRelevanceExpression(filters.activity)
    : sql<number>`0`;
  const conditions = buildBaseConditions(filters);
  const cursor = decodeCursor(parsed.cursor);

  if (cursor) {
    const cursorDate = new Date(cursor.updatedAt);
    if (Number.isNaN(cursorDate.getTime())) {
      throw new Error("Invalid pagination cursor.");
    }

    if (hasActivity) {
      const cursorRelevance = Number(cursor.relevance ?? 0);
      conditions.push(sql`
        (
          ${relevanceExpression} < ${cursorRelevance}
          OR (
            ${relevanceExpression} = ${cursorRelevance}
            AND ${hall.updatedAt} < ${cursorDate}
          )
          OR (
            ${relevanceExpression} = ${cursorRelevance}
            AND ${hall.updatedAt} = ${cursorDate}
            AND ${hall.id} < ${cursor.id}
          )
        )
      `);
    } else {
      conditions.push(sql`
        (
          ${hall.updatedAt} < ${cursorDate}
          OR (${hall.updatedAt} = ${cursorDate} AND ${hall.id} < ${cursor.id})
        )
      `);
    }
  }

  const rows = await db
    .select({
      id: hall.id,
      slug: hall.slug,
      name: hall.name,
      description: hall.description,
      city: hall.city,
      state: hall.state,
      maxCapacity: hall.maxCapacity,
      basePriceMyr: hall.basePriceMyr,
      coverPhotoUrl: hall.coverPhotoUrl,
      updatedAt: hall.updatedAt,
      relevance: relevanceExpression,
    })
    .from(hall)
    .where(and(...conditions))
    .orderBy(
      ...(hasActivity
        ? [desc(relevanceExpression), desc(hall.updatedAt), desc(hall.id)]
        : [desc(hall.updatedAt), desc(hall.id)]),
    )
    .limit(parsed.limit + 1);

  const hasMore = rows.length > parsed.limit;
  const visibleRows = hasMore ? rows.slice(0, parsed.limit) : rows;
  const lastRow = visibleRows.at(-1);
  const nextCursor =
    hasMore && lastRow
      ? encodeCursor({
          updatedAt: lastRow.updatedAt.toISOString(),
          id: lastRow.id,
          relevance: hasActivity ? Number(lastRow.relevance) : undefined,
        })
      : null;

  return hallsSearchResponseSchema.parse({
    items: visibleRows.map((item) => ({
      id: item.id,
      slug: item.slug,
      name: item.name,
      description: item.description,
      city: item.city,
      state: item.state,
      maxCapacity: item.maxCapacity,
      basePriceMyr: item.basePriceMyr,
      coverPhotoUrl: item.coverPhotoUrl,
      updatedAt: item.updatedAt.toISOString(),
    })),
    nextCursor,
    hasMore,
  });
}

export async function getHallMapPoints(filters: HallsFilter) {
  const rows = await db
    .select({
      id: hall.id,
      slug: hall.slug,
      name: hall.name,
      city: hall.city,
      state: hall.state,
      basePriceMyr: hall.basePriceMyr,
      latitude: hall.latitude,
      longitude: hall.longitude,
    })
    .from(hall)
    .where(
      and(
        ...buildBaseConditions(filters),
        isNotNull(hall.latitude),
        isNotNull(hall.longitude),
      ),
    )
    .orderBy(desc(hall.updatedAt), desc(hall.id))
    .limit(hallsMapPointCap);

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    city: row.city,
    state: row.state,
    basePriceMyr: row.basePriceMyr,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
  }));
}

export async function getInitialHallsPayload(
  searchParams: Record<string, string | string[] | undefined>,
): Promise<HallsInitialPayload> {
  const filters = readHallsFiltersFromSearchParams(searchParams);
  const [list, mapPoints] = await Promise.all([
    searchHallsPage({ ...filters, limit: defaultHallsPageSize }),
    getHallMapPoints(filters),
  ]);

  return hallsInitialPayloadSchema.parse({
    filters,
    list,
    mapPoints,
  });
}
