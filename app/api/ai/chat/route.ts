import { NextRequest, NextResponse } from "next/server";
import { answerQuestion } from "@/lib/ai/knowledge-base";

/**
 * Handles POST requests to process a query and retrieve an AI-generated answer.
 *
 * The function extracts the query and workspaceId from the request body. It checks for the presence of these fields and returns a 400 error if they are missing. If valid, it calls the answerQuestion function to get the AI answer and sources, which are then returned in the response. In case of an error, it logs the error details and returns a 500 error response with the error message.
 *
 * @param req - The NextRequest object containing the request data.
 * @returns A JSON response containing the AI answer and sources or an error message.
 * @throws Error If an error occurs during processing.
 */
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
