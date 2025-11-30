"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { IconBrandGoogle, IconMail, IconUnlink } from "@tabler/icons-react";
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
import { getConnectedAccounts, unlinkAccount } from "@/app/actions/account-security";

interface ConnectedAccount {
    id: string;
    providerId: string;
    createdAt: Date;
}

export function ConnectedAccounts() {
    const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [unlinkingId, setUnlinkingId] = useState<string | null>(null);

    useEffect(() => {
        loadAccounts();
    }, []);

    async function loadAccounts() {
        setIsLoading(true);
        try {
            const result = await getConnectedAccounts();
            if (result.success && result.data) {
                setAccounts(result.data);
            } else {
                toast.error(result.error || "Failed to load connected accounts");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
            console.error("Error loading accounts:", error);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleUnlink(accountId: string) {
        setUnlinkingId(accountId);
        try {
            const result = await unlinkAccount(accountId);
            if (result.success) {
                toast.success("Account unlinked successfully");
                await loadAccounts();
            } else {
                toast.error(result.error || "Failed to unlink account");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
            console.error("Error unlinking account:", error);
        } finally {
            setUnlinkingId(null);
        }
    }

    function getProviderIcon(providerId: string) {
        switch (providerId) {
            case "google":
                return <IconBrandGoogle className="h-5 w-5" />;
            case "credential":
                return <IconMail className="h-5 w-5" />;
            default:
                return <IconMail className="h-5 w-5" />;
        }
    }

    function getProviderName(providerId: string) {
        switch (providerId) {
            case "google":
                return "Google";
            case "credential":
                return "Email & Password";
            default:
                return providerId;
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Connected Accounts</CardTitle>
                <CardDescription>Manage how you sign in to your account</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                ) : accounts.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No connected accounts found</p>
                ) : (
                    <div className="space-y-4">
                        {accounts.map((account) => (
                            <div
                                key={account.id}
                                className="flex items-center justify-between rounded-lg border p-4"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="text-muted-foreground">
                                        {getProviderIcon(account.providerId)}
                                    </div>
                                    <div>
                                        <p className="font-medium">{getProviderName(account.providerId)}</p>
                                        <p className="text-muted-foreground text-sm">
                                            Connected {new Date(account.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            disabled={accounts.length === 1 || unlinkingId === account.id}
                                        >
                                            {unlinkingId === account.id ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            ) : (
                                                <IconUnlink className="mr-2 h-4 w-4" />
                                            )}
                                            Unlink
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Unlink {getProviderName(account.providerId)}?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                You will no longer be able to sign in using {getProviderName(account.providerId)}.
                                                Make sure you have another way to access your account.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    handleUnlink(account.id);
                                                }}
                                            >
                                                Unlink Account
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
