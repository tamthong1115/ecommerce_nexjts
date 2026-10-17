import * as React from 'react';
import { Loader as LucideLoader, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type LoaderProps = {
  size?: number | string;
  color?: string;
  className?: string;
  icon?: LucideIcon;
  label?: React.ReactNode;
  spinning?: boolean;
};

export function AppLoader({
  size = 24,
  color = 'currentColor',
  className,
  icon: Icon = LucideLoader,
  label,
  spinning = true,
  ...props
}: LoaderProps & React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      role="status"
      aria-live="polite"
      className={cn('inline-flex items-center gap-2', className)}
      {...props}
    >
      <Icon
        size={size}
        color={color}
        className={cn(spinning && 'animate-spin')}
        aria-hidden="true"
      />
      {label && <span className="text-sm text-muted-foreground">{label}</span>}
    </span>
  );
}

export const Loading = AppLoader;
