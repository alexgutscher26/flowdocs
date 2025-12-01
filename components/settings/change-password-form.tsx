"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { changePassword, type ChangePasswordInput } from "@/app/actions/account-security";
import { z } from "zod";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

/**
 * Renders a form for changing the user's password.
 *
 * This component manages the state of the password change process, including loading states and form validation.
 * It utilizes the `useForm` hook with a Zod resolver for schema validation. Upon submission, it calls the `changePassword` function
 * and handles success or error responses, providing user feedback through toast notifications. The form includes fields for
 * the current password, new password, and confirmation of the new password.
 */
export function ChangePasswordForm() {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  /**
   * Handles the submission of a password change request.
   *
   * This asynchronous function sets a loading state, attempts to change the password using the provided data,
   * and displays success or error messages based on the result. It also ensures that the loading state is reset
   * after the operation completes, regardless of success or failure.
   *
   * @param data - The input data required to change the password.
   */
  async function onSubmit(data: ChangePasswordInput) {
    setIsLoading(true);
    try {
      const result = await changePassword(data);

      if (result.success) {
        toast.success("Password changed successfully");
        form.reset();
      } else {
        toast.error(result.error || "Failed to change password");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error("Error changing password:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
        <CardDescription>Update your password to keep your account secure</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            {/* Current Password Field */}
            <Field>
              <FieldLabel htmlFor="current-password">Current Password</FieldLabel>
              <Input
                id="current-password"
                type="password"
                placeholder="Enter your current password"
                disabled={isLoading}
                {...form.register("currentPassword")}
              />
              <FieldError errors={[form.formState.errors.currentPassword]} />
            </Field>

            {/* New Password Field */}
            <Field>
              <FieldLabel htmlFor="new-password">New Password</FieldLabel>
              <Input
                id="new-password"
                type="password"
                placeholder="Enter your new password"
                disabled={isLoading}
                {...form.register("newPassword")}
              />
              <FieldDescription>Password must be at least 8 characters long</FieldDescription>
              <FieldError errors={[form.formState.errors.newPassword]} />
            </Field>

            {/* Confirm Password Field */}
            <Field>
              <FieldLabel htmlFor="confirm-password">Confirm New Password</FieldLabel>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Confirm your new password"
                disabled={isLoading}
                {...form.register("confirmPassword")}
              />
              <FieldError errors={[form.formState.errors.confirmPassword]} />
            </Field>

            {/* Submit Button */}
            <Field orientation="horizontal">
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Change Password
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
