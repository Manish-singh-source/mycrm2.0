import {
  AlertTriangle,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  Download,
  Filter,
  Gauge,
  LogOut,
  Plus,
  Search,
  ShieldAlert,
  Users
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useTenantContext } from '@/features/auth/hooks/useTenantContext';
import type { AuthGuard } from '@/features/auth/types/authTypes';
import { PLATFORM_ROUTES } from '@/features/platform/routes/platformRoutes';
import { TENANT_ROUTES } from '@/features/tenant/routes/tenantRoutes';
import { Button, PermissionButton } from '@/shared/components/ui';

type ShellDashboardPageProps = {
  guard: AuthGuard;
};

const growthData = [
  { month: 'Dec', tenants: 580, revenue: 168 },
  { month: 'Jan', tenants: 720, revenue: 208 },
  { month: 'Feb', tenants: 725, revenue: 252 },
  { month: 'Mar', tenants: 860, revenue: 290 },
  { month: 'Apr', tenants: 980, revenue: 268 },
  { month: 'May', tenants: 1120, revenue: 304 },
  { month: 'Jun', tenants: 1248, revenue: 326 }
];

const usageData = [
  { day: 'May 10', api: 2.8, storage: 1.4, success: 520, failed: 160 },
  { day: 'May 15', api: 4.4, storage: 2.0, success: 620, failed: 142 },
  { day: 'May 20', api: 5.6, storage: 2.5, success: 690, failed: 170 },
  { day: 'May 25', api: 4.2, storage: 2.3, success: 710, failed: 190 },
  { day: 'May 31', api: 6.1, storage: 2.8, success: 780, failed: 224 },
  { day: 'Jun 7', api: 5.1, storage: 3.0, success: 805, failed: 178 }
];

const statusData = [
  { name: 'Active', value: 1058, color: '#22c55e' },
  { name: 'Trial', value: 86, color: '#2563eb' },
  { name: 'Past Due', value: 42, color: '#f59e0b' },
  { name: 'Canceled', value: 62, color: '#ef4444' }
];

const planData = [
  { name: 'Enterprise', value: 477, color: '#2563eb' },
  { name: 'Pro', value: 413, color: '#22c55e' },
  { name: 'Business', value: 219, color: '#f59e0b' },
  { name: 'Starter', value: 139, color: '#8b5cf6' }
];

const recentTenants = [
  ['Acme Corporation', 'acme-corp', 'John Smith', 'Enterprise', 'Active'],
  ['Globex Industries', 'globex', 'Sarah Johnson', 'Pro', 'Active'],
  ['Initech Solutions', 'initech', 'Michael Scott', 'Business', 'Active'],
  ['Umbrella Corp', 'umbrella', 'Albert Wesker', 'Enterprise', 'Suspended'],
  ['Soylent Corp', 'soylent', 'Peter Gibbons', 'Pro', 'Active']
];

const recentPayments = [
  ['PAY-2025-0823', 'Acme Corporation', '$4,950.00', 'Stripe', 'Succeeded'],
  ['PAY-2025-0822', 'Globex Industries', '$1,200.00', 'Stripe', 'Succeeded'],
  ['PAY-2025-0821', 'Initech Solutions', '$2,400.00', 'PayPal', 'Succeeded'],
  ['PAY-2025-0820', 'Stark Industries', '$9,900.00', 'Stripe', 'Succeeded']
];

const alerts = [
  ['Critical', 'High error rate detected on API Gateway', 'Active'],
  ['Warning', 'Database CPU usage above 85%', 'Active'],
  ['Warning', 'High memory usage on worker-05', 'Active'],
  ['Info', 'Backup completed successfully', 'Resolved']
];

const securityEvents = [
  ['High', 'Multiple failed login attempts', 'Acme Corporation', '203.0.113.45'],
  ['Medium', 'Password changed', 'Globex Industries', 'Sarah J.'],
  ['High', 'Suspicious API activity', 'Initech Solutions', '198.51.100.23'],
  ['Low', 'New API key generated', 'Umbrella Corp', 'Albert W.']
];

