"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UploadButton } from "@/components/uploadthing";
import { updateUserProfile } from "@/app/actions/user-settings";
import { updateProfileSchema, type UpdateProfileInput } from "@/lib/validations/user-settings";

interface ProfileTabProps {
  user: {
    name: string | null;
    email: string;
    phone: string | null;
    image: string | null;
  };
}

export function ProfileTab({ user }: ProfileTabProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: user.name || "",
      phone: user.phone || "",
      image: user.image || "",
    },
  });

  async function onSubmit(data: UpdateProfileInput) {
    setIsLoading(true);
    try {
      const result = await updateUserProfile(data);

      if (result.success) {
        toast.success("Profile updated successfully");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to update profile");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error("Error updating profile:", error);
    } finally {
      setIsLoading(false);
    }
  }

  // Get initials for avatar fallback
  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email[0].toUpperCase();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
        <CardDescription>Update your personal information and profile details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar Display */}
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage
              src={form.watch("image") || user.image || undefined}
              alt={user.name || "User"}
            />
            <AvatarFallback className="text-lg">
              {getInitials(user.name, user.email)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-2">
            <div>
              <p className="text-sm font-medium">Profile Picture</p>
              <p className="text-muted-foreground text-sm">
                Upload a new profile picture or use the default one.
              </p>
            </div>
            <UploadButton
              endpoint="userProfileUploader"
              onClientUploadComplete={(res) => {
                if (res?.[0]) {
                  form.setValue("image", res[0].url);
                  toast.success("Profile picture uploaded successfully");
                }
              }}
              onUploadError={(error: Error) => {
                toast.error(`Error uploading profile picture: ${error.message}`);
              }}
            />
          </div>
        </div>

        {/* Profile Form */}
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            {/* Name Field */}
            <Field>
              <FieldLabel htmlFor="profile-name">Name</FieldLabel>
              <Input
                id="profile-name"
                placeholder="Enter your name"
                disabled={isLoading}
                {...form.register("name")}
              />
              <FieldDescription>
                This is your public display name. It can be your real name or a pseudonym.
              </FieldDescription>
              <FieldError errors={[form.formState.errors.name]} />
            </Field>

            {/* Email Field (Read-only) */}
            <Field>
              <FieldLabel htmlFor="profile-email">Email</FieldLabel>
              <Input id="profile-email" value={user.email} disabled className="bg-muted" />
              <FieldDescription>Your email address cannot be changed.</FieldDescription>
            </Field>

            {/* Phone Field */}
            <Field>
              <FieldLabel htmlFor="profile-phone">Phone</FieldLabel>
              <Input
                id="profile-phone"
                placeholder="Enter your phone number"
                disabled={isLoading}
                {...form.register("phone")}
              />
              <FieldDescription>
                Your phone number for contact purposes (optional).
              </FieldDescription>
              <FieldError errors={[form.formState.errors.phone]} />
            </Field>

            {/* Submit Button */}
            <Field orientation="horizontal">
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
