import { NextResponse, type NextRequest } from "next/server";
import { callInternalApi } from "@/lib/internal-api";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;

  try {
    const result = await callInternalApi(`/sandbox/payments/${id}/ach/transmit`, { method: "POST" });
    return NextResponse.json(result.body, { status: result.status });
  } catch {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
}
