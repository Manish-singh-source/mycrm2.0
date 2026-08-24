import { FormEvent, useEffect, useState } from 'react';
import { KeyRound, RefreshCw, Save, ShieldCheck, ShieldX } from 'lucide-react';

import { accountApi, type ApiTokenRecord } from '@/features/auth/api/accountApi';
import { ApiError } from '@/lib/api/apiError';
import { AppModal } from '@/shared/components/modal';
import { PageHeader, Tabs } from '@/shared/components/layout';
import { Button } from '@/shared/components/ui';

type ProfileTab = 'profile' | 'password' | 'preferences' | 'sessions';

export function TenantProfilePage() {
  const [activeTab, setActiveTab] = useState<ProfileTab>('profile');
  return (
    <section className="enterprise-module-page">
      <PageHeader title="My Profile" description="Manage your profile, password, preferences, and active sessions." />
      <Tabs
        tabs={[
          { id: 'profile', label: 'My Profile' },
          { id: 'password', label: 'Change Password' },
          { id: 'preferences', label: 'Preferences' },
          { id: 'sessions', label: 'Sessions' }
        ]}
        activeId={activeTab}
        ariaLabel="Profile sections"
        onChange={(id) => setActiveTab(id as ProfileTab)}
      />
      {activeTab === 'profile' ? <ProfileForm /> : null}
      {activeTab === 'password' ? <PasswordForm /> : null}
      {activeTab === 'preferences' ? <PreferencesPanel /> : null}
      {activeTab === 'sessions' ? <SessionsPanel /> : null}
    </section>
  );
}

function ProfileForm() {
  const [form, setForm] = useState<Record<string, string>>({ first_name: '', last_name: '', display_name: '', mobile: '', timezone: 'Asia/Kolkata', locale: 'en' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    accountApi.profile('tenant').then((response) => {
      const user = (response.data.user ?? response.data.account ?? response.data) as Record<string, unknown>;
      setForm({
        first_name: String(user.first_name ?? ''),
        last_name: String(user.last_name ?? ''),
        display_name: String(user.display_name ?? user.displayName ?? ''),
        mobile: String(user.mobile ?? ''),
        timezone: String(user.timezone ?? 'Asia/Kolkata'),
        locale: String(user.locale ?? 'en')
      });
    }).catch((err) => setError(errorMessage(err)));
  }, []);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      await accountApi.updateProfile('tenant', form);
      setMessage('Profile updated.');
    } catch (err) {
      setError(errorMessage(err));
    }
  }
  return <SettingsForm title="Profile" form={form} error={error} message={message} fields={['first_name', 'last_name', 'display_name', 'mobile', 'timezone', 'locale']} onChange={setForm} onSubmit={submit} />;
}

function PasswordForm() {
  const [form, setForm] = useState({ current_password: '', password: '', password_confirmation: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      await accountApi.changePassword('tenant', form);
      setForm({ current_password: '', password: '', password_confirmation: '' });
      setMessage('Password changed.');
    } catch (err) {
      setError(errorMessage(err));
    }
  }
  return <SettingsForm title="Change Password" form={form} error={error} message={message} fields={['current_password', 'password', 'password_confirmation']} passwordFields onChange={setForm} onSubmit={submit} />;
}

function PreferencesPanel() {
  const [form, setForm] = useState<Record<string, string>>({ theme: 'light', timezone: 'Asia/Kolkata', locale: 'en', date_format: 'DD MMM YYYY', table_density: 'comfortable' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    accountApi.preferences('tenant').then((response) => {
      const preferences = Array.isArray(response.data.preferences) ? response.data.preferences : [];
      setForm((current) => ({
        ...current,
        ...Object.fromEntries(preferences.map((item) => {
          const preference = item as Record<string, unknown>;
          return [String(preference.key ?? ''), preferenceValue(preference.value)];
        }).filter(([key]) => key)),
      }));
    }).catch((err) => setError(errorMessage(err)));
  }, []);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      await accountApi.updatePreferences('tenant', { preferences: { general: form } });
      setMessage('Preferences saved.');
    } catch (err) {
      setError(errorMessage(err));
    }
  }
  return <SettingsForm title="Preferences" form={form} error={error} message={message} fields={['theme', 'timezone', 'locale', 'date_format', 'table_density']} onChange={setForm} onSubmit={submit} />;
}

