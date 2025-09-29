"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface MobileHeaderProps {
  title: string;
  className?: string;
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({ title, className, leftContent, rightContent }) => {
  return (
    <header
      className={cn(
        "sticky top-0 z-30 w-full bg-background border-b border-border py-3 px-4 flex items-center justify-between",
        className
      )}
    >
      <div className="flex items-center gap-2">
        {leftContent}
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
      </div>
      <div>
        {rightContent}
      </div>
    </header>
  );
};

export default MobileHeader;