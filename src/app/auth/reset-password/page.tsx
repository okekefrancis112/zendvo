'use client'
import React, { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthLayout } from '@/layouts/AuthLayout';
import { WorldMapShowcase } from '@/components/auth/WordMapShowcase';
import { PasswordInput } from '@/components/PasswordInput';
import Button from '@/components/Button';
import PasswordStrengthIndicator from '@/components/auth/PasswordStrengthIndicator';

const ResetPasswordPage: React.FC = () => {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [strength, setStrength] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateStrength = (pwd: string): 0 | 1 | 2 | 3 | 4 => {
    if (!pwd) return 0;
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd) || /[^A-Za-z0-9]/.test(pwd)) score++;
    return score as 0 | 1 | 2 | 3 | 4;
  };

  useEffect(() => {
    setStrength(calculateStrength(password));
  }, [password]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);
    setError(null);

    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('Password updated successfully');
      router.push('/auth/login?reset=success');
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = password && confirmPassword && password === confirmPassword && password.length >= 8;

  return (
    <AuthLayout showcaseContent={<WorldMapShowcase />}>
      <div className="space-y-10">
        <div className="space-y-1">
          <h1 className="text-xl md:text-[2rem] leading-5 md:leading-10 tracking-tight font-bold text-[#18181B]">
            Create new password
          </h1>
          <p className="text-sm text-[#717182] leading-relaxed">
            Create a new secure password for future access to your Zendvo account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <PasswordInput
              id="password"
              label="Enter new password"
              placeholder="••••••••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              required
              autoComplete="new-password"
            />
            <p className="text-[11px] text-[#717182] leading-relaxed">
              Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character.
            </p>
            <PasswordStrengthIndicator strength={strength} />
          </div>

          <PasswordInput
            id="confirmPassword"
            label="Confirm Password"
            placeholder="••••••••••••••"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setError(null);
            }}
            error={error || undefined}
            required
            autoComplete="new-password"
          />

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              className="w-full bg-[#5A42DE]! rounded-lg! text-base! font-medium! cursor-pointer py-3"
              isLoading={isLoading}
              disabled={!isFormValid || isLoading}
            >
              Create new password
            </Button>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
};

export default ResetPasswordPage;
