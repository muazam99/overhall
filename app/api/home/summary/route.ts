import { NextResponse } from "next/server";
import { getHomeSummary } from "@/features/home/server/get-home-summary";

export async function GET() {
  const data = await getHomeSummary();
  return NextResponse.json(data);
}
