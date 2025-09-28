"use client";

import React from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import SidebarNav from './SidebarNav'; // Import the new SidebarNav component

interface SidebarLayoutProps {
  children: React.ReactNode;
  isAdmin: boolean;
  onSignOut: () => void;
}

const SidebarLayout: React.FC<SidebarLayoutProps> = ({ children, isAdmin, onSignOut }) => {
  const isMobile = useIsMobile();
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);

  const handleLinkClick = () => {
    if (isMobile) {
      setIsSheetOpen(false); // Close the sheet on link click
    }
  };

  if (isMobile) {
    return (
      <div className="flex flex-col min-h-screen">
        <header className="bg-primary text-primary-foreground p-4 shadow-md flex items-center justify-between">
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-primary-foreground">
                <> {/* Explicitly wrap children in a fragment */}
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle navigation</span>
                </>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 bg-sidebar">
              <div className="p-4 border-b border-sidebar-border">
                <h2 className="text-xl font-bold text-sidebar-foreground">VUE</h2>
              </div>
              <SidebarNav isAdmin={isAdmin} onSignOut={onSignOut} onLinkClick={handleLinkClick} />
            </SheetContent>
          </Sheet>
          <h1 className="text-xl font-bold text-primary-foreground">VUE</h1>
          <div className="w-10"></div> {/* Placeholder for alignment */}
        </header>
        <main className="flex-grow p-4">
          {children}
        </main>
      </div>
    );
  }

  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="min-h-screen w-full rounded-lg border"
    >
      <ResizablePanel defaultSize={18} minSize={15} maxSize={25} className="bg-sidebar text-sidebar-foreground">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-center h-16 border-b border-sidebar-border px-4">
            <h2 className="text-2xl font-bold text-sidebar-foreground">VUE</h2>
          </div>
          <div className="flex-grow overflow-y-auto">
            <SidebarNav isAdmin={isAdmin} onSignOut={onSignOut} />
          </div>
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={82}>
        <main className="flex-grow p-6">
          {children}
        </main>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

export default SidebarLayout;