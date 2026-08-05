import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { UserRole } from '../../types';
import {
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  UtensilsCrossed,
  ChefHat,
  BellRing,
  KeyRound,
  ShieldAlert,
  Key,
  X,
  Check,
  HelpCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { authenticateEmployeeViaApi } from '../../services/api';

interface LoginViewProps {
  role: 'owner' | 'kitchen' | 'waiter';
  onSuccess: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ role, onSuccess }) => {
  const { login, settings, ownerUsername, ownerPassword, ownerSecurityCode, resetOwnerPasswordWithCode } = useStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Password Reset Modal State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetCodeInput, setResetCodeInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  const config = {
    owner: {
      title: 'Owner Portal Access',
      subtitle: 'Manage restaurant operations, analytics & settings',
      icon: ShieldCheck,
      color: 'from-amber-500 to-amber-700',
    },
    kitchen: {
      title: 'Kitchen Display System (KDS)',
      subtitle: 'Live cooking queue, order management & ETAs',
      icon: ChefHat,
      color: 'from-orange-500 to-orange-700',
    },
    waiter: {
      title: 'Waiter Service Terminal',
      subtitle: 'Live order dispatches & table requests',
      icon: BellRing,
      color: 'from-emerald-500 to-emerald-700',
    },
  }[role];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim()) {
      setError('Please enter your username');
      return;
    }
    if (!password) {
      setError('Please enter your password / passcode');
      return;
    }

    setIsAuthenticating(true);
    try {
      let empProfile: any = null;
      if (role === 'waiter' || role === 'kitchen') {
        try {
          empProfile = await authenticateEmployeeViaApi({ username: username.trim(), password, role: role.toUpperCase() });
        } catch (apiErr: any) {
          setError(apiErr.message || 'Authentication failed. Please verify your username and password.');
          return;
        }
      }

      const res = login(role, username, password, empProfile);
      if (!res.success) {
        setError(res.error || 'Authentication failed. Please verify your credentials.');
        return;
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Authentication error occurred.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');

    if (!resetCodeInput.trim()) {
      setResetError('Please enter your Unique Security Code.');
      return;
    }
    if (!newPasswordInput) {
      setResetError('Please enter a new password.');
      return;
    }
    if (newPasswordInput !== confirmPasswordInput) {
      setResetError('Passwords do not match. Please re-enter.');
      return;
    }

    const result = resetOwnerPasswordWithCode(resetCodeInput, newPasswordInput);
    if (!result.success) {
      setResetError(result.error || 'Reset failed. Check your Unique Security Code.');
      return;
    }

    setResetSuccess('Password reset successfully! Updating login credentials...');
    setTimeout(() => {
      setUsername(ownerUsername);
      setPassword(newPasswordInput);
      setIsResetModalOpen(false);
      setResetCodeInput('');
      setNewPasswordInput('');
      setConfirmPasswordInput('');
      setResetSuccess('');
      // Auto login with new credentials
      login(role, ownerUsername, newPasswordInput);
      onSuccess();
    }, 1500);
  };

  const Icon = config.icon;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/5 blur-[120px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-zinc-900/90 border border-zinc-800 backdrop-blur-xl rounded-2xl p-8 shadow-2xl relative z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-zinc-800/80 border border-zinc-700/50 mb-4 text-amber-400">
            <Icon className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">{config.title}</h1>
          <p className="text-xs text-zinc-400 mt-1">{config.subtitle}</p>
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800/60 border border-zinc-700/40 text-[11px] text-zinc-300">
            <UtensilsCrossed className="w-3.5 h-3.5 text-amber-400" />
            <span>{settings.name}</span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-center font-medium flex items-center gap-2 justify-center">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
              Username ID
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username..."
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Passcode / Password
              </label>
              {role === 'owner' && (
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(true)}
                  className="text-[11px] font-bold text-amber-400 hover:text-amber-300 transition hover:underline"
                >
                  Forgot / Reset Password?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isAuthenticating}
            className="w-full mt-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-sm shadow-lg shadow-amber-500/10 transition cursor-pointer disabled:opacity-50"
          >
            <span>{isAuthenticating ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {role === 'owner' && (
          <div className="mt-4 pt-4 border-t border-zinc-800/80 text-center">
            <p className="text-[11px] text-zinc-500">
              Unique Security Reset Code: <span className="font-mono text-amber-400 font-bold">{ownerSecurityCode}</span>
            </p>
          </div>
        )}
      </motion.div>

      {/* Reset Password Modal with Unique Code */}
      <AnimatePresence>
        {isResetModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden space-y-5"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />

              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                    <Key className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Reset Owner Password</h3>
                    <p className="text-xs text-zinc-400">Verify using your Unique Security Reset Code</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsResetModalOpen(false)}
                  className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Reset Notification Messages */}
              {resetError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{resetError}</span>
                </div>
              )}

              {resetSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{resetSuccess}</span>
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                    Unique Security Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={resetCodeInput}
                    onChange={(e) => setResetCodeInput(e.target.value)}
                    placeholder="e.g. DF-8942"
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500/80 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 font-mono tracking-wider outline-none"
                  />
                  <span className="text-[10px] text-zinc-500 mt-1 block flex items-center gap-1">
                    <HelpCircle className="w-3 h-3 text-amber-400" /> Default Code: <strong className="text-amber-400 font-mono">{ownerSecurityCode}</strong>
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                    New Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    placeholder="Enter new password (min 4 chars)..."
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500/80 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                    Confirm New Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPasswordInput}
                    onChange={(e) => setConfirmPasswordInput(e.target.value)}
                    placeholder="Re-enter new password..."
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500/80 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsResetModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-zinc-800 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    Reset & Sign In
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

