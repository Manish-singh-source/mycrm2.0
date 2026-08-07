import type { LucideIcon } from 'lucide-react';

export type NavItem = {
  id?: string;
  label: string;
  to: string;
  icon?: LucideIcon;
  permission?: string;
  moduleCode?: string;
  badge?: string | number;
  keywords?: string[];
};

export type NavGroup = {
  id?: string;
  label: string;
  moduleCode?: string;
  items: NavItem[];
};
