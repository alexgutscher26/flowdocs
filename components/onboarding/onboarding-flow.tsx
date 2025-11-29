"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { completeOnboarding } from "@/app/actions/onboarding";
import { inviteMember } from "@/app/actions/workspace-invitations";
import { toast } from "sonner";
import { IconInnerShadowTop, IconFolder, IconCheck, IconRocket, IconMail, IconX } from "@tabler/icons-react";
import Link from "next/link";
import Image from "next/image";
import confetti from "canvas-confetti";
import { siteConfig } from "@/lib/config";

interface OnboardingFlowProps {
  userName: string | null;
  userEmail: string;
}

const roles = [
  { value: "founder", label: "Founder" },
  { value: "developer", label: "Developer" },
  { value: "designer", label: "Designer" },
  { value: "marketer", label: "Marketer" },
];

const useCases = [
  { value: "b2b-saas", label: "B2B SaaS Product" },
  { value: "b2c-saas", label: "B2C SaaS Product" },
  { value: "marketplace", label: "Marketplace/Platform" },
  { value: "productivity", label: "Productivity Tool" },
  { value: "ai-app", label: "AI Application" },
  { value: "other", label: "Other" },
];

const discoverySources = [
  { value: "google", label: "Google Search" },
  { value: "twitter", label: "Twitter/X" },
  { value: "friend", label: "Friend Referral" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "youtube", label: "YouTube" },
  { value: "other", label: "Other" },
];

/**
 * Manages the onboarding flow for new users, guiding them through multiple steps to create a workspace and invite teammates.
 *
 * The function initializes state variables for user input and manages the current step of the onboarding process. It includes methods for generating slugs, handling workspace creation, sending invitations, and updating email fields. The onboarding flow consists of five steps, with user feedback provided through toast notifications and error handling. Additionally, it triggers a confetti animation upon successful completion of the onboarding process.
 *
 * @param {Object} props - The properties for the onboarding flow.
 * @param {string} props.userName - The name of the user.
 * @param {string} props.userEmail - The email of the user.
 * @returns {JSX.Element} The rendered onboarding flow component.
 */