function SecurityPanel() {
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  async function enable() {
    setError('');
    const response = await accountApi.enableTwoFactor('tenant').catch((err) => {
      setError(errorMessage(err));
      return null;
    });
    if (response) {
      setSecret(response.data.provisioning_uri ?? response.data.secret);
      setMessage('Scan the setup value, then confirm with a code.');
    }
  }
  async function confirm() {
    try {
      await accountApi.confirmTwoFactor('tenant', code);
      setSecret('');
      setCode('');
      setMessage('Two-factor authentication enabled.');
    } catch (err) {
      setError(errorMessage(err));
    }
  }
  async function disable() {
    try {
      await accountApi.disableTwoFactor('tenant', password);
      setPassword('');
      setMessage('Two-factor authentication disabled.');
    } catch (err) {
      setError(errorMessage(err));
    }
  }
  return (
    <div className="settings-panel">
      <h2>2FA Wizard</h2>
      {error ? <div className="surface-error">{error}</div> : null}
      {message ? <div className="surface-state">{message}</div> : null}
      <div className="table-actions">
        <Button type="button" onClick={enable}><ShieldCheck size={16} aria-hidden />Enable 2FA</Button>
      </div>
      {secret ? <code className="token-preview">{secret}</code> : null}
      {secret ? <label><span>Authenticator Code</span><input value={code} onChange={(event) => setCode(event.target.value)} /></label> : null}
      {secret ? <Button type="button" onClick={confirm}>Confirm 2FA</Button> : null}
      <label><span>Password to disable</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
      <Button type="button" variant="danger" onClick={disable}><ShieldX size={16} aria-hidden />Disable 2FA</Button>
    </div>
  );
}

function SessionsPanel() {
  const [sessions, setSessions] = useState<Array<Record<string, unknown>>>([]);
  const [revokeId, setRevokeId] = useState('');
  const [error, setError] = useState('');
  async function load() {
    try {
      const response = await accountApi.sessions('tenant');
      const payload = response.data as unknown as { sessions?: Array<Record<string, unknown>> };
      setSessions(payload.sessions ?? []);
    } catch (err) {
      setError(errorMessage(err));
    }
  }
  useEffect(() => { void load(); }, []);
  async function revoke() {
    try {
      await accountApi.revokeSession('tenant', revokeId);
      setRevokeId('');
      await load();
    } catch (err) {
      setError(errorMessage(err));
    }
  }
  return (
    <div className="settings-panel">
      <h2>Sessions</h2>
      {error ? <div className="surface-error">{error}</div> : null}
      {sessions.length === 0 ? <div className="empty-state">No active sessions found.</div> : null}
      <div className="record-list">
        {sessions.map((session) => (
          <article key={String(session.id)}>
            <strong>{String(session.name ?? session.device_name ?? `Session ${session.id}`)}</strong>
            <p>{String(session.last_used_at ?? session.created_at ?? '-')}</p>
            <Button type="button" size="sm" variant="danger" onClick={() => setRevokeId(String(session.id))}>Revoke</Button>
          </article>
        ))}
      </div>
      <AppModal open={Boolean(revokeId)} onClose={() => setRevokeId('')} title="Revoke Session" guard="tenant" permission="profile.security" footer={<><Button type="button" variant="secondary" onClick={() => setRevokeId('')}>Cancel</Button><Button type="button" variant="danger" onClick={revoke}>Revoke</Button></>}>
        <p>This will immediately revoke the selected session or token.</p>
      </AppModal>
    </div>
  );
}

