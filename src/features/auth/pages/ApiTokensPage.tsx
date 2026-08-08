import { FormEvent, useEffect, useState } from 'react';
import { KeyRound, RefreshCw, ShieldX } from 'lucide-react';

import { accountApi, type ApiTokenRecord } from '@/features/auth/api/accountApi';
import type { AuthGuard } from '@/features/auth/types/authTypes';
import { ApiError } from '@/lib/api/apiError';
import { Button } from '@/shared/components/ui';

type ApiTokensPageProps = {
  guard: AuthGuard;
};

function errorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}

export function ApiTokensPage({ guard }: ApiTokensPageProps) {
  const [tokens, setTokens] = useState<ApiTokenRecord[]>([]);
  const [name, setName] = useState('');
  const [abilities, setAbilities] = useState('report.view, report.export');
  const [expiresAt, setExpiresAt] = useState('');
  const [rawToken, setRawToken] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function loadTokens() {
    try {
      const response = await accountApi.apiTokens(guard);
      setTokens(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  useEffect(() => {
    void loadTokens();
  }, [guard]);

  async function createToken(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    setRawToken('');
    try {
      const response = await accountApi.createApiToken(guard, {
        name,
        abilities: abilities
          .split(',')
          .map((ability) => ability.trim())
          .filter(Boolean),
        expires_at: expiresAt || null
      });
      setRawToken(response.data.token ?? '');
      setName('');
      setMessage('API token created.');
      await loadTokens();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function rotateToken(uuid: string) {
    setError('');
    setMessage('');
    try {
      const response = await accountApi.rotateApiToken(guard, uuid);
      setRawToken(response.data.token ?? '');
      setMessage('API token rotated.');
      await loadTokens();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function revokeToken(uuid: string) {
    setError('');
    setMessage('');
    try {
      await accountApi.revokeApiToken(guard, uuid);
      setMessage('API token revoked.');
      await loadTokens();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <section className="page settings-page">
      <header className="enterprise-page-header">
        <div>
          <p className="eyebrow">{guard}</p>
          <h1>API tokens</h1>
          <p>Create, rotate, and revoke integration tokens using the completed token APIs.</p>
        </div>
      </header>

      {error ? <div className="surface-error">{error}</div> : null}
      {message ? <div className="surface-state">{message}</div> : null}
      {rawToken ? <code className="token-preview">{rawToken}</code> : null}

      <form className="settings-panel" onSubmit={createToken}>
        <h2>Create token</h2>
        <label>
          <span>Name</span>
          <input onChange={(event) => setName(event.target.value)} required value={name} />
        </label>
        <label>
          <span>Abilities</span>
          <input onChange={(event) => setAbilities(event.target.value)} required value={abilities} />
        </label>
        <label>
          <span>Expires at</span>
          <input onChange={(event) => setExpiresAt(event.target.value)} placeholder="2027-08-06T00:00:00Z" value={expiresAt} />
        </label>
        <Button type="submit">
          <KeyRound size={18} aria-hidden="true" />
          Create token
        </Button>
      </form>

      <div className="data-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Abilities</th>
              <th>Expires</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tokens.map((token) => (
              <tr key={token.uuid}>
                <td>{token.name}</td>
                <td>{token.abilities?.join(', ') ?? '-'}</td>
                <td>{token.expires_at ?? '-'}</td>
                <td>
                  <div className="table-actions">
                    <Button onClick={() => rotateToken(token.uuid)} size="sm" type="button" variant="secondary">
                      <RefreshCw size={16} aria-hidden="true" />
                      Rotate
                    </Button>
                    <Button onClick={() => revokeToken(token.uuid)} size="sm" type="button" variant="danger">
                      <ShieldX size={16} aria-hidden="true" />
                      Revoke
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {tokens.length === 0 ? (
              <tr>
                <td colSpan={4}>No API tokens found.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
