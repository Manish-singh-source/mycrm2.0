import type { ComponentProps } from 'react';

import { usePermission } from '@/features/auth/hooks/usePermission';
import type { AuthGuard, Permission } from '@/features/auth/types/authTypes';
import { Button } from '@/shared/components/ui/Button';

type PermissionButtonProps = ComponentProps<typeof Button> & {
  guard: AuthGuard;
  permission: Permission;
  hideWhenDenied?: boolean;
};

export function PermissionButton({
  guard,
  permission,
  hideWhenDenied = true,
  disabled,
  ...props
}: PermissionButtonProps) {
  const { can } = usePermission(guard);
  const allowed = can(permission);

  if (!allowed && hideWhenDenied) return null;

  return <Button {...props} disabled={disabled || !allowed} />;
}
