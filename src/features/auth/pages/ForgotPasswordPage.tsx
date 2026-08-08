import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Mail } from 'lucide-react';

import { authApi } from '@/features/auth/api/authApi';
import { ApiError } from '@/lib/api/apiError';
import { Button } from '@/shared/components/ui';

function errorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    setResetToken('');
    setIsSubmitting(true);

    try {
      const response = await authApi.forgotPassword({ email });
      setMessage(response.data.message);
      setResetToken(response.data.reset_token ?? '');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="auth-card" aria-labelledby="forgot-title">
      <header>
        <p className="eyebrow">Password recovery</p>
        <h1 id="forgot-title">Reset password</h1>
        <p>Enter your email and we will send reset instructions when an account matches.</p>
      </header>

      {error ? <div className="surface-error">{error}</div> : null}
      {message ? <div className="surface-state">{message}</div> : null}
      {resetToken ? <code className="token-preview">{resetToken}</code> : null}

      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          <span>Email</span>
          <span className="auth-input">
            <Mail size={18} aria-hidden="true" />
            <input
              autoComplete="email"
              inputMode="email"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </span>
        </label>
        <Button disabled={isSubmitting} type="submit">
          <ArrowRight size={18} aria-hidden="true" />
          {isSubmitting ? 'Sending...' : 'Send reset link'}
        </Button>
      </form>

      <footer className="auth-card__footer">
        <Link to="/auth/login">Back to sign in</Link>
      </footer>
    </section>
  );
}
