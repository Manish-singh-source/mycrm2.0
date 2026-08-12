import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CalendarPlus,
  CheckCircle2,
  Download,
  Eye,
  Mail,
  MoreVertical,
  Pencil,
  Plus,
  RefreshCw,
  Upload,
  XCircle
} from 'lucide-react';

import { ApiError } from '@/lib/api/apiError';
import type { ApiQuery } from '@/lib/api/apiTypes';
import { tenantHrmsApi, type HrmsRecord } from '@/features/tenant/api/tenantHrmsApi';
import { tenantQueryKeys } from '@/features/tenant/api/tenantQueryKeys';
import { TENANT_ROUTES } from '@/features/tenant/routes/tenantRoutes';
import { DataTable, type DataTableColumn } from '@/shared/components/data-table';
import { AppDrawer } from '@/shared/components/drawer';
import { PageHeader, StatusBadge, Tabs } from '@/shared/components/layout';
import { AppModal } from '@/shared/components/modal';
import { Button, PermissionButton } from '@/shared/components/ui';
import { ConfirmDialog } from '@/shared/components/workflows';

const tenantKey = 'current';

type ModalState =
  | null
  | 'checkIn'
  | 'checkOut'
  | 'correction'
  | 'approveCorrection'
  | 'rejectCorrection'
  | 'bulkAttendance'
  | 'attendanceImport'
  | 'attendanceExport'
  | 'applyLeave'
  | 'approveLeave'
  | 'rejectLeave'
  | 'cancelLeave'
  | 'adjustBalance'
  | 'cycle'
  | 'generatePayroll'
  | 'payrollPreview'
  | 'submitPayroll'
  | 'approvePayroll'
  | 'lockPayroll'
  | 'reopenPayroll'
  | 'payslipPreview'
  | 'emailPayslips'
  | 'component'
  | 'assignment'
  | 'loan'
  | 'reimbursement'
  | 'bankTransfer'
  | 'taxSettings'
  | 'holiday'
  | 'holidayApplicability'
  | 'duplicateHoliday'
  | 'holidayImport'
  | 'holidayExport'
  | 'calendar'
  | 'group'
  | 'groupMembers';

export function TenantAttendancePage() {
  const [view, setView] = useState('dashboard');
  return (
    <HrmsShell
      title="Attendance"
      description="Daily attendance, monthly grid, check-in/out, correction requests, approvals, imports, and exports."
      tabs={attendanceTabs}
      activeTab={view}
      onTabChange={setView}
    >
      {view === 'dashboard' ? <AttendanceDashboard /> : null}
      {view === 'daily' ? <AttendanceDaily /> : null}
      {view === 'monthly' ? <AttendanceMonthly /> : null}
      {view === 'requests' ? <AttendanceRequests /> : null}
    </HrmsShell>
  );
}

export function TenantLeavePage() {
  const [view, setView] = useState('dashboard');
  return (
    <HrmsShell title="Leave Management" description="Leave requests, approvals, balances, calendar, and leave type setup." tabs={leaveTabs} activeTab={view} onTabChange={setView}>
      {view === 'dashboard' ? <LeaveDashboard /> : null}
      {view === 'requests' ? <LeaveRequests /> : null}
      {view === 'balances' ? <LeaveBalances /> : null}
      {view === 'calendar' ? <LeaveCalendar /> : null}
      {view === 'types' ? <LeaveTypes /> : null}
    </HrmsShell>
  );
}

export function TenantPayrollPage() {
  const [view, setView] = useState('dashboard');
  return (
    <HrmsShell title="Payroll" description="Payroll cycles, generation, approvals, payslips, components, loans, reimbursements, bank transfers, and statutory settings." tabs={payrollTabs} activeTab={view} onTabChange={setView}>
      {view === 'dashboard' ? <PayrollDashboard /> : null}
      {view === 'cycles' ? <PayrollCycles /> : null}
      {view === 'history' ? <PayrollHistory /> : null}
      {view === 'payslips' ? <Payslips /> : null}
      {view === 'components' ? <PayrollComponents /> : null}
      {view === 'assignments' ? <PayrollAssignments /> : null}
      {view === 'loans' ? <PayrollLoans /> : null}
      {view === 'reimbursements' ? <PayrollReimbursements /> : null}
      {view === 'bank' ? <PayrollBankTransfers /> : null}
      {view === 'settings' ? <PayrollSettings /> : null}
    </HrmsShell>
  );
}

export function TenantHolidaysPage() {
  const [view, setView] = useState('holidays');
  return (
    <HrmsShell title="Holidays" description="Holiday calendar, list, calendars, groups, group members, applicability, imports, and exports." tabs={holidayTabs} activeTab={view} onTabChange={setView}>
      {view === 'holidays' ? <HolidayList /> : null}
      {view === 'calendar' ? <HolidayCalendarView /> : null}
      {view === 'calendars' ? <HolidayCalendars /> : null}
      {view === 'groups' ? <HolidayGroups /> : null}
    </HrmsShell>
  );
}

function HrmsShell({ title, description, tabs, activeTab, onTabChange, children }: { title: string; description: string; tabs: { id: string; label: string }[]; activeTab: string; onTabChange: (tab: string) => void; children: ReactNode }) {
  return (
    <section className="enterprise-module-page">
      <PageHeader title={title} description={description} tabs={<Tabs tabs={tabs} activeId={activeTab} onChange={onTabChange} ariaLabel={`${title} sections`} />} />
      {children}
    </section>
  );
}

function AttendanceDashboard() {
  const [modal, setModal] = useState<ModalState>(null);
  const query = useQuery({ queryKey: tenantQueryKeys.resource(tenantKey, 'attendance-dashboard'), queryFn: tenantHrmsApi.attendance.dashboard });
  const dashboard = query.data?.data.dashboard ?? {};
  return (
    <>
      <SectionActions>
        <Button type="button" onClick={() => setModal('checkIn')}><CheckCircle2 size={16} aria-hidden />Check In</Button>
        <Button type="button" variant="secondary" onClick={() => setModal('checkOut')}><XCircle size={16} aria-hidden />Check Out</Button>
        <Button type="button" variant="secondary" onClick={() => setModal('correction')}><Pencil size={16} aria-hidden />Correction</Button>
      </SectionActions>
      <DashboardBlocks dashboard={dashboard} loading={query.isLoading} />
      <AttendanceActionModal action={modal} onClose={() => setModal(null)} />
    </>
  );
}

