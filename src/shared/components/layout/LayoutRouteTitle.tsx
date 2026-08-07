import { useLocation } from 'react-router-dom';

import type { NavGroup } from '@/shared/components/navigation/navigationTypes';
import { findBestNavMatch } from '@/shared/components/navigation/navigationUtils';

type LayoutRouteTitleProps = {
  fallback: string;
  groups: NavGroup[];
};

export function LayoutRouteTitle({ fallback, groups }: LayoutRouteTitleProps) {
  const location = useLocation();
  const matched = findBestNavMatch(location.pathname, groups);

  return <>{matched?.label ?? fallback}</>;
}
