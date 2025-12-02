import { NextRequest, NextResponse } from "next/server";

/**
 * Handles the POST request to process feedback.
 *
 * This function extracts the messageId and feedback from the request body.
 * It validates the presence of these fields and logs the feedback if valid.
 * In case of missing fields, it returns a 400 status with an error message.
 * If an error occurs during processing, it logs the error and returns a 500 status.
 *
 * @param req - The NextRequest object containing the request data.
 */
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
