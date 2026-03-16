'use client';

import * as React from 'react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface DrawerDetailsViewerProps {
  title: string;
  description?: string;
  trigger: React.ReactNode;
  footerAction?: React.ReactNode;
  children: React.ReactNode;
  /** Optional ref for the scrollable content area (needed for auto-scrolling features) */
  contentRef?: React.RefObject<HTMLDivElement | null>;
  className?: string;
}

export function DrawerDetailsViewer({
  title,
  description,
  trigger,
  footerAction,
  children,
  contentRef,
  className,
}: DrawerDetailsViewerProps) {
  const isMobile = useIsMobile();

  return (
    <Drawer direction={isMobile ? 'bottom' : 'right'}>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>{title}</DrawerTitle>
          {description && <DrawerDescription>{description}</DrawerDescription>}
        </DrawerHeader>
        <div
          ref={contentRef}
          className={cn(
            'flex flex-col gap-4 overflow-y-auto px-4 text-sm',
            className
          )}
        >
          {children}
        </div>

        <DrawerFooter>
          {footerAction}
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