function AttendanceDaily() {
  const query = usePagedQuery('attendance-daily', tenantHrmsApi.attendance.daily);
  const [selected, setSelected] = useState<HrmsRecord | null>(null);
  const [modal, setModal] = useState<ModalState>(null);
  return (
    <>
      <SectionActions>
        <Button type="button" onClick={() => setModal('checkIn')}><CheckCircle2 size={16} aria-hidden />Check In</Button>
        <Button type="button" variant="secondary" onClick={() => setModal('checkOut')}><XCircle size={16} aria-hidden />Check Out</Button>
        <Button type="button" variant="secondary" onClick={() => setModal('attendanceImport')}><Upload size={16} aria-hidden />Import</Button>
        <Button type="button" variant="secondary" onClick={() => setModal('attendanceExport')}><Download size={16} aria-hidden />Export</Button>
      </SectionActions>
      <DataTable columns={[...columns(['staff_name', 'employee_code', 'attendance_date', 'check_in_at', 'check_out_at', 'total_minutes', 'status_name']), actionColumn((row) => <RowMenu items={[['Correction', () => { setSelected(row); setModal('correction'); }], ['View detail', () => { setSelected(row); setModal('payrollPreview'); }]]} />)]} data={query.rows} getRowId={idOf} loading={query.isLoading} error={query.error} searchValue={query.search} onSearchChange={query.setSearch} page={query.page} perPage={25} total={query.total} onPageChange={query.setPage} />
      <AttendanceActionModal action={modal} record={selected} onClose={() => setModal(null)} />
      <RecordDrawer open={modal === 'payrollPreview'} title="Attendance Record" record={selected} onClose={() => setModal(null)} />
    </>
  );
}

function AttendanceMonthly() {
  const [modal, setModal] = useState<ModalState>(null);
  const query = useQuery({ queryKey: tenantQueryKeys.resource(tenantKey, 'attendance-monthly'), queryFn: () => tenantHrmsApi.attendance.monthly({}) });
  const rows = asRows(query.data?.data.grid);
  return (
    <>
      <SectionActions>
        <Button type="button" onClick={() => setModal('bulkAttendance')}>Bulk Update</Button>
        <Button type="button" variant="secondary" onClick={() => setModal('attendanceExport')}><Download size={16} aria-hidden />Export Monthly</Button>
      </SectionActions>
      <DataTable columns={columns(['staff_name', 'employee_code', 'present_days', 'total_minutes'])} data={rows} getRowId={idOf} loading={query.isLoading} />
      <AttendanceActionModal action={modal} onClose={() => setModal(null)} />
    </>
  );
}

function AttendanceRequests() {
  const query = usePagedQuery('attendance-requests', tenantHrmsApi.attendance.requests);
  const [selected, setSelected] = useState<HrmsRecord | null>(null);
  const [modal, setModal] = useState<ModalState>(null);
  return (
    <>
      <SectionActions>
        <Button type="button" onClick={() => setModal('correction')}><Plus size={16} aria-hidden />Request Correction</Button>
      </SectionActions>
      <DataTable columns={[...columns(['staff_name', 'employee_code', 'request_date', 'request_type', 'reason', 'status']), actionColumn((row) => <RowMenu items={[['Approve', () => { setSelected(row); setModal('approveCorrection'); }], ['Reject', () => { setSelected(row); setModal('rejectCorrection'); }], ['Detail', () => { setSelected(row); setModal('payrollPreview'); }]]} />)]} data={query.rows} getRowId={idOf} loading={query.isLoading} error={query.error} searchValue={query.search} onSearchChange={query.setSearch} page={query.page} perPage={25} total={query.total} onPageChange={query.setPage} />
      <AttendanceActionModal action={modal} record={selected} onClose={() => setModal(null)} />
      <RecordDrawer open={modal === 'payrollPreview'} title="Correction Request" record={selected} onClose={() => setModal(null)} />
    </>
  );
}

function LeaveDashboard() {
  const [modal, setModal] = useState<ModalState>(null);
  const query = useQuery({ queryKey: tenantQueryKeys.resource(tenantKey, 'leave-dashboard'), queryFn: tenantHrmsApi.leave.dashboard });
  return (
    <>
      <SectionActions>
        <Button type="button" onClick={() => setModal('applyLeave')}><CalendarPlus size={16} aria-hidden />Apply Leave</Button>
        <Button type="button" variant="secondary" onClick={() => setModal('adjustBalance')}>Adjust Balance</Button>
      </SectionActions>
      <DashboardBlocks dashboard={query.data?.data.dashboard ?? {}} loading={query.isLoading} />
      <LeaveActionModal action={modal} onClose={() => setModal(null)} />
    </>
  );
}

function LeaveRequests() {
  const query = usePagedQuery('leave-requests', tenantHrmsApi.leave.requests);
  const [selected, setSelected] = useState<HrmsRecord | null>(null);
  const [modal, setModal] = useState<ModalState>(null);
  return (
    <>
      <SectionActions><Button type="button" onClick={() => setModal('applyLeave')}><Plus size={16} aria-hidden />Apply Leave</Button></SectionActions>
      <DataTable columns={[...columns(['staff_name', 'employee_code', 'leave_type_name', 'start_date', 'end_date', 'total_days', 'status_name']), actionColumn((row) => <RowMenu items={[['Approve', () => { setSelected(row); setModal('approveLeave'); }], ['Reject', () => { setSelected(row); setModal('rejectLeave'); }], ['Cancel', () => { setSelected(row); setModal('cancelLeave'); }]]} />)]} data={query.rows} getRowId={idOf} loading={query.isLoading} error={query.error} searchValue={query.search} onSearchChange={query.setSearch} page={query.page} perPage={25} total={query.total} onPageChange={query.setPage} />
      <LeaveActionModal action={modal} record={selected} onClose={() => setModal(null)} />
    </>
  );
}

function LeaveBalances() {
  const query = usePagedQuery('leave-balances', tenantHrmsApi.leave.balances);
  const [modal, setModal] = useState<ModalState>(null);
  return (
    <>
      <SectionActions><Button type="button" onClick={() => setModal('adjustBalance')}>Adjust Balance</Button></SectionActions>
      <DataTable columns={columns(['staff_name', 'employee_code', 'leave_type_name', 'year', 'opening_balance', 'accrued', 'used', 'remaining'])} data={query.rows} getRowId={idOf} loading={query.isLoading} error={query.error} searchValue={query.search} onSearchChange={query.setSearch} page={query.page} perPage={25} total={query.total} onPageChange={query.setPage} />
      <LeaveActionModal action={modal} onClose={() => setModal(null)} />
    </>
  );
}

function LeaveCalendar() {
  const query = useQuery({ queryKey: tenantQueryKeys.resource(tenantKey, 'leave-calendar'), queryFn: tenantHrmsApi.leave.calendar });
  return <CalendarList rows={query.data?.data.events ?? []} dateKey="start_date" titleKey="staff_name" />;
}

function LeaveTypes() {
  const query = useQuery({ queryKey: tenantQueryKeys.resource(tenantKey, 'leave-types'), queryFn: tenantHrmsApi.leave.types });
  const [modal, setModal] = useState<ModalState>(null);
  return (
    <>
      <SectionActions><Button type="button" onClick={() => setModal('applyLeave')}><Plus size={16} aria-hidden />Leave Type</Button></SectionActions>
      <DataTable columns={columns(['name', 'code', 'paid', 'carry_forward', 'status'])} data={query.data?.data.leave_types ?? []} getRowId={idOf} loading={query.isLoading} />
      <LeaveTypeModal open={modal === 'applyLeave'} onClose={() => setModal(null)} />
    </>
  );
}