function kpisFor(guard: AuthGuard) {
  if (guard === 'tenant') {
    return [
      ['Open Leads', '428', '+ 8.6%', Users, 'blue'],
      ['Active Clients', '186', '+ 6.2%', BriefcaseBusiness, 'green'],
      ['Running Projects', '54', '+ 3.6%', Gauge, 'green'],
      ['Overdue Tasks', '37', '- 2.6%', AlertTriangle, 'red'],
      ['Invoices Due', '$87,640', '- 3.1%', Bell, 'orange'],
      ['Events Today', '18', '+ 20.8%', CalendarDays, 'blue'],
      ['Open Issues', '15', '- 16.7%', ShieldAlert, 'red'],
      ['Renewals Soon', '23', 'Next 7 days', Bell, 'orange']
    ] as const;
  }

  return [
    ['Total Tenants', '1,248', '+ 8.6%', Users, 'blue'],
    ['Active Tenants', '1,058', '+ 6.2%', Users, 'blue'],
    ['Trial Tenants', '86', '+ 3.6%', BriefcaseBusiness, 'green'],
    ['Suspended Tenants', '37', '- 2.6%', ShieldAlert, 'red'],
    ['Expired Tenants', '67', '+ 4.7%', CalendarDays, 'slate'],
    ['New Tenants Today', '18', '+ 20.8%', Plus, 'blue'],
    ['New This Week', '124', '+ 15.7%', Gauge, 'cyan'],
    ['MRR', '$285,420', '+ 7.3%', Bell, 'green'],
    ['ARR', '$3,425,040', '+ 7.9%', Bell, 'blue'],
    ['Overdue Balance', '$87,640.25', '- 3.1%', AlertTriangle, 'red'],
    ['Active Incidents', '7', '- 12.5%', AlertTriangle, 'orange'],
    ['Failed Jobs', '23', '- 21.4%', ShieldAlert, 'red']
  ] as const;
}

function statusClass(value: string) {
  const normalized = value.toLowerCase();
  if (normalized.includes('active') || normalized.includes('succeed')) return 'dashboard-status dashboard-status--green';
  if (normalized.includes('suspend') || normalized.includes('critical') || normalized.includes('high')) {
    return 'dashboard-status dashboard-status--red';
  }
  if (normalized.includes('warning') || normalized.includes('medium')) return 'dashboard-status dashboard-status--orange';
  return 'dashboard-status dashboard-status--blue';
}

