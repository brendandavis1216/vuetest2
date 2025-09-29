"use client";

import React, { useEffect, useState } from 'react';
import { ResizablePanelGroup, ResizablePanel } from '@/components/ui/resizable'; // Removed ResizableHandle import
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import SidebarNav from './SidebarNav';

interface SidebarLayoutProps {
  children: React.ReactNode;
  isAdmin: boolean;
  onSignOut: () => void;
}

const SidebarLayout: React.FC<SidebarLayoutProps> = ({ children, isAdmin, onSignOut }) => {
  const isMobile = useIsMobile();
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLinkClick = () => {
    if (isMobile) {
      setIsSheetOpen(false);
    }
  };

  if (isMobile) {
    return (
      <div className="flex flex-col min-h-screen">
        <header className="bg-sidebar text-sidebar-foreground p-4 shadow-md flex items-center justify-between">
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-sidebar-foreground">
                <span>
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle navigation</span>
                </span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 bg-sidebar">
              <div className="p-4 border-b border-sidebar-border">
                <h2 className="text-xl font-bold text-sidebar-foreground">VUE</h2>
              </div>
              <SidebarNav isAdmin={isAdmin} onSignOut={onSignOut} onLinkClick={handleLinkClick} />
            </SheetContent>
          </Sheet>
          <h1 className="text-xl font-bold text-sidebar-foreground">VUE</h1>
          <div className="w-10"></div>
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
      {isSidebarOpen && (
        <ResizablePanel minSize={18} maxSize={18} defaultSize={18} className="bg-sidebar text-sidebar-foreground">
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between h-16 border-b border-sidebar-border px-4">
              <h2 className="text-2xl font-bold text-sidebar-foreground">VUE</h2>
              <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)} className="text-sidebar-foreground">
                <X className="h-6 w-6" />
                <span className="sr-only">Hide Sidebar</span>
              </Button>
            </div>
            <div className="flex-grow overflow-y-auto">
              <SidebarNav isAdmin={isAdmin} onSignOut={onSignOut} />
            </div>
          </div>
        </ResizablePanel>
      )}
      {/* ResizableHandle removed */}
      <ResizablePanel defaultSize={isSidebarOpen ? 82 : 100}>
        <main className="flex-grow p-6 relative">
          {!isSidebarOpen && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsSidebarOpen(true)}
              className="absolute top-4 left-4 z-50"
            >
              <Menu className="h-6 w-6" />
              <span className="sr-only">Show Sidebar</span>
            </Button>
          )}
          {children}
        </main>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

export default SidebarLayout;