function PayrollDashboard() {
  const query = useQuery({ queryKey: tenantQueryKeys.resource(tenantKey, 'payroll-dashboard'), queryFn: tenantHrmsApi.payroll.dashboard });
  const [modal, setModal] = useState<ModalState>(null);
  return (
    <>
      <SectionActions>
        <PermissionButton guard="tenant" permission="payroll.generate" type="button" onClick={() => setModal('cycle')}><Plus size={16} aria-hidden />Cycle</PermissionButton>
        <PermissionButton guard="tenant" permission="payroll.generate" type="button" variant="secondary" onClick={() => setModal('generatePayroll')}><RefreshCw size={16} aria-hidden />Generate</PermissionButton>
      </SectionActions>
      <DashboardBlocks dashboard={query.data?.data.dashboard ?? {}} loading={query.isLoading} />
      <PayrollActionModal action={modal} onClose={() => setModal(null)} />
    </>
  );
}

function PayrollCycles() {
  const query = usePagedQuery('payroll-cycles', tenantHrmsApi.payroll.cycles);
  const [selected, setSelected] = useState<HrmsRecord | null>(null);
  const [modal, setModal] = useState<ModalState>(null);
  return (
    <>
      <SectionActions><Button type="button" onClick={() => setModal('cycle')}><Plus size={16} aria-hidden />Cycle</Button></SectionActions>
      <DataTable columns={[...columns(['cycle_name', 'payroll_month', 'payroll_year', 'period_start', 'period_end', 'payment_date', 'status']), actionColumn((row) => <RowMenu items={[['Generate preview', () => { setSelected(row); setModal('payrollPreview'); }], ['Generate payroll', () => { setSelected(row); setModal('generatePayroll'); }], ['Submit', () => { setSelected(row); setModal('submitPayroll'); }], ['Approve', () => { setSelected(row); setModal('approvePayroll'); }], ['Lock', () => { setSelected(row); setModal('lockPayroll'); }], ['Reopen', () => { setSelected(row); setModal('reopenPayroll'); }]]} />)]} data={query.rows} getRowId={idOf} loading={query.isLoading} error={query.error} searchValue={query.search} onSearchChange={query.setSearch} page={query.page} perPage={25} total={query.total} onPageChange={query.setPage} />
      <PayrollActionModal action={modal} record={selected} onClose={() => setModal(null)} />
    </>
  );
}

function PayrollHistory() {
  const query = usePagedQuery('payroll-history', tenantHrmsApi.payroll.payrolls);
  const [selected, setSelected] = useState<HrmsRecord | null>(null);
  return (
    <>
      <DataTable columns={[...columns(['staff_name', 'employee_code', 'cycle_name', 'gross_salary', 'total_deductions', 'net_salary', 'payment_status']), actionColumn((row) => <RowMenu items={[['Preview', () => setSelected(row)]]} />)]} data={query.rows} getRowId={idOf} loading={query.isLoading} error={query.error} searchValue={query.search} onSearchChange={query.setSearch} page={query.page} perPage={25} total={query.total} onPageChange={query.setPage} />
      <RecordDrawer open={Boolean(selected)} title="Payroll Preview" record={selected} onClose={() => setSelected(null)} />
    </>
  );
}

function Payslips() {
  const query = usePagedQuery('payslips', tenantHrmsApi.payroll.payslips);
  const [selected, setSelected] = useState<HrmsRecord | null>(null);
  const [modal, setModal] = useState<ModalState>(null);
  return (
    <>
      <SectionActions>
        <Button type="button" onClick={() => setModal('payslipPreview')}><Plus size={16} aria-hidden />Generate</Button>
        <Button type="button" variant="secondary" onClick={() => setModal('emailPayslips')}><Mail size={16} aria-hidden />Bulk Email</Button>
      </SectionActions>
      <DataTable columns={[...columns(['payslip_number', 'staff_name', 'employee_code', 'generated_at', 'emailed_at']), actionColumn((row) => <RowMenu items={[['Preview', () => setSelected(row)]]} />)]} data={query.rows} getRowId={idOf} loading={query.isLoading} error={query.error} searchValue={query.search} onSearchChange={query.setSearch} page={query.page} perPage={25} total={query.total} onPageChange={query.setPage} />
      <PayrollActionModal action={modal} onClose={() => setModal(null)} />
      <RecordDrawer open={Boolean(selected)} title="Payslip Preview" record={selected} onClose={() => setSelected(null)} />
    </>
  );
}

function PayrollComponents() {
  const query = useQuery({ queryKey: tenantQueryKeys.resource(tenantKey, 'payroll-components'), queryFn: tenantHrmsApi.payroll.components });
  const [selected, setSelected] = useState<HrmsRecord | null>(null);
  const [modal, setModal] = useState<ModalState>(null);
  return (
    <>
      <SectionActions><Button type="button" onClick={() => setModal('component')}><Plus size={16} aria-hidden />Component</Button></SectionActions>
      <DataTable columns={[...columns(['name', 'code', 'calculation_method', 'default_value', 'formula', 'taxable', 'status']), actionColumn((row) => <RowMenu items={[['Formula editor', () => { setSelected(row); setModal('component'); }]]} />)]} data={query.data?.data.components ?? []} getRowId={idOf} loading={query.isLoading} />
      <PayrollActionModal action={modal} record={selected} onClose={() => { setSelected(null); setModal(null); }} />
    </>
  );
}

function PayrollAssignments() { return <SimplePayrollPanel title="Component Assignments" queryKey="payroll-assignments" queryFn={tenantHrmsApi.payroll.assignments} dataKey="assignments" action="assignment" columnsList={['staff_id', 'component_id', 'amount', 'effective_from', 'effective_to']} />; }
function PayrollLoans() { return <SimplePayrollPanel title="Loans" queryKey="payroll-loans" queryFn={tenantHrmsApi.payroll.loans} dataKey="loans" action="loan" columnsList={['staff_id', 'loan_number', 'principal_amount', 'installment_amount', 'remaining_amount', 'status']} />; }
function PayrollReimbursements() { return <SimplePayrollPanel title="Reimbursements" queryKey="payroll-reimbursements" queryFn={tenantHrmsApi.payroll.reimbursements} dataKey="reimbursements" action="reimbursement" columnsList={['staff_id', 'amount', 'approval_status']} />; }
function PayrollBankTransfers() { return <SimplePayrollPanel title="Bank Transfers" queryKey="payroll-bank-transfers" queryFn={tenantHrmsApi.payroll.bankTransfers} dataKey="bank_transfers" action="bankTransfer" columnsList={['payroll_id', 'reference', 'amount', 'transfer_date', 'status']} />; }

function SimplePayrollPanel({ title, queryKey, queryFn, dataKey, action, columnsList }: { title: string; queryKey: string; queryFn: () => Promise<{ data: Record<string, HrmsRecord[]> }>; dataKey: string; action: ModalState; columnsList: string[] }) {
  const query = useQuery({ queryKey: tenantQueryKeys.resource(tenantKey, queryKey), queryFn });
  const [modal, setModal] = useState<ModalState>(null);
  return (
    <>
      <SectionActions><Button type="button" onClick={() => setModal(action)}><Plus size={16} aria-hidden />{title}</Button></SectionActions>
      <DataTable columns={columns(columnsList)} data={query.data?.data[dataKey] ?? []} getRowId={idOf} loading={query.isLoading} />
      <PayrollActionModal action={modal} onClose={() => setModal(null)} />
    </>
  );
}

