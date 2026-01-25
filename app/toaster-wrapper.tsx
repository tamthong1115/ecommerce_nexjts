'use client';

import { Toaster, ToasterProps } from 'sonner';
import { useTheme } from 'next-themes';
export function ToasterWrapper() {
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme || 'system';
  return (
    <Toaster
      position="top-center"
      duration={3000}
      closeButton={true}
      theme={theme as ToasterProps['theme']}
    />
  );
}
