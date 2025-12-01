import React, { useState, useEffect } from 'react';
import { Button } from '../components/Button';
import { InputField } from '../components/InputField';
import { PageHeader } from '../components/PageHeader';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import { getErrorMessage, getFieldErrors } from '../utils/api';

export const ProfileSettings: React.FC = () => {
  const { user, updateUser, refreshUser } = useAuth();
  const [userInfo, setUserInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load user data
  useEffect(() => {
    if (user) {
      setUserInfo({
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        email: user.email,
      });
      setLoading(false);
    } else {
      refreshUser().finally(() => setLoading(false));
    }
  }, [user, refreshUser]);

  const handleUserInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserInfo({
      ...userInfo,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordForm({
      ...passwordForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleSaveUserInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const updatedUser = await authService.updateProfile({
        first_name: userInfo.firstName,
        last_name: userInfo.lastName,
      });
      updateUser(updatedUser);
      setMessage({ type: 'success', text: 'Profile updated successfully' });
    } catch (error) {
      const fieldErrors = getFieldErrors(error);
      if (Object.keys(fieldErrors).length > 0) {
        const errorMessages = Object.values(fieldErrors).flat();
        setMessage({ type: 'error', text: errorMessages.join(', ') });
      } else {
        setMessage({ type: 'error', text: getErrorMessage(error) });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      return;
    }

    setPasswordSaving(true);

    try {
      // Note: Backend needs to implement password change endpoint
      // For now, show a message that this feature is not yet implemented
      setMessage({
        type: 'error',
        text: 'Password change functionality is not yet implemented. Please contact support.',
      });
      // await authService.changePassword({
      //   current_password: passwordForm.currentPassword,
      //   new_password: passwordForm.newPassword,
      // });
    } catch (error) {
      const fieldErrors = getFieldErrors(error);
      if (Object.keys(fieldErrors).length > 0) {
        const errorMessages = Object.values(fieldErrors).flat();
        setMessage({ type: 'error', text: errorMessages.join(', ') });
      } else {
        setMessage({ type: 'error', text: getErrorMessage(error) });
      }
    } finally {
      setPasswordSaving(false);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Profile Settings" />
        <div className="bg-white rounded-lg shadow p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Profile Settings"
        subtitle="Manage your account information and preferences"
      />

      <div className="space-y-6">
        {/* User Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">User Information</h2>

          {message && (
            <div className={`mb-4 p-3 rounded ${message.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSaveUserInfo} className="space-y-4">
            <InputField
              label="First Name"
              name="firstName"
              type="text"
              value={userInfo.firstName}
              onChange={handleUserInfoChange}
            />
            <InputField
              label="Last Name"
              name="lastName"
              type="text"
              value={userInfo.lastName}
              onChange={handleUserInfoChange}
            />
            <InputField
              label="Email"
              name="email"
              type="email"
              value={userInfo.email}
              onChange={handleUserInfoChange}
              required
              disabled
              helperText="Email cannot be changed"
            />
            <div className="flex justify-end">
              <Button type="submit" isLoading={saving}>
                Save Changes
              </Button>
            </div>
          </form>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h2>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <InputField
              label="Current Password"
              name="currentPassword"
              type="password"
              value={passwordForm.currentPassword}
              onChange={handlePasswordChange}
              required
            />
            <InputField
              label="New Password"
              name="newPassword"
              type="password"
              value={passwordForm.newPassword}
              onChange={handlePasswordChange}
              required
              helperText="Must be at least 8 characters"
            />
            <InputField
              label="Confirm New Password"
              name="confirmPassword"
              type="password"
              value={passwordForm.confirmPassword}
              onChange={handlePasswordChange}
              required
            />
            <div className="flex justify-end">
              <Button type="submit" isLoading={passwordSaving}>
                Change Password
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};