function PayrollSettings() {
  const [modal, setModal] = useState<ModalState>(null);
  const pf = useQuery({ queryKey: tenantQueryKeys.resource(tenantKey, 'pf-settings'), queryFn: tenantHrmsApi.payroll.pfSettings });
  const esi = useQuery({ queryKey: tenantQueryKeys.resource(tenantKey, 'esi-settings'), queryFn: tenantHrmsApi.payroll.esiSettings });
  const slabs = useQuery({ queryKey: tenantQueryKeys.resource(tenantKey, 'tax-slabs'), queryFn: tenantHrmsApi.payroll.taxSlabs });
  return (
    <>
      <SectionActions><Button type="button" onClick={() => setModal('taxSettings')}>Tax/PF/ESI Settings</Button></SectionActions>
      <div className="settings-grid">
        <RecordList title="PF Settings" rows={asRows(pf.data?.data.pf_settings)} />
        <RecordList title="ESI Settings" rows={asRows(esi.data?.data.esi_settings)} />
        <RecordList title="Tax Slabs" rows={slabs.data?.data.tax_slabs ?? []} />
      </div>
      <PayrollActionModal action={modal} onClose={() => setModal(null)} />
    </>
  );
}

function HolidayList() {
  const query = usePagedQuery('holidays', tenantHrmsApi.holidays.list);
  const [selected, setSelected] = useState<HrmsRecord | null>(null);
  const [modal, setModal] = useState<ModalState>(null);
  return (
    <>
      <SectionActions>
        <Button type="button" onClick={() => setModal('holiday')}><Plus size={16} aria-hidden />Holiday</Button>
        <Button type="button" variant="secondary" onClick={() => setModal('holidayImport')}><Upload size={16} aria-hidden />Import</Button>
        <Button type="button" variant="secondary" onClick={() => setModal('holidayExport')}><Download size={16} aria-hidden />Export</Button>
      </SectionActions>
      <DataTable columns={[...columns(['name', 'calendar_name', 'holiday_date', 'total_days', 'optional_holiday', 'applicable_to_all']), actionColumn((row) => <RowMenu items={[['Edit', () => { setSelected(row); setModal('holiday'); }], ['Applicability', () => { setSelected(row); setModal('holidayApplicability'); }], ['Duplicate next year', () => { setSelected(row); setModal('duplicateHoliday'); }], ['View', () => { setSelected(row); setModal('payslipPreview'); }]]} />)]} data={query.rows} getRowId={idOf} loading={query.isLoading} error={query.error} searchValue={query.search} onSearchChange={query.setSearch} page={query.page} perPage={25} total={query.total} onPageChange={query.setPage} />
      <HolidayActionModal action={modal} record={selected} onClose={() => { setSelected(null); setModal(null); }} />
      <RecordDrawer open={modal === 'payslipPreview'} title="Holiday Detail" record={selected} onClose={() => setModal(null)} />
    </>
  );
}

function HolidayCalendarView() {
  const query = usePagedQuery('holidays-calendar', tenantHrmsApi.holidays.list);
  return <CalendarList rows={query.rows} dateKey="holiday_date" titleKey="name" />;
}

function HolidayCalendars() {
  const query = useQuery({ queryKey: tenantQueryKeys.resource(tenantKey, 'holiday-calendars'), queryFn: tenantHrmsApi.holidays.calendars });
  const [modal, setModal] = useState<ModalState>(null);
  return (
    <>
      <SectionActions><Button type="button" onClick={() => setModal('calendar')}><Plus size={16} aria-hidden />Calendar</Button></SectionActions>
      <DataTable columns={columns(['name', 'description', 'is_default', 'status'])} data={query.data?.data.calendars ?? []} getRowId={idOf} loading={query.isLoading} />
      <HolidayActionModal action={modal} onClose={() => setModal(null)} />
    </>
  );
}

function HolidayGroups() {
  const query = useQuery({ queryKey: tenantQueryKeys.resource(tenantKey, 'holiday-groups'), queryFn: tenantHrmsApi.holidays.groups });
  const [selected, setSelected] = useState<HrmsRecord | null>(null);
  const [modal, setModal] = useState<ModalState>(null);
  return (
    <>
      <SectionActions><Button type="button" onClick={() => setModal('group')}><Plus size={16} aria-hidden />Group</Button></SectionActions>
      <DataTable columns={[...columns(['name', 'description', 'status']), actionColumn((row) => <RowMenu items={[['Edit', () => { setSelected(row); setModal('group'); }], ['Members', () => { setSelected(row); setModal('groupMembers'); }]]} />)]} data={query.data?.data.groups ?? []} getRowId={idOf} loading={query.isLoading} />
      <HolidayActionModal action={modal} record={selected} onClose={() => { setSelected(null); setModal(null); }} />
    </>
  );
}

function AttendanceActionModal({ action, record, onClose }: { action: ModalState; record?: HrmsRecord | null; onClose: () => void }) {
  const mutation = useActionMutation('attendance', action, record, onClose);
  if (!action || !['checkIn', 'checkOut', 'correction', 'approveCorrection', 'rejectCorrection', 'bulkAttendance', 'attendanceImport', 'attendanceExport'].includes(action)) return null;
  const confirm = hrmsConfirmSpec(action, record);
  if (confirm) {
    return <ConfirmDialog open title={confirm.title} description={confirm.description} confirmLabel={confirm.label} confirmTone={confirm.tone} typedConfirmation={confirm.typed} reasonRequired={confirm.reasonRequired} guard="tenant" loading={mutation.isPending} error={mutation.error instanceof ApiError ? mutation.error.message : undefined} onClose={onClose} onConfirm={(payload) => mutation.mutate(payload)} />;
  }
  return (
    <AppModal open title={modalTitle(action)} onClose={onClose} guard="tenant" size="md" error={mutation.error instanceof ApiError ? mutation.error.message : undefined}>
      <HrmsDynamicForm action={action} record={record} onSubmit={(body) => mutation.mutate(body)} loading={mutation.isPending} />
    </AppModal>
  );
}

function LeaveActionModal({ action, record, onClose }: { action: ModalState; record?: HrmsRecord | null; onClose: () => void }) {
  const mutation = useActionMutation('leave', action, record, onClose);
  if (!action || !['applyLeave', 'approveLeave', 'rejectLeave', 'cancelLeave', 'adjustBalance'].includes(action)) return null;
  const confirm = hrmsConfirmSpec(action, record);
  if (confirm) {
    return <ConfirmDialog open title={confirm.title} description={confirm.description} confirmLabel={confirm.label} confirmTone={confirm.tone} typedConfirmation={confirm.typed} reasonRequired={confirm.reasonRequired} guard="tenant" loading={mutation.isPending} error={mutation.error instanceof ApiError ? mutation.error.message : undefined} onClose={onClose} onConfirm={(payload) => mutation.mutate(payload)} />;
  }
  return (
    <AppDrawer open title={modalTitle(action)} onClose={onClose} guard="tenant" size="lg" error={mutation.error instanceof ApiError ? mutation.error.message : undefined}>
      <><BalancePreview /><HrmsDynamicForm action={action} record={record} onSubmit={(body) => mutation.mutate(body)} loading={mutation.isPending} /></>
    </AppDrawer>
  );
}

function LeaveTypeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const mutation = useMutation({ mutationFn: tenantHrmsApi.leave.createType, onSuccess: () => { onClose(); } });
  return (
    <AppModal open={open} title="Leave Type" onClose={onClose} guard="tenant" permission="setting.edit" error={mutation.error instanceof ApiError ? mutation.error.message : undefined}>
      <HrmsDynamicForm action="group" fields={['name', 'code', 'paid', 'carry_forward', 'status']} onSubmit={(body) => mutation.mutate(body)} loading={mutation.isPending} />
    </AppModal>
  );
}

function PayrollActionModal({ action, record, onClose }: { action: ModalState; record?: HrmsRecord | null; onClose: () => void }) {
  const mutation = useActionMutation('payroll', action, record, onClose);
  if (!action || !['cycle', 'generatePayroll', 'payrollPreview', 'submitPayroll', 'approvePayroll', 'lockPayroll', 'reopenPayroll', 'payslipPreview', 'emailPayslips', 'component', 'assignment', 'loan', 'reimbursement', 'bankTransfer', 'taxSettings'].includes(action)) return null;
  const confirm = hrmsConfirmSpec(action, record);
  if (confirm) {
    return <ConfirmDialog open title={confirm.title} description={confirm.description} confirmLabel={confirm.label} confirmTone={confirm.tone} typedConfirmation={confirm.typed} reasonRequired={confirm.reasonRequired} guard="tenant" loading={mutation.isPending} error={mutation.error instanceof ApiError ? mutation.error.message : undefined} onClose={onClose} onConfirm={(payload) => mutation.mutate(payload)} />;
  }
  return (
    <AppModal open title={modalTitle(action)} onClose={onClose} guard="tenant" size="lg" error={mutation.error instanceof ApiError ? mutation.error.message : undefined}>
      {action === 'payrollPreview' ? <PayrollPreviewDrawerContent cycle={record} onGenerate={(body) => mutation.mutate(body)} loading={mutation.isPending} /> : <HrmsDynamicForm action={action} record={record} onSubmit={(body) => mutation.mutate(body)} loading={mutation.isPending} />}
    </AppModal>
  );
}

function HolidayActionModal({ action, record, onClose }: { action: ModalState; record?: HrmsRecord | null; onClose: () => void }) {
  const mutation = useActionMutation('holidays', action, record, onClose);
  if (!action || !['holiday', 'holidayApplicability', 'duplicateHoliday', 'holidayImport', 'holidayExport', 'calendar', 'group', 'groupMembers'].includes(action)) return null;
  const confirm = ['duplicateHoliday', 'holidayExport'].includes(action);
  return (
    <AppDrawer open title={modalTitle(action)} onClose={onClose} guard="tenant" size="lg" error={mutation.error instanceof ApiError ? mutation.error.message : undefined} footer={confirm ? <ModalFooter onClose={onClose} onSubmit={() => mutation.mutate({})} loading={mutation.isPending} submitLabel="Confirm" /> : undefined}>
      {confirm ? <p className="surface-state">{confirmText(action, record)}</p> : <HrmsDynamicForm action={action} record={record} onSubmit={(body) => mutation.mutate(body)} loading={mutation.isPending} />}
    </AppDrawer>
  );
}

function HrmsDynamicForm({ action, record, fields, onSubmit, loading }: { action: ModalState; record?: HrmsRecord | null; fields?: string[]; onSubmit: (body: Record<string, unknown>) => void; loading?: boolean }) {
  const selectors = useHrmsSelectors();
  const formFields = fields ?? fieldsFor(action);
  const [form, setForm] = useState<Record<string, string>>(() => Object.fromEntries(formFields.map((field) => [field, stringValue(record?.[field])])));
  const overlapWarning = action === 'applyLeave' && form.start_date && form.end_date ? 'Balance and overlap will be validated before saving.' : null;
  return (
    <form className="enterprise-form" onSubmit={(event) => { event.preventDefault(); onSubmit(cleanBody(form)); }}>
      {overlapWarning ? <div className="surface-warning">{overlapWarning}</div> : null}
      <div className="form-grid">
        {formFields.map((field) => (
          <label className="form-field" key={field}>
            <span>{label(field)}</span>
            {selectOptions(field, selectors) ? (
              <select value={form[field] ?? ''} onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))}>
                <option value="">Select {label(field)}</option>
                {selectOptions(field, selectors)?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            ) : inputType(field) === 'checkbox' ? (
              <input type="checkbox" checked={form[field] === 'true'} onChange={(event) => setForm((current) => ({ ...current, [field]: String(event.target.checked) }))} />
            ) : field.includes('remarks') || field.includes('reason') || field === 'formula' || field === 'description' || field === 'applicabilities' ? (
              <textarea value={form[field] ?? ''} onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))} />
            ) : (
              <input type={inputType(field)} value={form[field] ?? ''} onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))} />
            )}
          </label>
        ))}
      </div>
      <div className="surface-footer">
        <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
      </div>
    </form>
  );
}

function useActionMutation(scope: 'attendance' | 'leave' | 'payroll' | 'holidays', action: ModalState, record: HrmsRecord | null | undefined, onClose: () => void) {
  const queryClient = useQueryClient();
  return useMutation<unknown, Error, Record<string, unknown>>({
    mutationFn: (body: Record<string, unknown>) => runAction(scope, action, record, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenantQueryKeys.all(tenantKey) });
      onClose();
    }
  });
}

