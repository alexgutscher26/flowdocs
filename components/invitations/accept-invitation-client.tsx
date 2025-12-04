"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { acceptInvitation } from "@/app/actions/workspace-invitations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle, Mail } from "lucide-react";

interface AcceptInvitationClientProps {
  token: string;
  userEmail: string;
}

type InvitationState = "loading" | "success" | "error";

/**
 * Accepts an invitation for a user to join a workspace.
 *
 * The function manages the invitation acceptance process by handling the loading, success, and error states.
 * It utilizes the `acceptInvitation` function to process the invitation and updates the UI accordingly.
 * If the invitation is accepted successfully, it redirects the user to the dashboard after a brief delay.
 * It also handles specific error cases, including when the user is already a member of the workspace.
 *
 * @param {Object} props - The properties for accepting the invitation.
 * @param {string} props.token - The invitation token.
 * @param {string} props.userEmail - The email of the user accepting the invitation.
 */
export function AcceptInvitationClient({ token, userEmail }: AcceptInvitationClientProps) {
  const [state, setState] = useState<InvitationState>("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [workspaceId, setWorkspaceId] = useState<string>("");
  const router = useRouter();

  const hasCalledRef = useRef(false);

  useEffect(() => {
    if (hasCalledRef.current) return;
    hasCalledRef.current = true;

    /**
     * Handles the acceptance of an invitation to a workspace.
     *
     * This asynchronous function attempts to accept an invitation using the `acceptInvitation` function with a provided token.
     * If successful, it updates the state to "success", sets the workspace ID, and displays a success message.
     * It then redirects the user to the dashboard after a 2-second delay.
     * If the invitation acceptance fails due to the user already being a member, it treats this as a success and redirects accordingly.
     * Any other errors will update the state to "error" and display the relevant error message.
     */
    async function handleAcceptInvitation() {
      try {
        const result = await acceptInvitation({ token });

        if (result.success && result.data) {
          setState("success");
          setWorkspaceId(result.data.workspaceId);
          toast.success("Invitation accepted successfully!");

          // Redirect to dashboard after 2 seconds with hard navigation
          // This ensures Better-auth session is refreshed and workspace membership is loaded
          setTimeout(() => {
            window.location.href = "/dashboard";
          }, 2000);
        } else {
          // If the error is "You are already a member...", we should treat it as success
          // because it likely means a race condition or previous success
          if (result.error === "You are already a member of this workspace") {
            setState("success");
            // We don't have the workspace ID in the error case, but we can redirect to dashboard
            toast.success("You are already a member of this workspace");
            setTimeout(() => {
              window.location.href = "/dashboard";
            }, 2000);
          } else {
            setState("error");
            setErrorMessage(result.error || "Failed to accept invitation");
            toast.error(result.error || "Failed to accept invitation");
          }
        }
      } catch (error) {
        setState("error");
        setErrorMessage("An unexpected error occurred");
        toast.error("An unexpected error occurred");
        console.error("Error accepting invitation:", error);
      }
    }

    handleAcceptInvitation();
  }, [token, router]);

  return (
    <div className="flex min-h-screen w-full items-center justify-center py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="bg-primary/10 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
            {state === "loading" && <Loader2 className="text-primary h-6 w-6 animate-spin" />}
            {state === "success" && <CheckCircle2 className="h-6 w-6 text-green-600" />}
            {state === "error" && <XCircle className="h-6 w-6 text-red-600" />}
          </div>
          <CardTitle>
            {state === "loading" && "Accepting Invitation..."}
            {state === "success" && "Invitation Accepted!"}
            {state === "error" && "Unable to Accept Invitation"}
          </CardTitle>
          <CardDescription>
            {state === "loading" && "Please wait while we process your invitation"}
            {state === "success" &&
              "You've successfully joined the workspace! Redirecting to your dashboard..."}
            {state === "error" && errorMessage}
          </CardDescription>
        </CardHeader>

        {state === "error" && (
          <CardContent className="space-y-4">
            <div className="border-muted bg-muted/50 rounded-lg border p-4">
              <div className="flex items-start gap-3">
                <Mail className="text-muted-foreground mt-0.5 h-5 w-5" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">Signed in as:</p>
                  <p className="text-muted-foreground text-sm">{userEmail}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-muted-foreground text-sm">Common reasons for failure:</p>
              <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
                <li>Invitation has expired</li>
                <li>Invitation was sent to a different email address</li>
                <li>You're already a member of this workspace</li>
                <li>Invalid invitation link</li>
              </ul>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => router.push("/dashboard")}
              >
                Go to Dashboard
              </Button>
              <Button
                className="flex-1"
                onClick={() => router.push("/dashboard/settings?section=members")}
              >
                View Settings
              </Button>
            </div>
          </CardContent>
        )}

        {state === "success" && (
          <CardContent>
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
              <p className="text-sm text-green-800 dark:text-green-200">
                You'll be redirected to your dashboard shortly...
              </p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
