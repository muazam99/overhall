import { NextResponse } from "next/server";
import { z } from "zod";
import { manageHallSavePayloadSchema } from "@/features/admin/schemas/manage-hall.schema";
import {
  getManageHallEditorPayload,
  ManageHallApiError,
  updateManageHall,
} from "@/features/admin/server/manage-hall";
import { getAuthzErrorResponse, requireRole } from "@/lib/rbac";

const paramsSchema = z.object({
  hallId: z.string().min(1),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ hallId: string }> },
) {
  try {
    await requireRole("admin");
  } catch (error) {
    const authError = getAuthzErrorResponse(error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const params = paramsSchema.safeParse(await context.params);
  if (!params.success) {
    return NextResponse.json({ error: "Invalid hall id." }, { status: 400 });
  }

  const payload = await getManageHallEditorPayload(params.data.hallId);
  if (!payload) {
    return NextResponse.json({ error: "Hall not found." }, { status: 404 });
  }

  return NextResponse.json(payload);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ hallId: string }> },
) {
  try {
    await requireRole("admin");
  } catch (error) {
    const authError = getAuthzErrorResponse(error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const params = paramsSchema.safeParse(await context.params);
  if (!params.success) {
    return NextResponse.json({ error: "Invalid hall id." }, { status: 400 });
  }

  const payload = manageHallSavePayloadSchema.safeParse(await request.json().catch(() => null));
  if (!payload.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: payload.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const result = await updateManageHall(params.data.hallId, payload.data);
    return NextResponse.json({
      ok: true,
      hallId: result.hallId,
      slug: result.slug,
    });
  } catch (error) {
    if (error instanceof ManageHallApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: "Failed to update hall." }, { status: 500 });
  }
}
