const idempotentActionGroups = ['billing', 'finance', 'payroll', 'security', 'bulk'] as const;

export type IdempotentActionGroup = (typeof idempotentActionGroups)[number];

function randomId() {
  if ('randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createIdempotencyKey(group: IdempotentActionGroup, action: string, subjectId?: string) {
  const normalizedAction = action.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return [group, normalizedAction, subjectId, randomId()].filter(Boolean).join(':');
}

export function withIdempotency(
  group: IdempotentActionGroup,
  action: string,
  subjectId?: string
): { idempotencyKey: string } {
  return {
    idempotencyKey: createIdempotencyKey(group, action, subjectId)
  };
}

export function isIdempotentActionGroup(value: string): value is IdempotentActionGroup {
  return idempotentActionGroups.includes(value as IdempotentActionGroup);
}
