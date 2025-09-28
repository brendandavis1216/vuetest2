"use client";

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, User, Shield, BarChart, CalendarDays, LogOut, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarNavProps {
  isAdmin: boolean;
  onSignOut: () => void;
  onLinkClick?: () => void; // Optional prop for closing mobile sidebar
}

const SidebarNav: React.FC<SidebarNavProps> = ({ isAdmin, onSignOut, onLinkClick }) => {
  const location = useLocation();

  const navItems = [
    {
      to: isAdmin ? "/admin" : "/dashboard",
      icon: isAdmin ? Shield : Home,
      label: isAdmin ? "Admin Dashboard" : "Dashboard",
      roles: ['client', 'admin'],
    },
    {
      to: "/admin/analytics",
      icon: BarChart,
      label: "Analytics",
      roles: ['admin'],
    },
    {
      to: "/admin/calendar",
      icon: CalendarDays,
      label: "Calendar",
      roles: ['admin'],
    },
    {
      to: "/admin/leads", // New Lead Database link
      icon: UserPlus,
      label: "Lead Database",
      roles: ['admin'],
    },
    {
      to: "/profile",
      icon: User,
      label: "Profile",
      roles: ['client', 'admin'],
    },
  ];

  return (
    <nav className="flex flex-col gap-2 p-4">
      {navItems.map((item) => {
        const Icon = item.icon;
        let isActive = false;

        if (item.to === "/admin") {
          // Admin Dashboard is active if on /admin or /admin/clients/:userId
          isActive = location.pathname === "/admin" || location.pathname.startsWith("/admin/clients/");
        } else {
          // For other items, it's active if the path exactly matches or starts with the item's path
          isActive = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
        }
        
        if ((isAdmin && item.roles.includes('admin')) || (!isAdmin && item.roles.includes('client') && !item.to.startsWith('/admin'))) {
          return (
            <Link key={item.to} to={item.to} onClick={onLinkClick}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <> {/* Explicitly wrap children in a fragment */}
                  <Icon className="mr-2 h-4 w-4" />
                  {item.label}
                </>
              </Button>
            </Link>
          );
        }
        return null;
      })}
      <Button
        onClick={() => {
          onSignOut();
          onLinkClick?.(); // Close sidebar on sign out for mobile
        }}
        variant="ghost"
        className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground mt-4"
      >
        <span> {/* Wrap icon and text in a span */}
          <LogOut className="mr-2 h-4 w-4" /> Sign Out
        </span>
      </Button>
    </nav>
  );
};

export default SidebarNav;