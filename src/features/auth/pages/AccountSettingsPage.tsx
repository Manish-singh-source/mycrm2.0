import { FormEvent, useEffect, useState } from 'react';
import { Save, ShieldCheck } from 'lucide-react';

import { accountApi } from '@/features/auth/api/accountApi';
import type { AuthGuard } from '@/features/auth/types/authTypes';
import { ApiError } from '@/lib/api/apiError';
import { Button } from '@/shared/components/ui';

type AccountSettingsPageProps = {
  guard: AuthGuard;
};

function errorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}

function readUser(payload: Record<string, unknown>) {
  const user = (payload.user ?? payload.account ?? payload) as Record<string, unknown>;
  return {
    first_name: String(user.first_name ?? ''),
    last_name: String(user.last_name ?? ''),
    display_name: String(user.display_name ?? user.displayName ?? ''),
    mobile: String(user.mobile ?? ''),
    timezone: String(user.timezone ?? 'Asia/Kolkata'),
    locale: String(user.locale ?? 'en')
  };
}

export function AccountSettingsPage({ guard }: AccountSettingsPageProps) {
  const [form, setForm] = useState(readUser({}));
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorSecret, setTwoFactorSecret] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    accountApi
      .profile(guard)
      .then((response) => {
        if (active) setForm(readUser(response.data));
      })
      .catch((err) => {
        if (active) setError(errorMessage(err));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [guard]);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError('');
    setMessage('');
    try {
      await accountApi.updateProfile(guard, form);
      await accountApi.updatePreferences(guard, { locale: form.locale, timezone: form.timezone });
      setMessage('Profile and preferences updated.');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    if (newPassword !== confirmPassword) {
      setError('Password confirmation does not match.');
      return;
    }

    try {
      await accountApi.changePassword(guard, {
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage('Password updated.');
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function enableTwoFactor() {
    setError('');
    setMessage('');
    try {
      const response = await accountApi.enableTwoFactor(guard);
      setTwoFactorSecret(response.data.secret);
      setMessage('Enter a code from your authenticator to confirm 2FA.');
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function confirmTwoFactor() {
    setError('');
    setMessage('');
    try {
      await accountApi.confirmTwoFactor(guard, twoFactorCode);
      setTwoFactorCode('');
      setTwoFactorSecret('');
      setMessage('Two-factor authentication enabled.');
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <section className="page settings-page">
      <header className="enterprise-page-header">
        <div>
          <p className="eyebrow">{guard}</p>
          <h1>Account settings</h1>
          <p>Profile, preferences, password, and two-factor security are connected to the completed APIs.</p>
        </div>
      </header>

      {error ? <div className="surface-error">{error}</div> : null}
      {message ? <div className="surface-state">{message}</div> : null}
      {isLoading ? <div className="surface-state">Loading profile...</div> : null}

      <div className="settings-grid">
        <form className="settings-panel" onSubmit={saveProfile}>
          <h2>Profile</h2>
          <label>
            <span>First name</span>
            <input onChange={(event) => setForm({ ...form, first_name: event.target.value })} value={form.first_name} />
          </label>
          <label>
            <span>Last name</span>
            <input onChange={(event) => setForm({ ...form, last_name: event.target.value })} value={form.last_name} />
          </label>
          <label>
            <span>Display name</span>
            <input
              onChange={(event) => setForm({ ...form, display_name: event.target.value })}
              value={form.display_name}
            />
          </label>
          <label>
            <span>Mobile</span>
            <input onChange={(event) => setForm({ ...form, mobile: event.target.value })} value={form.mobile} />
          </label>
          <label>
            <span>Timezone</span>
            <input onChange={(event) => setForm({ ...form, timezone: event.target.value })} value={form.timezone} />
          </label>
          <label>
            <span>Locale</span>
            <input onChange={(event) => setForm({ ...form, locale: event.target.value })} value={form.locale} />
          </label>
          <Button disabled={isSaving} type="submit">
            <Save size={18} aria-hidden="true" />
            {isSaving ? 'Saving...' : 'Save profile'}
          </Button>
        </form>

        <form className="settings-panel" onSubmit={changePassword}>
          <h2>Password</h2>
          <label>
            <span>Current password</span>
            <input
              onChange={(event) => setCurrentPassword(event.target.value)}
              required
              type="password"
              value={currentPassword}
            />
          </label>
          <label>
            <span>New password</span>
            <input onChange={(event) => setNewPassword(event.target.value)} required type="password" value={newPassword} />
          </label>
          <label>
            <span>Confirm password</span>
            <input
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              type="password"
              value={confirmPassword}
            />
          </label>
          <Button type="submit">
            <Save size={18} aria-hidden="true" />
            Change password
          </Button>
        </form>

        <div className="settings-panel">
          <h2>Two-factor authentication</h2>
          <Button onClick={enableTwoFactor} type="button" variant="secondary">
            <ShieldCheck size={18} aria-hidden="true" />
            Enable setup
          </Button>
          {twoFactorSecret ? <code className="token-preview">{twoFactorSecret}</code> : null}
          {twoFactorSecret ? (
            <>
              <label>
                <span>Authenticator code</span>
                <input onChange={(event) => setTwoFactorCode(event.target.value)} value={twoFactorCode} />
              </label>
              <Button onClick={confirmTwoFactor} type="button">
                Confirm 2FA
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
