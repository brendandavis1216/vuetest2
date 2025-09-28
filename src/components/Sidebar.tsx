import React from 'react';
import { Link } from 'react-router-dom';
import { PanelLeft, Home, Users, Folder, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSession } from '@/components/SessionContextProvider';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';

interface NavLinkProps {
  to: string;
  icon: React.ElementType;
  label: string;
  isMobile?: boolean;
  onClick?: () => void;
}

const NavLink: React.FC<NavLinkProps> = ({ to, icon: Icon, label, isMobile, onClick }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Link
        to={to}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-sidebar-foreground transition-colors hover:text-sidebar-primary md:h-8 md:w-8"
        onClick={onClick}
      >
        <Icon className="h-5 w-5" />
        <span className="sr-only">{label}</span>
      </Link>
    </TooltipTrigger>
    <TooltipContent side="right">{label}</TooltipContent>
  </Tooltip>
);

const Sidebar: React.FC = () => {
  const isMobile = useIsMobile();
  const { user } = useSession();
  const isAdmin = user?.user_metadata?.role === 'admin';

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      showError(error.message);
    } else {
      showSuccess("Logged out successfully!");
    }
  };

  const navItems = [
    { to: '/', icon: Home, label: 'Dashboard', roles: ['admin', 'client'] },
    { to: '/clients', icon: Users, label: 'Clients', roles: ['admin'] },
    { to: '/files', icon: Folder, label: 'Files', roles: ['admin', 'client'] },
    { to: '/settings', icon: Settings, label: 'Settings', roles: ['admin', 'client'] },
  ];

  const filteredNavItems = navItems.filter(item => item.roles.includes(isAdmin ? 'admin' : 'client'));

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="sm:hidden fixed top-4 left-4 z-50 bg-sidebar-background text-sidebar-foreground">
            <PanelLeft className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="sm:max-w-xs bg-sidebar-background text-sidebar-foreground border-r-sidebar-border">
          <nav className="grid gap-6 text-lg font-medium pt-10">
            <Link to="/" className="flex items-center gap-2 text-lg font-semibold text-sidebar-primary mb-4">
              <span className="text-white text-2xl font-bold">VUE Production</span>
            </Link>
            {filteredNavItems.map((item) => (
              <Link key={item.to} to={item.to} className="flex items-center gap-4 px-2.5 text-sidebar-foreground hover:text-sidebar-primary">
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
            <Button onClick={handleLogout} variant="ghost" className="flex items-center gap-4 px-2.5 text-sidebar-foreground hover:text-sidebar-primary justify-start">
              <LogOut className="h-5 w-5" />
              Logout
            </Button>
          </nav>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-sidebar-background sm:flex border-sidebar-border">
      <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
        <Link
          to="/"
          className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-sidebar-primary text-lg font-semibold text-sidebar-primary-foreground md:h-8 md:w-8"
        >
          <span className="text-white text-xl font-bold">V</span>
          <span className="sr-only">VUE Production</span>
        </Link>
        {filteredNavItems.map((item) => (
          <NavLink key={item.to} to={item.to} icon={item.icon} label={item.label} />
        ))}
      </nav>
      <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-sidebar-foreground transition-colors hover:text-sidebar-primary md:h-8 md:w-8"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
              <span className="sr-only">Logout</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Logout</TooltipContent>
        </Tooltip>
      </nav>
    </aside>
  );
};

export default Sidebar;