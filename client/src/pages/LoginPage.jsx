import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button, Card, Input } from '../components/UI';
import { useAuth } from '../hooks/useAuth';
import { isValidEmail } from '../utils/helpers';
import { extractApiFieldErrors, extractApiMessage } from '../utils/errors';

export function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [localError, setLocalError] = useState('');
  const { login, isSubmitting, error: authError, setError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const validate = () => {
    const nextErrors = {};
    const email = formData.email.trim();

    if (!email) {
      nextErrors.email = 'Email is required';
    } else if (!isValidEmail(email)) {
      nextErrors.email = 'Enter a valid email address';
    }

    if (!formData.password) {
      nextErrors.password = 'Password is required';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
    setLocalError('');
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLocalError('');

    if (!validate()) {
      return;
    }

    try {
      await login({
        email: formData.email.trim(),
        password: formData.password,
      });
      const redirectTo = location.state?.from?.pathname || '/chat';
      navigate(redirectTo, { replace: true });
    } catch (loginError) {
      const nextErrors = extractApiFieldErrors(loginError);
      if (Object.keys(nextErrors).length > 0) {
        setErrors((current) => ({ ...current, ...nextErrors }));
      }
      setLocalError(extractApiMessage(loginError, 'Unable to sign in right now.'));
    }
  };

  const visibleError = localError || authError;

  return (
    <Card className="w-full max-w-md p-6 sm:p-8">
      <div className="mb-8">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500 text-lg font-bold text-slate-950 shadow-lg shadow-sky-500/20">
          C
        </div>
        <h2 className="mt-5 text-3xl font-semibold tracking-tight text-white">
          Welcome back
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Sign in to continue to your conversations.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        {visibleError && (
          <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {visibleError}
          </div>
        )}

        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
        />

        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
        />

        <Button type="submit" className="w-full" loading={isSubmitting}>
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-400">
        New to ChatX?{' '}
        <Link to="/register" className="font-medium text-sky-400 hover:text-sky-300">
          Create an account
        </Link>
      </p>
    </Card>
  );
}
