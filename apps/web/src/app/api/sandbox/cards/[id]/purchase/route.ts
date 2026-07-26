import { NextResponse, type NextRequest } from "next/server";
import { callInternalApi } from "@/lib/internal-api";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  const body = await request.text();

  try {
    const result = await callInternalApi(`/sandbox/cards/${id}/purchase`, { method: "POST", body });
    return NextResponse.json(result.body, { status: result.status });
  } catch {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
}
