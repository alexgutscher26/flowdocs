import { WikiSidebar } from "@/components/wiki/wiki-sidebar";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

interface WikiLayoutProps {
    children: React.ReactNode;
    params: Promise<{
        workspaceId: string;
    }>;
}

export default async function WikiLayout({ children, params }: WikiLayoutProps) {
    const { workspaceId } = await params;

    return (
        <div className="h-full flex-1 overflow-hidden">
            <ResizablePanelGroup direction="horizontal">
                <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="border-r">
                    <div className="flex h-full flex-col">
                        <div className="border-b p-4">
                            <h2 className="font-semibold">Wiki Navigation</h2>
                        </div>
                        <WikiSidebar workspaceId={workspaceId} />
                    </div>
                </ResizablePanel>
                <ResizableHandle />
                <ResizablePanel defaultSize={80}>
                    {children}
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
}
