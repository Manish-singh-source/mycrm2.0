import type { ReactNode } from 'react';

export type TabItem = {
  id: string;
  label: ReactNode;
  badge?: ReactNode;
  disabled?: boolean;
};

type TabsProps = {
  tabs: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  ariaLabel: string;
};

export function Tabs({ tabs, activeId, onChange, ariaLabel }: TabsProps) {
  return (
    <div className="tabs" role="tablist" aria-label={ariaLabel}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={tab.id === activeId}
          disabled={tab.disabled}
          className="tabs__item"
          onClick={() => onChange(tab.id)}
        >
          <span>{tab.label}</span>
          {tab.badge ? <span className="tabs__badge">{tab.badge}</span> : null}
        </button>
      ))}
    </div>
  );
}
