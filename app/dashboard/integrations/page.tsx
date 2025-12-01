"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Github, Slack, Figma, HardDrive, Database, Trello } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { checkGoogleDriveConnection } from "@/app/actions/google-drive";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { GoogleDriveBrowser } from "@/components/integrations/google-drive-browser";
import { toast } from "sonner";

export default function IntegrationsPage() {
  const [googleConnected, setGoogleConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkGoogleDriveConnection()
      .then(setGoogleConnected)
      .finally(() => setLoading(false));
  }, []);

  /**
   * Handles the connection for a specified provider.
   */
  const handleConnect = async (provider: string) => {
    if (provider === "google") {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/dashboard/integrations",
      });
    } else {
      toast.info("Integration coming soon");
    }
  };

  const integrations = [
    {
      id: "google-drive",
      name: "Google Drive",
      description:
        "Connect your Google Drive to sync files and documents directly into your workspace.",
      icon: HardDrive,
      connected: googleConnected,
      category: "Storage",
      action: googleConnected ? "Browse Files" : "Connect",
    },
    {
      id: "github",
      name: "GitHub",
      description: "Link pull requests, commits, and issues to your tasks and documentation.",
      icon: Github,
      connected: false,
      category: "Development",
      action: "Connect",
    },
    {
      id: "slack",
      name: "Slack",
      description: "Receive notifications and updates in your Slack channels.",
      icon: Slack,
      connected: false,
      category: "Communication",
      action: "Connect",
    },
    {
      id: "notion",
      name: "Notion",
      description: "Import pages and databases from your Notion workspace.",
      icon: Database,
      connected: false,
      category: "Productivity",
      action: "Connect",
    },
    {
      id: "jira",
      name: "Jira",
      description: "Sync Jira issues and track progress within your projects.",
      icon: Trello,
      connected: false,
      category: "Project Management",
      action: "Connect",
    },
    {
      id: "figma",
      name: "Figma",
      description: "Embed Figma designs and get updates on file changes.",
      icon: Figma,
      connected: false,
      category: "Design",
      action: "Connect",
    },
  ];

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
        <p className="text-muted-foreground">
          Manage your connections to external services and tools.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {integrations.map((integration) => (
          <Card key={integration.id} className="flex flex-col">
            <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <integration.icon className="h-6 w-6" />
                </div>
                <div className="flex flex-col">
                  <CardTitle className="text-base">{integration.name}</CardTitle>
                  <span className="text-xs text-muted-foreground">{integration.category}</span>
                </div>
              </div>
              {integration.connected && (
                <Badge
                  variant="secondary"
                  className="bg-green-500/10 text-green-600 hover:bg-green-500/20 hover:text-green-700 border-green-200"
                >
                  Connected
                </Badge>
              )}
            </CardHeader>
            <CardContent className="flex-1">
              <CardDescription className="text-sm">{integration.description}</CardDescription>
            </CardContent>
            <CardFooter>
              {integration.id === "google-drive" && integration.connected ? (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      Browse Files
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Google Drive Files</DialogTitle>
                    </DialogHeader>
                    <GoogleDriveBrowser
                      onSelect={(file) => toast.success(`Selected: ${file.name}`)}
                    />
                  </DialogContent>
                </Dialog>
              ) : (
                <Button
                  variant={integration.connected ? "outline" : "default"}
                  className="w-full"
                  onClick={() =>
                    handleConnect(integration.id === "google-drive" ? "google" : integration.id)
                  }
                >
                  {integration.action}
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
