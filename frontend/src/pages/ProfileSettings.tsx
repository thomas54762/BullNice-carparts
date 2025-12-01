import React, { useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { InputField } from '../components/InputField';
import { Button } from '../components/Button';

export const ProfileSettings: React.FC = () => {
  const [userInfo, setUserInfo] = useState({
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1 234 567 8900',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

    // Mock save
    setTimeout(() => {
      setSaving(false);
      setMessage({ type: 'success', text: 'Profile updated successfully' });
    }, 1000);
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

    // Mock password change
    setTimeout(() => {
      setPasswordSaving(false);
      setMessage({ type: 'success', text: 'Password changed successfully' });
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    }, 1000);
  };

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
            <div className={`mb-4 p-3 rounded ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-700' 
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSaveUserInfo} className="space-y-4">
            <InputField
              label="Full Name"
              name="name"
              type="text"
              value={userInfo.name}
              onChange={handleUserInfoChange}
              required
            />
            <InputField
              label="Email"
              name="email"
              type="email"
              value={userInfo.email}
              onChange={handleUserInfoChange}
              required
            />
            <InputField
              label="Phone Number"
              name="phone"
              type="tel"
              value={userInfo.phone}
              onChange={handleUserInfoChange}
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


