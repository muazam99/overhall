import { NextResponse } from "next/server";
import { searchHallsPage } from "@/features/halls/server/search-halls";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const data = await searchHallsPage({
      activity: searchParams.get("activity") ?? "",
      location: searchParams.get("location") ?? "",
      whenDate: searchParams.get("whenDate") ?? "",
      cursor: searchParams.get("cursor") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to search halls.",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 },
    );
  }
}
