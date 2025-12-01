import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { InputField } from '../components/InputField';
import { useAuth } from '../contexts/AuthContext';

export const SignUp: React.FC = () => {
  const { register, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [error, setError] = useState<{ [key: string]: string[] }>({});
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError({});

    // Client-side validation
    if (formData.password !== formData.confirmPassword) {
      setError({
        password2: ['Passwords do not match'],
      });
      return;
    }

    if (formData.password.length < 8) {
      setError({
        password: ['Password must be at least 8 characters'],
      });
      return;
    }

    setLoading(true);

    try {
      await register({
        email: formData.email,
        password: formData.password,
        password2: formData.confirmPassword,
        first_name: formData.firstName || undefined,
        last_name: formData.lastName || undefined,
      });
    } catch (err) {
      if (typeof err === 'object' && err !== null) {
        // Field-specific errors from backend
        setError(err as { [key: string]: string[] });
      } else {
        // General error
        setError({
          non_field_errors: [err instanceof Error ? err.message : 'Registration failed'],
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link to="/signin" className="font-medium text-primary-600 hover:text-primary-500">
              sign in to your existing account
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {Object.keys(error).length > 0 && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {Object.entries(error).map(([field, messages]) => (
                <p key={field}>{Array.isArray(messages) ? messages.join(', ') : messages}</p>
              ))}
            </div>
          )}
          <div className="space-y-4">
            <InputField
              label="First name"
              name="firstName"
              type="text"
              autoComplete="given-name"
              value={formData.firstName}
              onChange={handleChange}
            />
            <InputField
              label="Last name"
              name="lastName"
              type="text"
              autoComplete="family-name"
              value={formData.lastName}
              onChange={handleChange}
            />
            <InputField
              label="Email address"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
            />
            <InputField
              label="Password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={formData.password}
              onChange={handleChange}
              helperText="Must be at least 8 characters"
            />
            <InputField
              label="Confirm password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
            />
          </div>

          <div>
            <Button type="submit" className="w-full" isLoading={loading}>
              Create account
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};


