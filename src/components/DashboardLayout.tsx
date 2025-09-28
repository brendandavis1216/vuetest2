import React from 'react';
import Sidebar from './Sidebar';
import { MadeWithDyad } from './made-with-dyad';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div className="flex min-h-screen w-full bg-black text-white">
      <Sidebar />
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14 w-full">
        <main className="flex-1 p-4 sm:px-6 sm:py-0">
          {children}
        </main>
        <MadeWithDyad />
      </div>
    </div>
  );
};

export default DashboardLayout;