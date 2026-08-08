import { useMemo, useState } from 'react';
import { z } from 'zod';

import { StatusBadge } from '@/shared/components/layout';
import {
  EnterpriseFormPage,
  EnterpriseListPage,
  EnterpriseViewPage,
  type EnterpriseListState,
  type EnterpriseModuleAdapter,
  type EnterpriseRecord
} from '@/shared/module-pages';

type SampleAccount = EnterpriseRecord & {
  name: string;
  owner: string;
  email: string;
  status: 'active' | 'inactive' | 'archived';
  value: string;
  updatedAt: string;
};

const sampleSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  owner: z.string().min(2, 'Owner is required.'),
  email: z.string().email('Enter a valid email.'),
  status: z.enum(['active', 'inactive', 'archived']),
  value: z.string().min(1, 'Value is required.')
});

type SampleForm = z.infer<typeof sampleSchema>;

const seedRecords: SampleAccount[] = [
  {
    id: 'sample-1',
    name: 'Acme Corporation',
    owner: 'John Smith',
    email: 'john@acme.example',
    status: 'active',
    value: '$24,000',
    updatedAt: '2026-08-08'
  },
  {
    id: 'sample-2',
    name: 'Globex Industries',
    owner: 'Sarah Johnson',
    email: 'sarah@globex.example',
    status: 'inactive',
    value: '$12,400',
    updatedAt: '2026-08-07'
  },
  {
    id: 'sample-3',
    name: 'Initech Solutions',
    owner: 'Michael Scott',
    email: 'michael@initech.example',
    status: 'active',
    value: '$8,950',
    updatedAt: '2026-08-06'
  }
];

function statusTone(status: SampleAccount['status']) {
  if (status === 'active') return 'success';
  if (status === 'inactive') return 'warning';
  return 'danger';
}

