import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { messageId, feedback } = await req.json();

    if (!messageId || !feedback) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // TODO: Store feedback in database for analytics
    // For now, just log it
    console.log(`Feedback received for message ${messageId}: ${feedback}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Feedback error:", error);
    return NextResponse.json({ error: "Failed to process feedback" }, { status: 500 });
  }
}
