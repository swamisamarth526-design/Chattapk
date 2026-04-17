import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, Input } from '../components/UI';
import { useAuth } from '../hooks/useAuth';
import { isStrongPassword, isValidEmail } from '../utils/helpers';
import { extractApiFieldErrors, extractApiMessage } from '../utils/errors';

export function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [localError, setLocalError] = useState('');
  const { register, isSubmitting, error: authError, setError } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const nextErrors = {};
    const name = formData.name.trim();
    const email = formData.email.trim();

    if (!name) {
      nextErrors.name = 'Name is required';
    } else if (name.length < 2) {
      nextErrors.name = 'Name should be at least 2 characters';
    } else if (name.length > 50) {
      nextErrors.name = 'Name should be 50 characters or fewer';
    }

    if (!email) {
      nextErrors.email = 'Email is required';
    } else if (!isValidEmail(email)) {
      nextErrors.email = 'Enter a valid email address';
    }

    if (!formData.password) {
      nextErrors.password = 'Password is required';
    } else if (!isStrongPassword(formData.password)) {
      nextErrors.password = 'Password should be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      nextErrors.confirmPassword = 'Confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match';
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
    const name = formData.name.trim();
    const email = formData.email.trim();

    if (!validate()) {
      return;
    }

    try {
      await register({
        name,
        email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });

      navigate('/chat', { replace: true });
    } catch (registerError) {
      const nextErrors = extractApiFieldErrors(registerError);
      if (Object.keys(nextErrors).length > 0) {
        setErrors((current) => ({ ...current, ...nextErrors }));
      }
      setLocalError(
        extractApiMessage(registerError, 'Unable to create your account.')
      );
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
          Create account
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Set up your workspace and jump into the conversation flow.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        {visibleError && (
          <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {visibleError}
          </div>
        )}

        <Input
          label="Full name"
          name="name"
          autoComplete="name"
          placeholder="Alex Mercer"
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
        />

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
          autoComplete="new-password"
          placeholder="At least 6 characters"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
        />

        <Input
          label="Confirm password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="Repeat your password"
          value={formData.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
        />

        <Button type="submit" className="w-full" loading={isSubmitting}>
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-400">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-sky-400 hover:text-sky-300">
          Sign in
        </Link>
      </p>
    </Card>
  );
}
