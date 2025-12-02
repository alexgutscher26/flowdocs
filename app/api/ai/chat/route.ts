import { NextRequest, NextResponse } from "next/server";
import { answerQuestion } from "@/lib/ai/knowledge-base";

/**
 * Handles POST requests to process a query and retrieve an AI-generated answer.
 *
 * The function extracts the query and workspaceId from the request body. It checks for the presence of these fields and, if valid, calls the answerQuestion function to obtain the AI's response. In case of errors, it logs the error details and returns an appropriate JSON response with an error message.
 *
 * @param req - The NextRequest object containing the request data.
 * @returns A JSON response containing the AI's answer and sources, or an error message if the request fails.
 * @throws Error If there is an issue processing the request or if required fields are missing.
 */
export async function POST(req: NextRequest) {
    try {
        const { query, workspaceId } = await req.json();

        if (!query || !workspaceId) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
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
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}
