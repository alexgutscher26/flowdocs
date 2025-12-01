"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { GoogleDriveBrowser } from "@/components/integrations/google-drive-browser";
import { GoogleDriveFile } from "@/lib/integrations/google-drive";
import { Button } from "@/components/ui/button";

interface GoogleDrivePickerProps {
    onSelect: (file: GoogleDriveFile) => void;
    trigger?: React.ReactNode;
}

export function GoogleDrivePicker({ onSelect, trigger }: GoogleDrivePickerProps) {
    const [open, setOpen] = useState(false);

    const handleSelect = (file: GoogleDriveFile) => {
        onSelect(file);
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button variant="outline">Select from Google Drive</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Select File from Google Drive</DialogTitle>
                </DialogHeader>
                <GoogleDriveBrowser onSelect={handleSelect} />
            </DialogContent>
        </Dialog>
    );
}