export function ShellDashboardPage({ guard }: ShellDashboardPageProps) {
  const navigate = useNavigate();
  const auth = useAuthStore();
  const { logout } = useAuth(guard);
  const session = guard === 'platform' ? auth.platform : auth.tenant;
  const user = session.user;
  const { tenant } = useTenantContext();
  const isPlatform = guard === 'platform';
  const kpis = kpisFor(guard);
  const tenantSlug = tenant?.slug || tenant?.uuid;

  async function handleLogout() {
    await logout();
    navigate('/auth/login', { replace: true });
  }

  return (
    <section className="dashboard-page">
      <header className="dashboard-head">
        <div>
          <h1>{isPlatform ? 'Dashboard' : tenant?.organizationName ?? 'Dashboard'}</h1>
          <p>Home / Dashboard</p>
        </div>
        <div className="dashboard-head__tools">
          <label className="dashboard-search">
            <Search size={16} aria-hidden="true" />
            <input placeholder={isPlatform ? 'Search tenants, users, invoices...' : 'Search clients, tasks, invoices...'} />
          </label>
          <Button type="button" variant="secondary" size="sm">
            <Filter size={16} aria-hidden="true" />
            Filters
          </Button>
          <Button type="button" variant="secondary" size="sm">
            <Download size={16} aria-hidden="true" />
            Export Snapshot
          </Button>
          <Button type="button" variant="danger" size="sm" onClick={handleLogout}>
            <LogOut size={16} aria-hidden="true" />
            Logout
          </Button>
        </div>
      </header>

      <div className="dashboard-profile-strip">
        <div>
          <strong>{user?.displayName ?? 'User'}</strong>
          <span>{user?.email ?? 'Authenticated session'}</span>
        </div>
        <span>{session.roles.length ? session.roles.join(', ') : 'No roles returned'}</span>
      </div>

      <div className="dashboard-actions">
        {isPlatform ? (
          <>
            <PermissionButton guard="platform" permission="tenant.create" type="button" size="sm" onClick={() => navigate(`${PLATFORM_ROUTES.tenants}/create`)}>
              <Plus size={16} aria-hidden="true" />
              Create Tenant
            </PermissionButton>
            <PermissionButton guard="platform" permission="billing.invoice.create" type="button" size="sm" onClick={() => navigate(`${PLATFORM_ROUTES.billing.invoices}?action=manualInvoice`)}>
              <Plus size={16} aria-hidden="true" />
              Create Invoice
            </PermissionButton>
            <PermissionButton guard="platform" permission="monitoring.view" type="button" size="sm" onClick={() => navigate(`${PLATFORM_ROUTES.monitoring}?tab=queue`)}>
              View Failed Jobs
            </PermissionButton>
            <PermissionButton guard="platform" permission="monitoring.view" type="button" size="sm" onClick={() => navigate(`${PLATFORM_ROUTES.monitoring}?tab=incidents`)}>
              View Incidents
            </PermissionButton>
          </>
        ) : (
          <>
            <PermissionButton guard="tenant" permission="lead.create" type="button" size="sm" onClick={() => navigate(`${TENANT_ROUTES.crm.leads(tenantSlug)}/create`)}>
              <Plus size={16} aria-hidden="true" />
              New Lead
            </PermissionButton>
            <PermissionButton guard="tenant" permission="finance.invoice.create" type="button" size="sm" onClick={() => navigate(TENANT_ROUTES.finance.invoices(tenantSlug))}>
              <Plus size={16} aria-hidden="true" />
              New Invoice
            </PermissionButton>
            <PermissionButton guard="tenant" permission="task.view" type="button" size="sm" onClick={() => navigate(TENANT_ROUTES.projects.tasks(tenantSlug))}>
              Open Tasks
            </PermissionButton>
          </>
        )}
      </div>

      <section className="dashboard-kpis" aria-label="Key performance indicators">
        {kpis.map(([label, value, trend, Icon, tone]) => (
          <article className="dashboard-kpi" key={label}>
            <span className={`dashboard-kpi__icon dashboard-kpi__icon--${tone}`}>
              <Icon size={22} aria-hidden="true" />
            </span>
            <div>
              <p>{label}</p>
              <strong>{value}</strong>
            </div>
            <em className={trend.startsWith('-') ? 'is-down' : ''}>{trend}</em>
          </article>
        ))}
      </section>

      <section className="dashboard-grid dashboard-grid--charts">
        <article className="dashboard-panel">
          <header>
            <h2>{isPlatform ? 'Tenant Growth by Month' : 'Lead Growth by Month'}</h2>
            <strong>1,248</strong>
          </header>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={growthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8edf5" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip />
              <Line type="monotone" dataKey="tenants" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </article>

        <article className="dashboard-panel">
          <header>
            <h2>Revenue by Month</h2>
            <strong>$310,750</strong>
          </header>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={growthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8edf5" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip />
              <Bar dataKey="revenue" fill="#2563eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </article>

        <article className="dashboard-panel dashboard-panel--donut">
          <header>
            <h2>Subscription Status Distribution</h2>
          </header>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={statusData} dataKey="value" innerRadius={58} outerRadius={86} paddingAngle={2}>
                {statusData.map((item) => (
                  <Cell key={item.name} fill={item.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="dashboard-legend">
            {statusData.map((item) => (
              <span key={item.name}>
                <i style={{ background: item.color }} />
                {item.name}
              </span>
            ))}
          </div>
        </article>

        <article className="dashboard-panel dashboard-panel--donut">
          <header>
            <h2>Plan Distribution</h2>
          </header>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={planData} dataKey="value" innerRadius={56} outerRadius={86} paddingAngle={2}>
                {planData.map((item) => (
                  <Cell key={item.name} fill={item.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="dashboard-legend">
            {planData.map((item) => (
              <span key={item.name}>
                <i style={{ background: item.color }} />
                {item.name}
              </span>
            ))}
          </div>
        </article>
      </section>

      <section className="dashboard-grid dashboard-grid--wide">
        <article className="dashboard-panel">
          <header>
            <h2>API Usage Trend</h2>
            <strong>4.32M</strong>
          </header>
          <ResponsiveContainer width="100%" height={190}>
            <LineChart data={usageData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8edf5" />
              <XAxis dataKey="day" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip />
              <Line type="monotone" dataKey="api" stroke="#2563eb" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </article>

        <article className="dashboard-panel">
          <header>
            <h2>Storage Usage Trend</h2>
            <strong>2.41 TB</strong>
          </header>
          <ResponsiveContainer width="100%" height={190}>
            <LineChart data={usageData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8edf5" />
              <XAxis dataKey="day" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip />
              <Line type="monotone" dataKey="storage" stroke="#22c55e" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </article>

        <article className="dashboard-panel">
          <header>
            <h2>Payment Success/Failure Trend</h2>
          </header>
          <ResponsiveContainer width="100%" height={190}>
            <LineChart data={usageData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8edf5" />
              <XAxis dataKey="day" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip />
              <Line type="monotone" dataKey="success" stroke="#22c55e" strokeWidth={3} />
              <Line type="monotone" dataKey="failed" stroke="#ef4444" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </article>
      </section>

      <section className="dashboard-grid dashboard-grid--tables">
        <DashboardTable title={isPlatform ? 'Recent Tenants' : 'Recent Clients'} columns={['Name', 'Slug', 'Owner', 'Plan', 'Status']} rows={recentTenants} />
        <DashboardTable title="Recent Payments" columns={['Payment #', 'Tenant', 'Amount', 'Gateway', 'Status']} rows={recentPayments} />
        <DashboardTable title="Active Alerts" columns={['Severity', 'Message', 'Status']} rows={alerts} />
        <DashboardTable title="Security Events" columns={['Severity', 'Event', 'Tenant', 'User/IP']} rows={securityEvents} />
      </section>
    </section>
  );
}

function DashboardTable({ title, columns, rows }: { title: string; columns: string[]; rows: string[][] }) {
  return (
    <article className="dashboard-panel dashboard-table-panel">
      <header>
        <h2>{title}</h2>
        <button type="button">View all</button>
      </header>
      <div className="dashboard-table">
        <table>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.join('-')}>
                {row.map((cell, index) => (
                  <td key={`${cell}-${index}`}>
                    {index === row.length - 1 ? <span className={statusClass(cell)}>{cell}</span> : cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}
