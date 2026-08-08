import { FormEvent, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { KeyRound, Save } from 'lucide-react';

import { authApi } from '@/features/auth/api/authApi';
import { ApiError } from '@/lib/api/apiError';
import { Button } from '@/shared/components/ui';

function errorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [token, setToken] = useState(searchParams.get('token') ?? '');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');

    if (password !== passwordConfirmation) {
      setError('Password confirmation does not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.resetPassword({
        email,
        token,
        password,
        password_confirmation: passwordConfirmation
      });
      setMessage('Password reset complete. You can sign in now.');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="auth-card" aria-labelledby="reset-title">
      <header>
        <p className="eyebrow">New password</p>
        <h1 id="reset-title">Set password</h1>
        <p>Use the reset token from your email to create a new password.</p>
      </header>

      {error ? <div className="surface-error">{error}</div> : null}
      {message ? <div className="surface-state">{message}</div> : null}

      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          <span>Email</span>
          <input onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
        </label>
        <label>
          <span>Reset token</span>
          <input onChange={(event) => setToken(event.target.value)} required value={token} />
        </label>
        <label>
          <span>New password</span>
          <span className="auth-input">
            <KeyRound size={18} aria-hidden="true" />
            <input
              autoComplete="new-password"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </span>
        </label>
        <label>
          <span>Confirm password</span>
          <input
            autoComplete="new-password"
            onChange={(event) => setPasswordConfirmation(event.target.value)}
            required
            type="password"
            value={passwordConfirmation}
          />
        </label>
        <Button disabled={isSubmitting} type="submit">
          <Save size={18} aria-hidden="true" />
          {isSubmitting ? 'Saving...' : 'Save password'}
        </Button>
      </form>

      <footer className="auth-card__footer">
        <Link to="/auth/login">Back to sign in</Link>
      </footer>
    </section>
  );
}