function runAction(scope: 'attendance' | 'leave' | 'payroll' | 'holidays', action: ModalState, record: HrmsRecord | null | undefined, body: Record<string, unknown>) {
  const id = String(record?.uuid ?? record?.id ?? body.id ?? '');
  if (scope === 'attendance') {
    if (action === 'checkIn') return tenantHrmsApi.attendance.checkIn(body);
    if (action === 'checkOut') return tenantHrmsApi.attendance.checkOut(body);
    if (action === 'correction') return tenantHrmsApi.attendance.createRequest(body);
    if (action === 'approveCorrection') return tenantHrmsApi.attendance.approveRequest(id, body);
    if (action === 'rejectCorrection') return tenantHrmsApi.attendance.rejectRequest(id, body);
    if (action === 'bulkAttendance') return tenantHrmsApi.attendance.createRecord(body);
    if (action === 'attendanceImport') return tenantHrmsApi.attendance.import(body);
    if (action === 'attendanceExport') return tenantHrmsApi.attendance.export(body);
  }
  if (scope === 'leave') {
    if (action === 'applyLeave') return tenantHrmsApi.leave.apply(body);
    if (action === 'approveLeave') return tenantHrmsApi.leave.approve(id, body);
    if (action === 'rejectLeave') return tenantHrmsApi.leave.reject(id, body);
    if (action === 'cancelLeave') return tenantHrmsApi.leave.cancel(id, body);
    if (action === 'adjustBalance') return tenantHrmsApi.leave.adjustBalance(body);
  }
  if (scope === 'payroll') {
    if (action === 'cycle') return record?.uuid ? tenantHrmsApi.payroll.updateCycle(String(record.uuid), body) : tenantHrmsApi.payroll.createCycle(body);
    if (action === 'generatePayroll') return tenantHrmsApi.payroll.generate(id || String(body.cycle_uuid), body);
    if (action === 'payrollPreview') return tenantHrmsApi.payroll.preview(id || String(body.cycle_uuid), body);
    if (action === 'submitPayroll') return tenantHrmsApi.payroll.cycleAction(id, 'submit', body);
    if (action === 'approvePayroll') return tenantHrmsApi.payroll.cycleAction(id, 'approve', body);
    if (action === 'lockPayroll') return tenantHrmsApi.payroll.cycleAction(id, 'lock', body);
    if (action === 'reopenPayroll') return tenantHrmsApi.payroll.cycleAction(id, 'reopen', body);
    if (action === 'payslipPreview') return tenantHrmsApi.payroll.generatePayslips(body);
    if (action === 'emailPayslips') return tenantHrmsApi.payroll.emailPayslips(body);
    if (action === 'component') return record?.id ? tenantHrmsApi.payroll.updateComponent(String(record.id), body) : tenantHrmsApi.payroll.createComponent(body);
    if (action === 'assignment') return tenantHrmsApi.payroll.createAssignment(body);
    if (action === 'loan') return tenantHrmsApi.payroll.createLoan(body);
    if (action === 'reimbursement') return tenantHrmsApi.payroll.createReimbursement(body);
    if (action === 'bankTransfer') return tenantHrmsApi.payroll.createBankTransfer(body);
    if (action === 'taxSettings') return tenantHrmsApi.payroll.updatePfSettings(body);
  }
  if (scope === 'holidays') {
    if (action === 'holiday') return record?.uuid ? tenantHrmsApi.holidays.update(String(record.uuid), body) : tenantHrmsApi.holidays.create(body);
    if (action === 'holidayApplicability') return tenantHrmsApi.holidays.update(id, body);
    if (action === 'duplicateHoliday') return tenantHrmsApi.holidays.duplicateNextYear(id);
    if (action === 'holidayImport') return tenantHrmsApi.holidays.import(body);
    if (action === 'holidayExport') return tenantHrmsApi.holidays.export(body);
    if (action === 'calendar') return tenantHrmsApi.holidays.createCalendar(body);
    if (action === 'group') return record?.uuid ? tenantHrmsApi.holidays.updateGroup(String(record.uuid), body) : tenantHrmsApi.holidays.createGroup(body);
    if (action === 'groupMembers') return tenantHrmsApi.holidays.addMembers(id, body);
  }
  return Promise.resolve();
}

function usePagedQuery(key: string, fn: (query?: ApiQuery) => Promise<{ data: HrmsRecord[]; total: number }>) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const query = useQuery({ queryKey: tenantQueryKeys.list(tenantKey, key, { page, search }), queryFn: () => fn({ page, per_page: 25, search }) });
  return { rows: query.data?.data ?? [], total: query.data?.total ?? 0, isLoading: query.isLoading, error: query.error instanceof ApiError ? query.error.message : undefined, page, setPage, search, setSearch };
}

function useHrmsSelectors() {
  const staff = useQuery({ queryKey: tenantQueryKeys.resource(tenantKey, 'hrms-selector-staff'), queryFn: () => tenantHrmsApi.selectors.staff({ per_page: 100 }) });
  const leaveTypes = useQuery({ queryKey: tenantQueryKeys.resource(tenantKey, 'hrms-selector-leave-types'), queryFn: tenantHrmsApi.selectors.leaveTypes });
  const calendars = useQuery({ queryKey: tenantQueryKeys.resource(tenantKey, 'hrms-selector-calendars'), queryFn: tenantHrmsApi.selectors.holidayCalendars });
  const cycles = useQuery({ queryKey: tenantQueryKeys.resource(tenantKey, 'hrms-selector-cycles'), queryFn: tenantHrmsApi.selectors.payrollCycles });
  const components = useQuery({ queryKey: tenantQueryKeys.resource(tenantKey, 'hrms-selector-components'), queryFn: tenantHrmsApi.selectors.payrollComponents });
  return { staff: staff.data?.data ?? [], leaveTypes: leaveTypes.data?.data.leave_types ?? [], calendars: calendars.data?.data.calendars ?? [], cycles: cycles.data?.data ?? [], components: components.data?.data.components ?? [] };
}

function selectOptions(field: string, selectors: ReturnType<typeof useHrmsSelectors>) {
  if (field === 'staff_id' || field === 'staff_ids') return selectors.staff.map((row) => ({ value: String(row.uuid ?? row.id), label: `${text(row.staff_name ?? row.display_name ?? row.name)}${row.employee_code ? ` (${row.employee_code})` : ''}` }));
  if (field === 'leave_type_id') return selectors.leaveTypes.map((row) => ({ value: String(row.uuid ?? row.id), label: text(row.name) }));
  if (field === 'holiday_calendar_id') return selectors.calendars.map((row) => ({ value: String(row.uuid ?? row.id), label: text(row.name) }));
  if (field === 'cycle_uuid') return selectors.cycles.map((row) => ({ value: String(row.uuid ?? row.id), label: text(row.cycle_name ?? row.name) }));
  if (field === 'component_id') return selectors.components.map((row) => ({ value: String(row.id), label: text(row.name) }));
  return null;
}

function DashboardBlocks({ dashboard, loading }: { dashboard: Record<string, unknown>; loading?: boolean }) {
  if (loading) return <div className="surface-state">Loading dashboard...</div>;
  const cards = Object.entries((dashboard.cards as Record<string, unknown>) ?? {});
  return (
    <>
      <div className="summary-grid">{cards.map(([key, value]) => <article className="summary-card" key={key}><span>{label(key)}</span><strong>{format(value)}</strong></article>)}</div>
      <div className="settings-grid">{Object.entries(dashboard).filter(([key]) => key !== 'cards').map(([key, value]) => <RecordList key={key} title={label(key)} rows={asRows(value)} />)}</div>
    </>
  );
}

function RecordList({ title, rows }: { title: string; rows: HrmsRecord[] }) {
  return <article className="settings-card"><header><h3>{title}</h3></header>{rows.length ? <div className="detail-list">{rows.slice(0, 8).map((row) => <div key={idOf(row)}><strong>{recordTitle(row)}</strong><span>{recordSubtitle(row)}</span></div>)}</div> : <p className="surface-state">No records found.</p>}</article>;
}

function RecordDrawer({ open, title, record, onClose }: { open: boolean; title: string; record?: HrmsRecord | null; onClose: () => void }) {
  return <AppDrawer open={open} title={title} onClose={onClose} guard="tenant" size="lg"><DetailGrid record={record ?? {}} /></AppDrawer>;
}

