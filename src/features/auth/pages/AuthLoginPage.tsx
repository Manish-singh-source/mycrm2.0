import { FormEvent, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Building2, CheckCircle2, Eye, KeyRound, LogIn, Mail, Search, ShieldCheck } from 'lucide-react';

import { authApi } from '@/features/auth/api/authApi';
import type { AccountDiscovery, AuthGuard, DiscoveredAccount, LoginResult } from '@/features/auth/types/authTypes';
import { TENANT_ROUTES } from '@/features/tenant/routes/tenantRoutes';
import { PLATFORM_ROUTES } from '@/features/platform/routes/platformRoutes';
import { ApiError } from '@/lib/api/apiError';
import { Button } from '@/shared/components/ui';

function deviceName() {
  if (typeof navigator === 'undefined') return 'Web browser';
  const browser = navigator.userAgent.includes('Firefox')
    ? 'Firefox'
    : navigator.userAgent.includes('Edg')
      ? 'Edge'
      : navigator.userAgent.includes('Chrome')
        ? 'Chrome'
        : 'Browser';
  return `${browser} on ${navigator.platform || 'web'}`;
}

function errorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}

function destinationFor(result: Extract<LoginResult, { type: 'logged_in' }>) {
  const session = result.session;
  if (session.surface === 'platform') return PLATFORM_ROUTES.dashboard;
  const tenant = session.tenant;
  if (tenant) return TENANT_ROUTES.dashboard(tenant.slug || tenant.uuid);
  return session.redirect_to ?? '/auth/login';
}