export function SampleEnterpriseModulePage() {
  const [records, setRecords] = useState(seedRecords);
  const [mode, setMode] = useState<'list' | 'create' | 'edit' | 'view'>('list');
  const [activeRecord, setActiveRecord] = useState<SampleAccount | undefined>();

  const adapter = useMemo<EnterpriseModuleAdapter<SampleAccount, SampleForm>>(
    () => ({
      id: 'sample-accounts',
      label: 'Sample Accounts',
      guard: 'platform',
      permissions: {
        view: 'dashboard.view',
        create: 'dashboard.view',
        edit: 'dashboard.view',
        delete: 'dashboard.view',
        export: 'dashboard.view',
        import: 'dashboard.view'
      },
      getRowId: (row) => row.id,
      columns: [
        {
          id: 'name',
          header: 'Name',
          cell: (row) => <strong>{row.name}</strong>,
          accessor: (row) => row.name,
          enableSorting: true,
          enableHiding: false
        },
        { id: 'owner', header: 'Owner', cell: (row) => row.owner, accessor: (row) => row.owner, enableSorting: true },
        { id: 'email', header: 'Email', cell: (row) => row.email, accessor: (row) => row.email, enableSorting: true },
        {
          id: 'status',
          header: 'Status',
          cell: (row) => <StatusBadge tone={statusTone(row.status)}>{row.status}</StatusBadge>,
          accessor: (row) => row.status,
          enableSorting: true
        },
        { id: 'value', header: 'Value', cell: (row) => row.value, accessor: (row) => row.value, enableSorting: true },
        { id: 'updatedAt', header: 'Updated', cell: (row) => row.updatedAt, accessor: (row) => row.updatedAt, enableSorting: true }
      ],
      fields: [
        { name: 'name', label: 'Account name', placeholder: 'Acme Corporation' },
        { name: 'owner', label: 'Owner', placeholder: 'John Smith' },
        { name: 'email', label: 'Owner email', type: 'email', placeholder: 'owner@example.com' },
        {
          name: 'status',
          label: 'Status',
          type: 'select',
          options: [
            { label: 'Active', value: 'active' },
            { label: 'Inactive', value: 'inactive' },
            { label: 'Archived', value: 'archived' }
          ]
        },
        { name: 'value', label: 'Pipeline value', placeholder: '$10,000' }
      ],
      schema: sampleSchema,
      defaultValues: {
        name: '',
        owner: '',
        email: '',
        status: 'active',
        value: ''
      },
      toFormValues: (record) => ({
        name: record?.name ?? '',
        owner: record?.owner ?? '',
        email: record?.email ?? '',
        status: record?.status ?? 'active',
        value: record?.value ?? ''
      }),
      getTitle: (record) => record?.name ?? 'Sample Account',
      getSubtitle: (record) => record ? `${record.owner} / ${record.email}` : undefined,
      getStatus: (record) => ({ label: record.status, tone: statusTone(record.status) }),
      getTabs: () => [
        { id: 'overview', label: 'Overview' },
        { id: 'notes', label: 'Notes', badge: 0 },
        { id: 'files', label: 'Files', badge: 0 },
        { id: 'reminders', label: 'Reminders' },
        { id: 'activity', label: 'Activity' }
      ],
      renderTab: (tabId, record) => (
        <dl className="enterprise-summary-list">
          <div><dt>Tab</dt><dd>{tabId}</dd></div>
          <div><dt>Name</dt><dd>{record.name}</dd></div>
          <div><dt>Owner</dt><dd>{record.owner}</dd></div>
          <div><dt>Email</dt><dd>{record.email}</dd></div>
          <div><dt>Value</dt><dd>{record.value}</dd></div>
        </dl>
      ),
      list: async (state: EnterpriseListState) => {
        const query = state.search.trim().toLowerCase();
        const filtered = query
          ? records.filter((record) =>
              [record.name, record.owner, record.email, record.status].join(' ').toLowerCase().includes(query)
            )
          : records;
        const start = (state.page - 1) * state.perPage;
        return { data: filtered.slice(start, start + state.perPage), total: filtered.length };
      },
      create: async (values) => {
        const record: SampleAccount = {
          id: `sample-${Date.now()}`,
          ...values,
          updatedAt: new Date().toISOString().slice(0, 10)
        };
        setRecords((current) => [record, ...current]);
        return record;
      },
      update: async (id, values) => {
        const updated: SampleAccount = {
          id,
          ...values,
          updatedAt: new Date().toISOString().slice(0, 10)
        };
        setRecords((current) => current.map((record) => (record.id === id ? updated : record)));
        return updated;
      },
      remove: async (ids) => {
        setRecords((current) => current.filter((record) => !ids.includes(record.id)));
      },
      duplicateCheck: async (values) => {
        const duplicate = records.some(
          (record) => record.name.toLowerCase() === String(values.name ?? '').toLowerCase() && record.id !== activeRecord?.id
        );
        return { duplicate, message: duplicate ? 'An account with this name already exists.' : undefined };
      }
    }),
    [activeRecord?.id, records]
  );

  if (mode === 'create') {
    return (
      <EnterpriseFormPage
        adapter={adapter}
        onCancel={() => setMode('list')}
        onSaved={(record, options) => {
          setActiveRecord(record);
          setMode(options?.continueEditing ? 'edit' : 'view');
        }}
      />
    );
  }

  if (mode === 'edit' && activeRecord) {
    return (
      <EnterpriseFormPage
        adapter={adapter}
        record={activeRecord}
        onCancel={() => setMode('view')}
        onSaved={(record, options) => {
          setActiveRecord(record);
          setMode(options?.continueEditing ? 'edit' : 'view');
        }}
      />
    );
  }

  if (mode === 'view' && activeRecord) {
    return (
      <EnterpriseViewPage
        adapter={adapter}
        record={activeRecord}
        onBack={() => setMode('list')}
        onEdit={() => setMode('edit')}
      />
    );
  }

  return (
    <EnterpriseListPage
      adapter={adapter}
      onCreate={() => {
        setActiveRecord(undefined);
        setMode('create');
      }}
      onView={(record) => {
        setActiveRecord(record);
        setMode('view');
      }}
      onEdit={(record) => {
        setActiveRecord(record);
        setMode('edit');
      }}
    />
  );
}
