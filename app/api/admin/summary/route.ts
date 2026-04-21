import { count } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { booking, hall, user } from "@/db/schema";
import { getAuthzErrorResponse, requireRole } from "@/lib/rbac";

export async function GET() {
  try {
    await requireRole("admin");
  } catch (error) {
    const authError = getAuthzErrorResponse(error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [usersCount, hallsCount, bookingsCount] = await Promise.all([
    db.select({ value: count(user.id) }).from(user),
    db.select({ value: count(hall.id) }).from(hall),
    db.select({ value: count(booking.id) }).from(booking),
  ]);

  return NextResponse.json({
    users: Number(usersCount[0]?.value ?? 0),
    halls: Number(hallsCount[0]?.value ?? 0),
    bookings: Number(bookingsCount[0]?.value ?? 0),
  });
}
