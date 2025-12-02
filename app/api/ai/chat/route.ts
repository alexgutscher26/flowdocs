import { NextRequest, NextResponse } from "next/server";
import { answerQuestion } from "@/lib/ai/knowledge-base";

export async function POST(req: NextRequest) {
  try {
    const { query, workspaceId } = await req.json();

    if (!query || !workspaceId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get AI answer using the knowledge base
    const { answer, sources } = await answerQuestion(query, workspaceId);

    return NextResponse.json({
      answer,
      sources,
    });
  } catch (error) {
    console.error("AI chat error:", error);

    // Log more details
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    return NextResponse.json(
      {
        error: "Failed to process request",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