function ApiTokensPanel() {
  const [tokens, setTokens] = useState<ApiTokenRecord[]>([]);
  const [form, setForm] = useState({ name: '', abilities: 'report.view, report.export', expires_at: '' });
  const [rawToken, setRawToken] = useState('');
  const [confirmToken, setConfirmToken] = useState<ApiTokenRecord | null>(null);
  const [error, setError] = useState('');
  async function load() {
    try {
      const response = await accountApi.apiTokens('tenant');
      setTokens(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(errorMessage(err));
    }
  }
  useEffect(() => { void load(); }, []);
  async function create(event: FormEvent) {
    event.preventDefault();
    const response = await accountApi.createApiToken('tenant', { name: form.name, abilities: csv(form.abilities), expires_at: form.expires_at || null });
    setRawToken(response.data.token ?? '');
    setForm({ ...form, name: '' });
    await load();
  }
  async function rotate(token: ApiTokenRecord) {
    const response = await accountApi.rotateApiToken('tenant', token.uuid);
    setRawToken(response.data.token ?? '');
    await load();
  }
  async function revoke() {
    if (!confirmToken) return;
    await accountApi.revokeApiToken('tenant', confirmToken.uuid);
    setConfirmToken(null);
    await load();
  }
  return (
    <div className="settings-panel">
      <h2>API Tokens</h2>
      {error ? <div className="surface-error">{error}</div> : null}
      {rawToken ? <code className="token-preview">{rawToken}</code> : null}
      <form className="form-grid form-grid--two" onSubmit={create}>
        <label><span>Name</span><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label>
        <label><span>Abilities</span><input value={form.abilities} onChange={(event) => setForm({ ...form, abilities: event.target.value })} /></label>
        <label><span>Expires At</span><input value={form.expires_at} onChange={(event) => setForm({ ...form, expires_at: event.target.value })} /></label>
        <Button type="submit"><KeyRound size={16} aria-hidden />Create Token</Button>
      </form>
      <div className="record-list">
        {tokens.map((token) => (
          <article key={token.uuid}>
            <strong>{token.name}</strong>
            <p>{token.abilities?.join(', ') ?? '-'}</p>
            <div className="inline-actions">
              <Button type="button" size="sm" variant="secondary" onClick={() => rotate(token)}><RefreshCw size={16} aria-hidden />Rotate</Button>
              <Button type="button" size="sm" variant="danger" onClick={() => setConfirmToken(token)}>Revoke</Button>
            </div>
          </article>
        ))}
      </div>
      <AppModal open={Boolean(confirmToken)} onClose={() => setConfirmToken(null)} title="Revoke API Token" guard="tenant" permission="profile.security" footer={<><Button type="button" variant="secondary" onClick={() => setConfirmToken(null)}>Cancel</Button><Button type="button" variant="danger" onClick={revoke}>Revoke</Button></>}>
        <p>Token access will stop immediately.</p>
      </AppModal>
    </div>
  );
}

function SettingsForm<T extends Record<string, string>>({ title, form, fields, error, message, passwordFields, onChange, onSubmit }: { title: string; form: T; fields: string[]; error: string; message: string; passwordFields?: boolean; onChange: (form: T) => void; onSubmit: (event: FormEvent) => void }) {
  return (
    <form className="settings-panel" onSubmit={onSubmit}>
      <h2>{title}</h2>
      {error ? <div className="surface-error">{error}</div> : null}
      {message ? <div className="surface-state">{message}</div> : null}
      <div className="form-grid form-grid--two">
        {fields.map((field) => {
          const options = fieldOptions(field);
          return (
            <label key={field}>
              <span>{label(field)}</span>
              {options ? (
                <select value={form[field] ?? ''} onChange={(event) => onChange({ ...form, [field]: event.target.value })}>
                  {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              ) : (
                <input type={passwordFields ? 'password' : 'text'} value={form[field] ?? ''} onChange={(event) => onChange({ ...form, [field]: event.target.value })} />
              )}
            </label>
          );
        })}
      </div>
      <Button type="submit"><Save size={16} aria-hidden />Save</Button>
    </form>
  );
}

function fieldOptions(field: string) {
  const options: Record<string, Array<{ value: string; label: string }>> = {
    theme: [{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }, { value: 'system', label: 'System default' }],
    timezone: [
      { value: 'UTC', label: 'UTC' },
      { value: 'Asia/Kolkata', label: 'India Standard Time (UTC+05:30)' },
      { value: 'Asia/Dubai', label: 'Gulf Standard Time (UTC+04:00)' },
      { value: 'Asia/Singapore', label: 'Singapore Time (UTC+08:00)' },
      { value: 'Europe/London', label: 'United Kingdom Time (UTC+00:00)' },
      { value: 'America/New_York', label: 'Eastern Time (UTC-05:00)' },
      { value: 'America/Los_Angeles', label: 'Pacific Time (UTC-08:00)' },
      { value: 'Australia/Sydney', label: 'Australian Eastern Time (UTC+10:00)' }
    ],
    locale: [{ value: 'en', label: 'English' }, { value: 'hi', label: 'Hindi' }],
    date_format: [{ value: 'DD MMM YYYY', label: 'DD MMM YYYY' }, { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' }, { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' }],
    table_density: [{ value: 'comfortable', label: 'Comfortable' }, { value: 'compact', label: 'Compact' }, { value: 'spacious', label: 'Spacious' }]
  };
  return options[field];
}
function csv(value: string) {
  return value.split(',').map((entry) => entry.trim()).filter(Boolean);
}

function label(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function preferenceValue(value: unknown) {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return `${value.length} selected`;
  if (typeof value === 'object') return 'Configured';
  return String(value);
}

function errorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Request failed.';
}
