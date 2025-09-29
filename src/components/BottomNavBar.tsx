"use client";

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomNavBarProps {
  onLinkClick?: () => void; // Optional prop for any potential future mobile menu closing
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({ onLinkClick }) => {
  const location = useLocation();

  const navItems = [
    {
      to: "/dashboard",
      icon: Home,
      label: "Dashboard",
    },
    {
      to: "/profile",
      icon: User,
      label: "Profile",
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-sidebar border-t border-sidebar-border shadow-lg z-50">
      <div className="flex justify-around h-16 items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);

          return (
            <Link key={item.to} to={item.to} onClick={onLinkClick} className="flex-1">
              <Button
                variant="ghost"
                className={cn(
                  "w-full h-full flex flex-col items-center justify-center text-xs gap-1",
                  isActive
                    ? "text-sidebar-primary"
                    : "text-sidebar-foreground hover:text-sidebar-primary"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="mt-1">{item.label}</span>
              </Button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavBar;