"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingActionButtonProps extends React.ComponentPropsWithoutRef<typeof Button> {
  icon?: React.ElementType;
  label?: string;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  icon: Icon = Plus,
  label = '',
  className,
  children,
  ...props
}) => {
  return (
    <Button
      className={cn(
        "fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full shadow-lg flex items-center justify-center text-lg",
        "bg-primary text-primary-foreground hover:bg-primary/90",
        className
      )}
      {...props}
    >
      {Icon && <Icon className={cn("h-6 w-6", label && "mr-2")} />}
      {label || children}
    </Button>
  );
};

export default FloatingActionButton;