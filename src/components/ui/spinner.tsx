import { IconLoader2, type IconProps } from '@tabler/icons-react';

import { cn } from '@/lib/utils';

function Spinner({ className, ...props }: IconProps) {
  return (
    // biome-ignore lint: a11y/useSemanticElements: <Spinner> is purely decorative
    <IconLoader2
      role="status"
      aria-label="Loading"
      className={cn('size-4 animate-spin', className)}
      {...props}
    />
  );
}

export { Spinner };