function PayrollPreviewDrawerContent({ cycle, onGenerate, loading }: { cycle?: HrmsRecord | null; onGenerate: (body: Record<string, unknown>) => void; loading?: boolean }) {
  return (
    <>
      <p className="surface-state">Preview validates salary structures, attendance, leave, reimbursements, and loan deductions before generation.</p>
      <HrmsDynamicForm action="generatePayroll" record={cycle} fields={['cycle_uuid', 'salary_effective_date', 'include_overtime', 'include_reimbursements', 'include_loan_deductions', 'attendance_source', 'leave_source']} onSubmit={onGenerate} loading={loading} />
    </>
  );
}

function BalancePreview() {
  return <div className="surface-warning">Leave balance preview uses live balances after you select staff and leave type. Overlapping requests are blocked by the API.</div>;
}

function CalendarList({ rows, dateKey, titleKey }: { rows: HrmsRecord[]; dateKey: string; titleKey: string }) {
  const grouped = useMemo(() => rows.reduce<Record<string, HrmsRecord[]>>((acc, row) => {
    const key = String(row[dateKey] ?? 'No date');
    acc[key] = [...(acc[key] ?? []), row];
    return acc;
  }, {}), [dateKey, rows]);
  return <div className="settings-grid">{Object.entries(grouped).map(([date, items]) => <article className="settings-card" key={date}><header><h3>{date}</h3></header><div className="detail-list">{items.map((row) => <div key={idOf(row)}><strong>{text(row[titleKey])}</strong><span>{recordSubtitle(row)}</span></div>)}</div></article>)}</div>;
}

function SectionActions({ children }: { children: ReactNode }) {
  return <div className="page-actions" style={{ justifyContent: 'flex-end', marginBottom: 16 }}>{children}</div>;
}

function RowMenu({ items }: { items: [string, () => void][] }) {
  return (
    <details className="row-actions-menu">
      <summary aria-label="Open actions"><MoreVertical size={16} aria-hidden /></summary>
      <div className="row-actions-menu__content">{items.map(([labelText, action]) => <button type="button" key={labelText} onClick={action}>{labelText}</button>)}</div>
    </details>
  );
}

function ModalFooter({ onClose, onSubmit, loading, submitLabel }: { onClose: () => void; onSubmit: () => void; loading?: boolean; submitLabel: string }) {
  return <><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="button" onClick={onSubmit} disabled={loading}>{loading ? 'Working...' : submitLabel}</Button></>;
}

function DetailGrid({ record }: { record: HrmsRecord }) {
  const entries = Object.entries(record).filter(([, value]) => value !== null && value !== undefined && typeof value !== 'object');
  return <dl className="detail-grid">{entries.map(([key, value]) => <div key={key}><dt>{label(key)}</dt><dd>{renderValue(value)}</dd></div>)}</dl>;
}

function columns(keys: string[]): DataTableColumn<HrmsRecord>[] {
  return keys.map((key) => ({ id: key, header: label(key), accessor: (row) => primitive(row[key]), cell: (row) => key.includes('status') ? <StatusBadge tone={statusTone(row[key])}>{String(row[key] ?? 'unknown')}</StatusBadge> : renderValue(row[key]) }));
}

function actionColumn(cell: (row: HrmsRecord) => ReactNode): DataTableColumn<HrmsRecord> {
  return { id: 'actions', header: '', enableHiding: false, cell };
}

function fieldsFor(action: ModalState): string[] {
  switch (action) {
    case 'correction': return ['staff_id', 'request_date', 'request_type', 'reason'];
    case 'bulkAttendance': return ['staff_id', 'attendance_date', 'check_in_at', 'check_out_at', 'total_minutes'];
    case 'attendanceImport':
    case 'holidayImport': return ['file_id', 'mapping_preset', 'remarks'];
    case 'attendanceExport':
    case 'holidayExport': return ['date_from', 'date_to', 'format'];
    case 'applyLeave': return ['staff_id', 'leave_type_id', 'start_date', 'end_date', 'total_days', 'reason'];
    case 'adjustBalance': return ['staff_id', 'leave_type_id', 'year', 'remaining', 'remarks'];
    case 'cycle': return ['cycle_name', 'payroll_month', 'payroll_year', 'period_start', 'period_end', 'payment_date', 'status', 'remarks'];
    case 'generatePayroll': return ['cycle_uuid', 'salary_effective_date', 'include_overtime', 'include_reimbursements', 'include_loan_deductions', 'attendance_source', 'leave_source'];
    case 'component': return ['component_type_id', 'name', 'code', 'calculation_method', 'default_value', 'formula', 'taxable', 'affects_pf', 'affects_esi', 'status'];
    case 'assignment': return ['staff_id', 'component_id', 'amount', 'effective_from', 'effective_to'];
    case 'loan': return ['staff_id', 'loan_number', 'principal_amount', 'interest_rate', 'installment_amount', 'remaining_amount', 'total_installments', 'issued_date', 'status'];
    case 'reimbursement': return ['staff_id', 'amount', 'approval_status'];
    case 'bankTransfer': return ['payroll_id', 'reference', 'amount', 'transfer_date', 'status'];
    case 'taxSettings': return ['employee_rate', 'employer_rate', 'wage_limit', 'effective_from'];
    case 'holiday': return ['holiday_calendar_id', 'name', 'holiday_date', 'start_date', 'end_date', 'total_days', 'is_half_day', 'recurring_yearly', 'optional_holiday', 'applicable_to_all', 'description', 'color'];
    case 'holidayApplicability': return ['applicabilities'];
    case 'calendar': return ['name', 'description', 'is_default', 'status'];
    case 'group': return ['name', 'description', 'status'];
    case 'groupMembers': return ['staff_ids'];
    default: return ['remarks'];
  }
}

function inputType(field: string) {
  if (field.includes('date') || field.endsWith('_from') || field.endsWith('_to')) return 'date';
  if (field.includes('amount') || field.includes('days') || field.includes('year') || field.includes('month') || field.includes('rate') || field.includes('minutes') || field.includes('installments') || field === 'remaining') return 'number';
  if (field.startsWith('is_') || field.startsWith('include_') || field === 'paid' || field === 'carry_forward' || field === 'taxable' || field === 'affects_pf' || field === 'affects_esi' || field === 'recurring_yearly' || field === 'optional_holiday' || field === 'applicable_to_all') return 'checkbox';
  return 'text';
}

function cleanBody(form: Record<string, string>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(form).filter(([, value]) => value !== '').map(([key, value]) => {
    if (['true', 'false'].includes(value)) return [key, value === 'true'];
    if (key === 'applicabilities') {
      try {
        return [key, JSON.parse(value) as unknown];
      } catch {
        return [key, []];
      }
    }
    return [key, value];
  }));
}

function renderValue(value: unknown): ReactNode {
  if (value === null || value === undefined || value === '') return <span className="muted">Not set</span>;
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return format(value);
  if (Array.isArray(value)) return `${value.length} records`;
  if (typeof value === 'object') return <span>{recordTitle(value as HrmsRecord)}</span>;
  return String(value);
}

