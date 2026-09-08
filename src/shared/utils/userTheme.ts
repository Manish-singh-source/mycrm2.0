export type UserTheme = 'light' | 'dark' | 'system';

export function applyUserTheme(theme: string | null | undefined): void {
  const preference: UserTheme = theme === 'dark' || theme === 'system' ? theme : 'light';
  const resolved = preference === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : preference;

  document.documentElement.dataset.theme = resolved;
  document.documentElement.dataset.themePreference = preference;
}