export function AuthLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const requestedGuard = (location.state as { guard?: AuthGuard } | null)?.guard;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [discovery, setDiscovery] = useState<AccountDiscovery | null>(null);
  const [selectedRef, setSelectedRef] = useState('');
  const [accountSearch, setAccountSearch] = useState('');
  const [challengeToken, setChallengeToken] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const accounts = useMemo(() => {
    const list = discovery?.accounts ?? [];
    const guarded = requestedGuard ? list.filter((account) => account.authGuard === requestedGuard) : list;
    const query = accountSearch.trim().toLowerCase();
    if (!query) return guarded;
    return guarded.filter((account) =>
      [account.label, account.displayName, account.email, account.organization, account.roles.join(' ')]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }, [accountSearch, discovery?.accounts, requestedGuard]);

  const selectedAccount: DiscoveredAccount | undefined = (discovery?.accounts ?? []).find(
    (account) => account.accountRef === selectedRef
  );
  const phase = challengeToken ? '2fa' : selectedAccount ? 'password' : discovery ? 'accounts' : 'email';

  async function handleDiscover(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);

    try {
      const response = await authApi.discoverAccounts({ email, device_name: deviceName() });
      setDiscovery(response.data);
      const nextAccounts = requestedGuard
        ? response.data.accounts.filter((account) => account.authGuard === requestedGuard)
        : response.data.accounts;
      setSelectedRef('');
      if (nextAccounts.length === 0) {
        setMessage('No active account found for this email.');
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!discovery?.discoveryToken || !selectedAccount) return;

    setError('');
    setMessage('');
    setIsSubmitting(true);

    try {
      const response = await authApi.loginAccount({
        email: discovery.email,
        discovery_token: discovery.discoveryToken,
        account_ref: selectedAccount.accountRef,
        password,
        remember,
        device_name: deviceName()
      });

      if (response.data.type === '2fa_required') {
        setChallengeToken(response.data.challenge.challenge_token);
        return;
      }

      navigate(destinationFor(response.data), { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleTwoFactor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await authApi.verifyLoginTwoFactor({
        challenge_token: challengeToken,
        code: twoFactorCode,
        remember_device: remember,
        device_name: deviceName()
      });

      if (response.data.type === 'logged_in') {
        navigate(destinationFor(response.data), { replace: true });
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  const cardTitle =
    phase === 'email'
      ? 'Welcome Back'
      : phase === 'accounts'
        ? 'Choose an Account'
        : phase === 'password'
          ? 'Enter Your Password'
          : 'Verify Your Login';

  return (
    <section className={`auth-experience auth-experience--${phase}`} aria-labelledby="login-title">
      {phase === 'email' ? (
        <aside className="auth-hero" aria-label="Product">
          <div className="auth-logo">MyCRM</div>
          <div>
            <h2>Manage Your Entire Business From One Platform</h2>
            <p>Enterprise-grade flow management for the modern organization.</p>
          </div>
          <div className="auth-hero__preview">
            <span>Pipeline health</span>
            <strong>98.4%</strong>
            <div />
          </div>
        </aside>
      ) : null}

      <div className="auth-stage">
        <div className="auth-stage__top">
          <span>English (US)</span>
          <span>Secure Login</span>
        </div>

        <section className="auth-card" aria-labelledby="login-title">
          <header>
            <div className="auth-card__brand">MyCRM</div>
            <h1 id="login-title">{cardTitle}</h1>
            <p>
              {phase === 'email'
                ? 'Enter your work email to continue securely.'
                : phase === 'accounts'
                  ? 'Select the account you want to continue with.'
                  : phase === 'password'
                    ? 'Confirm the selected account with your password.'
                    : 'Enter the code from your authenticator app.'}
            </p>
          </header>

          {error ? <div className="surface-error">{error}</div> : null}
          {message ? <div className="surface-state">{message}</div> : null}

          {phase === 'email' ? (
            <form className="auth-form" onSubmit={handleDiscover}>
              <label>
                <span className="sr-only">Email</span>
                <span className="auth-input auth-input--large">
                  <Mail size={20} aria-hidden="true" />
                  <input
                    autoComplete="email"
                    inputMode="email"
                    name="email"
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="Enter your work email"
                    required
                    type="email"
                    value={email}
                  />
                </span>
              </label>
              <Button disabled={isSubmitting} type="submit" size="lg">
                {isSubmitting ? 'Checking...' : 'Continue'}
                <ArrowRight size={20} aria-hidden="true" />
              </Button>
            </form>
          ) : null}

          {phase === 'accounts' ? (
            <div className="auth-form">
              <div className="selected-email-pill">
                {discovery?.email}
                <button onClick={() => setDiscovery(null)} type="button">
                  Change Email
                </button>
              </div>
              <label>
                <span className="sr-only">Search organizations</span>
                <span className="auth-input">
                  <Search size={18} aria-hidden="true" />
                  <input
                    onChange={(event) => setAccountSearch(event.target.value)}
                    placeholder="Search accounts"
                    type="search"
                    value={accountSearch}
                  />
                </span>
              </label>
              <div className="account-list account-list--cards">
                {accounts.map((account) => (
                  <button
                    className="account-choice"
                    key={account.accountRef}
                    onClick={() => setSelectedRef(account.accountRef)}
                    type="button"
                  >
                    <span className="account-choice__icon">
                      <Building2 size={18} aria-hidden="true" />
                    </span>
                    <span>
                      <strong>{account.label}</strong>
                      <small>{account.organization ?? account.email}</small>
                    </span>
                    <em>{account.accountType.replace('_', ' ')}</em>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {phase === 'password' && selectedAccount ? (
            <form className="auth-form" onSubmit={handleLogin}>
              <div className="selected-account">
                <span>
                  <CheckCircle2 size={18} aria-hidden="true" />
                </span>
                <div>
                  <strong>{selectedAccount.displayName}</strong>
                  <small>{selectedAccount.label}</small>
                </div>
                <button onClick={() => setSelectedRef('')} type="button">
                  Change Account
                </button>
              </div>

              <label>
                <span>Password</span>
                <span className="auth-input">
                  <KeyRound size={18} aria-hidden="true" />
                  <input
                    autoComplete="current-password"
                    name="password"
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    type="password"
                    value={password}
                  />
                  <Eye size={18} aria-hidden="true" />
                </span>
              </label>

              <label className="check-row">
                <input checked={remember} onChange={(event) => setRemember(event.target.checked)} type="checkbox" />
                <span>Remember this device for 30 days</span>
              </label>

              <Button disabled={isSubmitting} type="submit">
                {isSubmitting ? 'Signing in...' : 'Sign In'}
                <LogIn size={18} aria-hidden="true" />
              </Button>
            </form>
          ) : null}

          {phase === '2fa' ? (
            <form className="auth-form" onSubmit={handleTwoFactor}>
              <label>
                <span>Authenticator code</span>
                <span className="auth-input">
                  <ShieldCheck size={18} aria-hidden="true" />
                  <input
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    maxLength={6}
                    name="code"
                    onChange={(event) => setTwoFactorCode(event.target.value)}
                    required
                    value={twoFactorCode}
                  />
                </span>
              </label>
              <Button disabled={isSubmitting} type="submit">
                <ShieldCheck size={18} aria-hidden="true" />
                {isSubmitting ? 'Verifying...' : 'Verify'}
              </Button>
            </form>
          ) : null}

          <footer className="auth-card__footer">
            <Link to="/auth/forgot-password">Forgot password?</Link>
            <span>SSL Secured</span>
            <span>Enterprise Security</span>
          </footer>
        </section>
      </div>
    </section>
  );
}
