import { useLocation } from 'react-router-dom';

import { Breadcrumbs, type BreadcrumbItem } from '@/shared/components/layout/Breadcrumbs';
import type { NavGroup } from '@/shared/components/navigation/navigationTypes';
import { findBestNavMatch } from '@/shared/components/navigation/navigationUtils';

type LayoutBreadcrumbsProps = {
  rootLabel: string;
  rootTo: string;
  groups: NavGroup[];
};

function titleize(segment: string) {
  return segment
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function LayoutBreadcrumbs({ rootLabel, rootTo, groups }: LayoutBreadcrumbsProps) {
  const location = useLocation();
  const matched = findBestNavMatch(location.pathname, groups);
  const items: BreadcrumbItem[] = [{ label: rootLabel, to: rootTo }];

  if (matched?.groupLabel && matched.groupLabel !== rootLabel) {
    items.push({ label: matched.groupLabel });
  }

  if (matched) {
    items.push({ label: matched.label, to: matched.to });
  } else {
    const fallback = location.pathname.split('/').filter(Boolean).at(-1);
    if (fallback) items.push({ label: titleize(fallback) });
  }

  return <Breadcrumbs items={items} />;
}
