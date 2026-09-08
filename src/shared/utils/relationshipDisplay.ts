type DisplayRecord = Record<string, unknown>;

const relationNameKeys: Record<string, string[]> = {
  tenant_id: ['tenant_name', 'organization_name'],
  platform_user_id: ['platform_user_name', 'actor_name', 'user_name'],
  target_user_id: ['target_user_name', 'user_name'],
  tenant_integration_id: ['integration_name', 'tenant_integration_name', 'integration_uuid'],
  provider_id: ['provider_name', 'provider_code'],
  staff_id: ['staff_name', 'employee_code'],
  leave_type_id: ['leave_type_name'],
  payroll_id: ['payroll_uuid', 'payroll_number'],
  cycle_id: ['cycle_name', 'cycle_uuid'],
  component_id: ['component_name', 'component_code'],
  department_id: ['department_name'],
  team_id: ['team_name'],
  approved_by: ['approved_by_name', 'reviewed_by_name'],
  created_by: ['created_by_name', 'creator_name'],
  updated_by: ['updated_by_name', 'updater_name']
};

export function relationshipValue(record: DisplayRecord, key: string, value: unknown): unknown {
  if (value === null || value === undefined || value === '') return value;
  const relation = relationNameKeys[key] ?? (key.endsWith('_id') ? [key.slice(0, -3) + '_name', key.slice(0, -3) + '_label'] : []);
  for (const nameKey of relation) {
    const label = record[nameKey];
    if (label !== null && label !== undefined && label !== '') return label;
  }
  const relationObject = record[key.replace(/_id$/, '')];
  if (relationObject && typeof relationObject === 'object') {
    const object = relationObject as DisplayRecord;
    return object.name ?? object.display_name ?? object.title ?? object.email ?? object.code ?? 'Related record';
  }
  if (key === 'id' || key.endsWith('_id') || key.endsWith('_uuid')) return 'Related record';
  return value;
}

export function isTechnicalKey(key: string): boolean {
  return key === 'id' || key === 'tenant_id' || key.endsWith('_id') || key.endsWith('_uuid') || key.endsWith('_encrypted');
}