export function OnboardingFlow({ userName, userEmail }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [firstName, setFirstName] = useState(userName || "");
  const [role, setRole] = useState("");
  const [useCase, setUseCase] = useState("");
  const [discoverySource, setDiscoverySource] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [isBusinessNameCustomized, setIsBusinessNameCustomized] = useState(false);
  const [businessPhone, setBusinessPhone] = useState("");
  const [createdWorkspaceId, setCreatedWorkspaceId] = useState("");
  const [inviteEmails, setInviteEmails] = useState([""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]/g, "-");
  };

  /**
   * Handles the creation of a workspace by completing the onboarding process.
   *
   * This function sets the loading state and clears any previous errors. It then attempts to call the completeOnboarding function with the necessary parameters. If successful, it updates the workspace ID and advances the current step, displaying a success message. In case of an error, it captures the error message and displays an error notification. Finally, it resets the loading state.
   *
   * @param role - The role of the user creating the workspace.
   * @param useCase - The use case for the workspace.
   * @param discoverySource - The source from which the workspace is discovered.
   * @param workspaceName - The name of the workspace to be created.
   * @param firstName - The first name of the user creating the workspace.
   * @param businessName - The business name associated with the workspace.
   * @param businessPhone - The business phone number associated with the workspace.
   * @returns Promise<void>
   */
  const handleWorkspaceCreation = async () => {
    setIsLoading(true);
    setError("");

    try {
      const result = await completeOnboarding({
        role,
        useCase,
        discoverySource,
        workspaceName: workspaceName.trim(),
        firstName: firstName.trim(),
        businessName: businessName.trim() || workspaceName.trim(),
        businessPhone: businessPhone.trim() || undefined,
      });

      if (result.success) {
        setCreatedWorkspaceId(result.workspace.id);
        setCurrentStep(4);
        toast.success("Workspace created successfully!");
      }
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to create workspace. Please try again.");
      toast.error((err as Error).message || "Failed to create workspace");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles the process of sending invitations to members.
   *
   * This function filters out empty email addresses from the inviteEmails array, sends invitations using the inviteMember function, and manages the loading state and error handling. It also provides feedback on the success or failure of the invitations sent. Finally, it updates the current step to indicate progress in the invitation process.
   *
   * @param inviteEmails - An array of email addresses to which invitations will be sent.
   * @param createdWorkspaceId - The ID of the workspace where members are being invited.
   * @param setIsLoading - A function to set the loading state.
   * @param setError - A function to set error messages.
   * @param setCurrentStep - A function to update the current step in the invitation process.
   * @returns A promise that resolves when the invitations have been processed.
   * @throws Error If an error occurs during the invitation process.
   */
  const handleInvitations = async () => {
    setIsLoading(true);
    setError("");

    try {
      // Filter out empty emails
      const validEmails = inviteEmails.filter((email) => email.trim() !== "");

      // Send invitations
      if (validEmails.length > 0) {
        const invitePromises = validEmails.map((email) =>
          inviteMember({
            workspaceId: createdWorkspaceId,
            email: email.trim(),
            role: "MEMBER",
          })
        );

        const results = await Promise.allSettled(invitePromises);
        const successCount = results.filter((r) => r.status === "fulfilled" && r.value.success).length;
        const failureCount = results.length - successCount;

        if (successCount > 0) {
          toast.success(`${successCount} invitation${successCount > 1 ? "s" : ""} sent successfully!`);
        }
        if (failureCount > 0) {
          toast.error(`${failureCount} invitation${failureCount > 1 ? "s" : ""} failed to send`);
        }
      }

      // Move to success step
      setCurrentStep(5);
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to send invitations");
      toast.error((err as Error).message || "Failed to send invitations");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Adds an empty email field to the inviteEmails array.
   */
  const addEmailField = () => {
    setInviteEmails([...inviteEmails, ""]);
  };

  /**
   * Removes an email from the inviteEmails array at the specified index.
   */
  const removeEmailField = (index: number) => {
    const newEmails = inviteEmails.filter((_, i) => i !== index);
    setInviteEmails(newEmails.length > 0 ? newEmails : [""]);
  };

  /**
   * Updates the email field at the specified index with a new value.
   */
  const updateEmailField = (index: number, value: string) => {
    const newEmails = [...inviteEmails];
    newEmails[index] = value;
    setInviteEmails(newEmails);
  };

  // Trigger confetti on completion step
  useEffect(() => {
    if (currentStep === 5) {
      const duration = 5 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval = window.setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [currentStep]);

  const slug = workspaceName ? generateSlug(workspaceName) : "";

  return (
    <div className="relative container h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      {/* Left Side - Branding */}
      <div className="bg-muted relative hidden h-full flex-col p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0 bg-zinc-900" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <IconInnerShadowTop className="mr-2 h-6 w-6" />
          {siteConfig.name}
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              &ldquo;Transform any website with AI. Build stunning, modern websites in minutes, not
              weeks.&rdquo;
            </p>
            <footer className="text-sm">{siteConfig.name}</footer>
          </blockquote>
        </div>
      </div>

      {/* Right Side - Onboarding Content */}
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[450px]">
          {/* Step 1: Introduction & Role Selection */}
          {currentStep === 1 && (
            <>
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <Image
                    src="https://pbs.twimg.com/profile_images/1706595242009387008/_mNR89Xa_400x400.jpg"
                    alt="Codehagen"
                    width={96}
                    height={96}
                    className="border-primary/20 rounded-full border-4 shadow-lg"
                    priority
                  />
                </div>
                <div className="flex flex-col space-y-2 text-center">
                  <h1 className="text-2xl font-semibold tracking-tight">Nice to meet you! ✌️</h1>
                  <p className="text-muted-foreground text-sm">
                    I&apos;m {siteConfig.name}, the founder of {siteConfig.name}
                    . <br /> To start, why don&apos;t you introduce yourself :)
                  </p>
                </div>
              </div>

              <div className="grid gap-6">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="firstName">First name *</Label>
                    <Input
                      id="firstName"
                      placeholder="Your name"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>

                  <div className="grid gap-3">
                    <Label>What best describes you? *</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {roles.map((roleOption) => (
                        <button
                          key={roleOption.value}
                          onClick={() => setRole(roleOption.value)}
                          type="button"
                          className={`rounded-lg border-2 p-4 text-left transition-all ${role === roleOption.value
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                            }`}
                        >
                          <span className="font-medium">{roleOption.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={() => setCurrentStep(2)}
                    disabled={!firstName.trim() || !role}
                    className="w-full"
                    size="lg"
                  >
                    Continue
                  </Button>
                </div>
              </div>

              <p className="text-muted-foreground px-8 text-center text-sm">
                Need help? Message us{" "}
                <a
                  href="https://x.com/codehagen"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary underline underline-offset-4"
                >
                  x.com/codehagen
                </a>
              </p>
            </>
          )}

          {/* Step 2: Use Case & Discovery */}
          {currentStep === 2 && (
            <>
              <div className="flex flex-col space-y-2 text-center">
                <h1 className="text-2xl font-semibold tracking-tight">
                  Tell us about your project
                </h1>
                <p className="text-muted-foreground text-sm">
                  Help us understand what you're building with {siteConfig.name}
                </p>
              </div>

              <div className="grid gap-6">
                <div className="grid gap-4">
                  <div className="grid gap-3">
                    <Label>What type of SaaS are you building? *</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {useCases.map((useCaseOption) => (
                        <button
                          key={useCaseOption.value}
                          onClick={() => setUseCase(useCaseOption.value)}
                          type="button"
                          className={`rounded-lg border-2 p-4 text-left transition-all ${useCase === useCaseOption.value
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                            }`}
                        >
                          <span className="text-sm font-medium">{useCaseOption.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-3">
                    <Label>How did you hear about us? *</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {discoverySources.map((source) => (
                        <button
                          key={source.value}
                          onClick={() => setDiscoverySource(source.value)}
                          type="button"
                          className={`rounded-lg border-2 p-4 text-left transition-all ${discoverySource === source.value
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                            }`}
                        >
                          <span className="text-sm font-medium">{source.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setCurrentStep(1)} className="flex-1">
                      Back
                    </Button>
                    <Button
                      onClick={() => setCurrentStep(3)}
                      disabled={!useCase || !discoverySource}
                      className="flex-1"
                    >
                      Continue
                    </Button>
                  </div>
                </div>
              </div>

              <p className="text-muted-foreground px-8 text-center text-sm">
                Need help? Message us{" "}
                <a
                  href={siteConfig.links.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary underline underline-offset-4"
                >
                  {siteConfig.links.twitter.replace("https://", "")}
                </a>
              </p>
            </>
          )}

          {/* Step 3: Workspace Creation */}
          {currentStep === 3 && (
            <>
              <div className="flex flex-col space-y-2 text-center">
                <h1 className="text-2xl font-semibold tracking-tight">Create your workspace</h1>
                <p className="text-muted-foreground text-sm">
                  A workspace is where you&apos;ll organize your projects and collaborate with
                  others
                </p>
              </div>

              <div className="grid gap-6">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="workspaceName">Workspace Name *</Label>
                    <div className="relative">
                      <IconFolder className="text-muted-foreground absolute top-3 left-3 h-5 w-5" />
                      <Input
                        id="workspaceName"
                        value={workspaceName}
                        onChange={(e) => {
                          const newName = e.target.value;
                          setWorkspaceName(newName);
                          // Sync business name if not customized
                          if (!isBusinessNameCustomized) {
                            setBusinessName(newName);
                          }
                        }}
                        placeholder="My Awesome Workspace"
                        className="pl-10"
                        disabled={isLoading}
                      />
                    </div>
                    {slug && (
                      <p className="text-muted-foreground text-sm">
                        Workspace URL:{" "}
                        <code className="bg-secondary rounded px-1 py-0.5 text-xs">{slug}</code>
                      </p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="businessName">Company Name (Optional)</Label>
                    <Input
                      id="businessName"
                      value={businessName}
                      onChange={(e) => {
                        setBusinessName(e.target.value);
                        setIsBusinessNameCustomized(true);
                      }}
                      placeholder="Acme Inc."
                      disabled={isLoading}
                    />
                    <p className="text-muted-foreground text-xs">
                      Your company or organization name
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="businessPhone">Phone Number (Optional)</Label>
                    <Input
                      id="businessPhone"
                      type="tel"
                      value={businessPhone}
                      onChange={(e) => setBusinessPhone(e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      disabled={isLoading}
                    />
                    <p className="text-muted-foreground text-xs">
                      Your contact number • Email: {userEmail}
                    </p>
                  </div>

                  {error && <p className="text-destructive text-sm">{error}</p>}

                  <div className="bg-secondary/50 space-y-2 rounded-lg p-4">
                    <h4 className="text-sm font-medium">What&apos;s a workspace?</h4>
                    <ul className="text-muted-foreground space-y-1 text-sm">
                      <li>• Your central hub for managing projects</li>
                      <li>• Invite team members and collaborate</li>
                      <li>• Create multiple workspaces for different teams</li>
                    </ul>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep(2)}
                      disabled={isLoading}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleWorkspaceCreation}
                      disabled={!workspaceName.trim() || isLoading}
                      className="flex-1"
                    >
                      {isLoading ? "Creating..." : "Create Workspace"}
                    </Button>
                  </div>
                </div>
              </div>

              <p className="text-muted-foreground px-8 text-center text-sm">
                Need help? Message us{" "}
                <a
                  href={siteConfig.links.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary underline underline-offset-4"
                >
                  {siteConfig.links.twitter.replace("https://", "")}
                </a>
              </p>
            </>
          )}

          {/* Step 4: Invite Teammates */}
          {currentStep === 4 && (
            <>
              <div className="flex flex-col space-y-2 text-center">
                <h1 className="text-2xl font-semibold tracking-tight">Invite your teammates</h1>
                <p className="text-muted-foreground text-sm">
                  Collaborate better by inviting your team members to join your workspace
                </p>
              </div>

              <div className="grid gap-6">
                <div className="grid gap-4">
                  <div className="bg-secondary/50 rounded-lg p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <IconMail className="text-primary h-5 w-5" />
                      <h3 className="font-medium">Email Invitations</h3>
                    </div>
                    <p className="text-muted-foreground mb-4 text-sm">
                      Enter email addresses to send invitations. You can always invite more people later
                      from the workspace settings.
                    </p>

                    <div className="space-y-3">
                      {inviteEmails.map((email, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            type="email"
                            placeholder="colleague@example.com"
                            value={email}
                            onChange={(e) => updateEmailField(index, e.target.value)}
                            disabled={isLoading}
                            className="flex-1"
                          />
                          {inviteEmails.length > 1 && (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => removeEmailField(index)}
                              disabled={isLoading}
                              type="button"
                            >
                              <IconX className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>

                    <Button
                      variant="outline"
                      onClick={addEmailField}
                      disabled={isLoading}
                      className="mt-3 w-full"
                      type="button"
                    >
                      + Add another email
                    </Button>
                  </div>

                  {error && <p className="text-destructive text-sm">{error}</p>}

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep(5)}
                      disabled={isLoading}
                      className="flex-1"
                    >
                      Skip for now
                    </Button>
                    <Button
                      onClick={handleInvitations}
                      disabled={isLoading}
                      className="flex-1"
                    >
                      {isLoading ? "Sending..." : "Send Invitations"}
                    </Button>
                  </div>
                </div>
              </div>

              <p className="text-muted-foreground px-8 text-center text-sm">
                Need help? Message us{" "}
                <a
                  href={siteConfig.links.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary underline underline-offset-4"
                >
                  {siteConfig.links.twitter.replace("https://", "")}
                </a>
              </p>
            </>
          )}

          {/* Step 5: Success */}
          {currentStep === 5 && (
            <>
              <div className="flex flex-col space-y-2 text-center">
                <h1 className="text-2xl font-semibold tracking-tight">You&apos;re all set! 🎉</h1>
                <p className="text-muted-foreground text-sm">
                  Your workspace has been created and you&apos;re ready to start building
                </p>
              </div>

              <div className="grid gap-6">
                <div className="flex items-center justify-center p-6">
                  <div className="relative">
                    <div className="bg-primary/10 flex h-20 w-20 items-center justify-center rounded-full">
                      <IconCheck className="text-primary h-10 w-10" />
                    </div>
                  </div>
                </div>

                <div className="bg-secondary/50 rounded-lg p-4">
                  <div className="mb-2 flex items-center gap-3">
                    <IconFolder className="text-primary h-5 w-5" />
                    <h3 className="font-medium">Workspace Created</h3>
                  </div>
                  <p className="text-muted-foreground ml-8 text-sm">{workspaceName}</p>
                </div>

                <Button asChild size="lg" className="w-full">
                  <Link href="/dashboard">
                    <IconRocket className="mr-2 h-4 w-4" />
                    Go to Dashboard
                  </Link>
                </Button>
              </div>

              <p className="text-muted-foreground px-8 text-center text-sm">
                Need help? Message us{" "}
                <a
                  href="https://x.com/codehagen"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary underline underline-offset-4"
                >
                  x.com/codehagen
                </a>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
