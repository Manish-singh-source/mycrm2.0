const storageKey = 'platform-read-notification-ids';
const eventName = 'platform-notification-read';

export function getReadPlatformNotificationIds(): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(storageKey) ?? '[]');
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export function markPlatformNotificationRead(id: string): void {
  const ids = new Set(getReadPlatformNotificationIds());
  ids.add(id);
  localStorage.setItem(storageKey, JSON.stringify([...ids]));
  window.dispatchEvent(new CustomEvent(eventName));
}

export function platformNotificationReadEvent(): string {
  return eventName;
}