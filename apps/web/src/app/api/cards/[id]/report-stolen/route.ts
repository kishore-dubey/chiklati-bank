import { NextResponse, type NextRequest } from "next/server";
import type { CardResponse } from "@chiklati/shared";
import { callInternalApi } from "@/lib/internal-api";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  const idempotencyKey = request.headers.get("idempotency-key") ?? undefined;

  try {
    const result = await callInternalApi<CardResponse>(`/cards/${id}/report-stolen`, {
      method: "POST",
      idempotencyKey,
    });
    return NextResponse.json(result.body, { status: result.status });
  } catch {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
}
