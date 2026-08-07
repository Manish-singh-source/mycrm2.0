import type { LucideIcon } from 'lucide-react';

export type NavItem = {
  label: string;
  to: string;
  icon?: LucideIcon;
  permission?: string;
  moduleCode?: string;
  badge?: string | number;
};

export type NavGroup = {
  label: string;
  moduleCode?: string;
  items: NavItem[];
};
