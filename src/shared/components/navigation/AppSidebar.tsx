import { ChevronRight, PanelLeftClose, Shield } from 'lucide-react';
import { NavLink } from 'react-router-dom';

import { hasPermission, isModuleEnabled } from '@/features/auth/permissions/permissions';
import { useAuthStore } from '@/features/auth/store/authStore';
import type { AuthGuard } from '@/features/auth/types/authTypes';
import type { NavGroup, NavItem } from '@/shared/components/navigation/navigationTypes';

type AppSidebarProps = {
  guard: AuthGuard;
  title: string;
  groups: NavGroup[];
};

function canShowItem(auth: ReturnType<typeof useAuthStore>, guard: AuthGuard, item: NavItem) {
  const permissionAllowed = !item.permission || hasPermission(auth, guard, item.permission);
  const moduleAllowed = guard !== 'tenant' || !item.moduleCode || isModuleEnabled(auth, item.moduleCode);
  return permissionAllowed && moduleAllowed;
}

function canShowGroup(auth: ReturnType<typeof useAuthStore>, guard: AuthGuard, group: NavGroup) {
  return guard !== 'tenant' || !group.moduleCode || isModuleEnabled(auth, group.moduleCode);
}

export function AppSidebar({ guard, title, groups }: AppSidebarProps) {
  const auth = useAuthStore();

  return (
    <aside className="app-sidebar">
      <div className="app-sidebar__brand">
        <span className="app-sidebar__brand-icon"><Shield size={20} aria-hidden /></span>
        <div>
          <strong>{title}</strong>
          <span>{guard === 'platform' ? 'Super Admin' : 'Tenant workspace'}</span>
        </div>
        <button type="button" aria-label="Collapse sidebar">
          <PanelLeftClose size={16} aria-hidden />
        </button>
      </div>
      <nav aria-label={`${title} navigation`}>
        {groups.map((group) => {
          if (!canShowGroup(auth, guard, group)) return null;
          const visibleItems = group.items.filter((item) => canShowItem(auth, guard, item));
          if (visibleItems.length === 0) return null;

          return (
            <section className="nav-group" key={group.label}>
              <h2>{group.label}</h2>
              {visibleItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink className="nav-link" to={item.to} key={item.to}>
                    {Icon ? <Icon size={18} aria-hidden /> : null}
                    <span>{item.label}</span>
                    {item.badge ? <span className="nav-badge">{item.badge}</span> : null}
                    <ChevronRight size={14} aria-hidden className="nav-link__chevron" />
                  </NavLink>
                );
              })}
            </section>
          );
        })}
      </nav>
    </aside>
  );
}
