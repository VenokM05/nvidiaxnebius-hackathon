import { getReview } from "@/lib/review";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const review = getReview(id);
  if (!review) {
    return NextResponse.json(
      { error: "Review not found — results live in memory; start a new review." },
      { status: 404 }
    );
  }
  return NextResponse.json(review);
}
