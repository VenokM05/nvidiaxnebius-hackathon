import { runReview, saveReview } from "@/lib/review";
import type { ReviewRequest } from "@/lib/types";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ReviewRequest;
    const result = await runReview(body);
    saveReview(result);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Review failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
