"use client";

import React, { useEffect, useState } from 'react';
import { ResizablePanelGroup, ResizablePanel } from '@/components/ui/resizable';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import SidebarNav from './SidebarNav';
import BottomNavBar from './BottomNavBar'; // Import the new BottomNavBar

interface SidebarLayoutProps {
  children: React.ReactNode;
  isAdmin: boolean;
  onSignOut: () => void;
}

const SidebarLayout: React.FC<SidebarLayoutProps> = ({ children, isAdmin, onSignOut }) => {
  const isMobile = useIsMobile();
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // On mobile, if not admin, we use the BottomNavBar.
  // The desktop sidebar state is managed by `isSidebarOpen`.
  useEffect(() => {
    if (!isMobile) {
      setIsSidebarOpen(true); // Always open sidebar on desktop by default
    } else {
      setIsSidebarOpen(false); // Always closed on mobile by default
    }
  }, [isMobile]);

  const handleLinkClick = () => {
    if (isMobile) {
      setIsSheetOpen(false); // Close sheet if it's ever used on mobile
    }
  };

  if (isMobile) {
    return (
      <div className="flex flex-col min-h-screen">
        <header className="bg-sidebar text-sidebar-foreground p-4 shadow-md flex items-center justify-between">
          {/* For mobile, if admin, we might still want a sheet for admin nav.
              For clients, the bottom nav is primary, so no sheet trigger for main nav. */}
          {isAdmin && (
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
          )}
          <h1 className="text-xl font-bold text-sidebar-foreground">VUE</h1>
          {/* Placeholder to balance header if no sheet trigger */}
          {!isAdmin && <div className="w-10"></div>} 
        </header>
        <main className="flex-grow p-4 pb-16"> {/* Add padding-bottom for the fixed BottomNavBar */}
          {children}
        </main>
        {!isAdmin && <BottomNavBar onLinkClick={handleLinkClick} />} {/* Only show BottomNavBar for clients */}
      </div>
    );
  }

  // Desktop view
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