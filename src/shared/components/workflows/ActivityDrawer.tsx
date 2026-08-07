import type { ReactNode } from 'react';

import { AppDrawer } from '@/shared/components/drawer';
import { ActivityTimeline, type ActivityTimelineItem } from '@/shared/components/activity';
import type { AuthGuard, Permission } from '@/features/auth/types/authTypes';

type ActivityDrawerProps = {
  open: boolean;
  onClose: () => void;
  items: ActivityTimelineItem[];
  guard?: AuthGuard;
  permission?: Permission;
  loading?: boolean;
  error?: ReactNode;
};

export function ActivityDrawer(props: ActivityDrawerProps) {
  return (
    <AppDrawer open={props.open} onClose={props.onClose} title="Activity" guard={props.guard} permission={props.permission} loading={props.loading} error={props.error}>
      <ActivityTimeline items={props.items} />
    </AppDrawer>
  );
}
