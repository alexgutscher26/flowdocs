"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { IconTrash } from "@tabler/icons-react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteUserAccount } from "@/app/actions/user-settings";
import { signOut } from "@/lib/auth-client";
import { ChangePasswordForm } from "./change-password-form";
import { ConnectedAccounts } from "./connected-accounts";

/**
 * Renders the account management tab, allowing users to change their password and delete their account.
 *
 * This component manages the state for deleting an account and the visibility of a confirmation dialog.
 * It handles the deletion process by calling `deleteUserAccount`, providing feedback through toast notifications,
 * and redirects the user to the home page upon successful deletion. The component also includes forms for changing
 * passwords and managing connected accounts.
 */
export function AccountTab() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();

  async function handleDeleteAccount() {
    setIsDeleting(true);
    try {
      const result = await deleteUserAccount();

      if (result.success) {
        toast.success("Account deleted successfully");

        // Sign out and redirect to home page
        await signOut({
          fetchOptions: {
            onSuccess: () => {
              window.location.href = "/";
            },
          },
        });
      } else {
        toast.error(result.error || "Failed to delete account");
        setIsDeleting(false);
        setIsDialogOpen(false);
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error("Error deleting account:", error);
      setIsDeleting(false);
      setIsDialogOpen(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Security Section */}
      <ChangePasswordForm />
      <ConnectedAccounts />

      {/* Danger Zone */}
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions that will affect your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-base font-semibold">Delete Account</h3>
            <p className="text-muted-foreground mt-1 text-sm">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
          </div>

          <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeleting}>
                <IconTrash className="mr-2 h-4 w-4" />
                Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription className="space-y-2">
                  <p>
                    This action cannot be undone. This will permanently delete your account and remove
                    all your data from our servers.
                  </p>
                  <p className="text-destructive font-semibold">
                    All of your workspaces and data will be lost.
                  </p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault();
                    handleDeleteAccount();
                  }}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Delete Account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
