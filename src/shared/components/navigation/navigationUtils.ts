import type { NavGroup } from '@/shared/components/navigation/navigationTypes';

export function flattenNavigation(groups: NavGroup[]) {
  return groups.flatMap((group) =>
    group.items.map((item) => ({
      ...item,
      groupLabel: group.label
    }))
  );
}

export function findBestNavMatch(pathname: string, groups: NavGroup[]) {
  const items = flattenNavigation(groups);

  return items
    .filter((item) => pathname === item.to || pathname.startsWith(`${item.to}/`))
    .sort((left, right) => right.to.length - left.to.length)[0];
}
