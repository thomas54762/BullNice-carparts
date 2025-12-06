import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { InputField } from '../components/InputField';
import { useAuth } from '../contexts/AuthContext';

export const SignIn: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
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
    setLoading(true);

    try {
      await login({
        email: formData.email,
        password: formData.password,
      });
    } catch (err) {
      if (typeof err === 'object' && err !== null) {
        // Field-specific errors
        setError(err as { [key: string]: string[] });
      } else {
        // General error
        setError({
          non_field_errors: [err instanceof Error ? err.message : 'Login failed'],
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
          <div className="flex justify-center mb-4">
            <img
              src="/bullnice_logo.svg"
              alt="BullNice"
              className="h-16 w-auto"
            />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link to="/signup" className="font-medium text-primary-600 hover:text-primary-500">
              create a new account
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
              autoComplete="current-password"
              required
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link to="/forgot-password" className="font-medium text-primary-600 hover:text-primary-500">
                Forgot your password?
              </Link>
            </div>
          </div>

          <div>
            <Button type="submit" className="w-full" isLoading={loading}>
              Sign in
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};