function primitive(value: unknown) {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
  return '';
}

function asRows(value: unknown): HrmsRecord[] {
  if (Array.isArray(value)) return value as HrmsRecord[];
  if (value && typeof value === 'object') return [value as HrmsRecord];
  return [];
}

function idOf(row: HrmsRecord) {
  return String(row.uuid ?? row.id ?? row.name ?? Math.random());
}

function recordTitle(row?: HrmsRecord | null) {
  return text(row?.display_name ?? row?.staff_name ?? row?.name ?? row?.cycle_name ?? row?.payslip_number ?? row?.employee_code ?? 'Record');
}

function recordSubtitle(row?: HrmsRecord | null) {
  return [row?.employee_code, row?.status, row?.status_name, row?.holiday_date, row?.start_date].filter(Boolean).map(String).join(' · ') || 'Live database record';
}

function text(value: unknown) {
  return String(value ?? '');
}

function stringValue(value: unknown) {
  return value === null || value === undefined ? '' : String(value);
}

function label(key: string) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function format(value: unknown) {
  if (typeof value === 'number') return Number.isInteger(value) ? value.toLocaleString() : value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return String(value ?? 0);
}

function statusTone(value: unknown): 'neutral' | 'success' | 'warning' | 'danger' | 'info' {
  const normalized = String(value ?? '').toLowerCase();
  if (['active', 'approved', 'paid', 'present', 'generated'].includes(normalized)) return 'success';
  if (['pending', 'draft', 'submitted'].includes(normalized)) return 'warning';
  if (['rejected', 'cancelled', 'failed', 'locked'].includes(normalized)) return 'danger';
  return 'neutral';
}

function modalTitle(action: ModalState) {
  return label(String(action ?? 'Action'));
}

type HrmsConfirmSpec = {
  title: string;
  label: string;
  tone?: 'primary' | 'danger';
  typed?: string;
  reasonRequired?: boolean;
  description: ReactNode;
};

function hrmsConfirmSpec(action: ModalState, record?: HrmsRecord | null): HrmsConfirmSpec | null {
  if (!action) return null;
  const subject = record ? recordTitle(record) : 'this record';
  if (action === 'checkIn') return { title: 'Check in?', label: 'Check In', tone: 'primary', description: `Create a live attendance check-in entry for ${subject}.` };
  if (action === 'checkOut') return { title: 'Check out?', label: 'Check Out', tone: 'primary', description: `Create a live attendance check-out entry for ${subject}.` };
  if (action === 'approveCorrection') return { title: 'Approve correction?', label: 'Approve', tone: 'primary', reasonRequired: true, description: `Approve attendance correction for ${subject}.` };
  if (action === 'rejectCorrection') return { title: 'Reject correction?', label: 'Reject', tone: 'danger', reasonRequired: true, description: `Reject attendance correction for ${subject}.` };
  if (action === 'attendanceExport') return { title: 'Queue attendance export?', label: 'Queue Export', tone: 'primary', description: 'Export jobs can run in the background when the dataset is large.' };
  if (action === 'approveLeave') return { title: 'Approve leave?', label: 'Approve Leave', tone: 'primary', reasonRequired: true, description: `Approve leave request for ${subject}.` };
  if (action === 'rejectLeave') return { title: 'Reject leave?', label: 'Reject Leave', tone: 'danger', reasonRequired: true, description: `Reject leave request for ${subject}.` };
  if (action === 'cancelLeave') return { title: 'Cancel leave?', label: 'Cancel Leave', tone: 'danger', reasonRequired: true, description: `Cancel leave request for ${subject}.` };
  if (action === 'submitPayroll') return { title: 'Submit payroll?', label: 'Submit Payroll', tone: 'primary', reasonRequired: true, description: `Submit payroll cycle ${subject} for approval.` };
  if (action === 'approvePayroll') return { title: 'Approve payroll?', label: 'Approve Payroll', tone: 'primary', reasonRequired: true, description: `Approve payroll cycle ${subject}.` };
  if (action === 'lockPayroll') return { title: 'Lock payroll?', label: 'Lock Payroll', tone: 'danger', typed: 'LOCK', reasonRequired: true, description: `Lock payroll cycle ${subject}. Payslips and transfers should be verified first.` };
  if (action === 'reopenPayroll') return { title: 'Reopen payroll?', label: 'Reopen Payroll', tone: 'danger', typed: 'REOPEN', reasonRequired: true, description: `Reopen payroll cycle ${subject}. This can affect payslips and bank exports.` };
  if (action === 'emailPayslips') return { title: 'Email payslips?', label: 'Email Payslips', tone: 'primary', reasonRequired: true, description: `Queue payslip emails for ${subject}.` };
  if (action === 'payslipPreview') return { title: 'Generate payslips?', label: 'Generate Payslips', tone: 'primary', reasonRequired: true, description: `Generate payslips for ${subject}.` };
  return null;
}

function confirmText(action: ModalState, record?: HrmsRecord | null) {
  return `Confirm ${label(String(action))}${record ? ` for ${recordTitle(record)}` : ''}.`;
}

const attendanceTabs = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'daily', label: 'Daily Attendance' },
  { id: 'monthly', label: 'Monthly Grid' },
  { id: 'requests', label: 'Corrections' }
];

const leaveTabs = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'requests', label: 'Requests' },
  { id: 'balances', label: 'Balances' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'types', label: 'Leave Types' }
];

const payrollTabs = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'cycles', label: 'Cycles' },
  { id: 'history', label: 'Payroll History' },
  { id: 'payslips', label: 'Payslips' },
  { id: 'components', label: 'Components' },
  { id: 'assignments', label: 'Assignments' },
  { id: 'loans', label: 'Loans' },
  { id: 'reimbursements', label: 'Reimbursements' },
  { id: 'bank', label: 'Bank Transfers' },
  { id: 'settings', label: 'Tax/PF/ESI' }
];

const holidayTabs = [
  { id: 'holidays', label: 'List' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'calendars', label: 'Holiday Calendars' },
  { id: 'groups', label: 'Groups' }
];

export function TenantHrmsLandingLinks() {
  const { tenantSlug } = useParams();
  return (
    <div className="settings-grid">
      <Link className="settings-card" to={TENANT_ROUTES.hrms.attendance(tenantSlug)}><h3>Attendance</h3><p>Daily, monthly, corrections, approvals.</p></Link>
      <Link className="settings-card" to={TENANT_ROUTES.hrms.leave(tenantSlug)}><h3>Leave Management</h3><p>Requests, balances, calendar, leave types.</p></Link>
      <Link className="settings-card" to={TENANT_ROUTES.hrms.payroll(tenantSlug)}><h3>Payroll</h3><p>Cycles, payslips, components, loans, transfers.</p></Link>
      <Link className="settings-card" to={TENANT_ROUTES.hrms.holidays(tenantSlug)}><h3>Holidays</h3><p>Holidays, calendars, groups, applicability.</p></Link>
    </div>
  );
}
