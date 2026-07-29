import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { ImageUploader } from '../../components/common/ImageUploader';
import {
  Settings,
  Save,
  Check,
  Plus,
  Trash2,
  Image as ImageIcon,
  ShieldCheck,
  Lock,
  Key,
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
  User,
  ShieldAlert,
} from 'lucide-react';

export const SettingsManager: React.FC = () => {
  const {
    settings,
    updateSettings,
    ownerUsername,
    ownerSecurityCode,
    changeOwnerPassword,
    resetOwnerPasswordWithCode,
    updateOwnerSecurityCode,
    updateOwnerUsername,
  } = useStore();

  const [formData, setFormData] = useState({ ...settings });
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Security Credentials Local States
  const [showSecurityCode, setShowSecurityCode] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Change Password State
  const [currPassForChange, setCurrPassForChange] = useState('');
  const [newPassForChange, setNewPassForChange] = useState('');
  const [confirmPassForChange, setConfirmPassForChange] = useState('');
  const [changePassStatus, setChangePassStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Reset Password via Unique Code State
  const [resetCodeInput, setResetCodeInput] = useState('');
  const [newPassForReset, setNewPassForReset] = useState('');
  const [confirmPassForReset, setConfirmPassForReset] = useState('');
  const [resetPassStatus, setResetPassStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Update Security Code State
  const [currPassForCode, setCurrPassForCode] = useState('');
  const [newCodeInput, setNewCodeInput] = useState('');
  const [codeStatus, setCodeStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Update Username State
  const [currPassForUser, setCurrPassForUser] = useState('');
  const [newUsernameInput, setNewUsernameInput] = useState('');
  const [userStatus, setUserStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleAddGalleryImage = (url: string) => {
    if (!url) return;
    setFormData((prev) => ({
      ...prev,
      galleryUrls: [...prev.galleryUrls, url],
    }));
  };

  const handleRemoveGalleryImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      galleryUrls: prev.galleryUrls.filter((_, i) => i !== index),
    }));
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(ownerSecurityCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setChangePassStatus(null);
    if (newPassForChange !== confirmPassForChange) {
      setChangePassStatus({ type: 'error', message: 'New passwords do not match.' });
      return;
    }
    const res = changeOwnerPassword(currPassForChange, newPassForChange);
    if (!res.success) {
      setChangePassStatus({ type: 'error', message: res.error || 'Failed to change password.' });
      return;
    }
    setChangePassStatus({ type: 'success', message: 'Password updated successfully!' });
    setCurrPassForChange('');
    setNewPassForChange('');
    setConfirmPassForChange('');
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResetPassStatus(null);
    if (newPassForReset !== confirmPassForReset) {
      setResetPassStatus({ type: 'error', message: 'New passwords do not match.' });
      return;
    }
    const res = resetOwnerPasswordWithCode(resetCodeInput, newPassForReset);
    if (!res.success) {
      setResetPassStatus({ type: 'error', message: res.error || 'Failed to reset password.' });
      return;
    }
    setResetPassStatus({ type: 'success', message: 'Password reset successfully via Unique Code!' });
    setResetCodeInput('');
    setNewPassForReset('');
    setConfirmPassForReset('');
  };

  const handleUpdateCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCodeStatus(null);
    const res = updateOwnerSecurityCode(currPassForCode, newCodeInput);
    if (!res.success) {
      setCodeStatus({ type: 'error', message: res.error || 'Failed to update security code.' });
      return;
    }
    setCodeStatus({ type: 'success', message: 'Unique Security Code updated successfully!' });
    setCurrPassForCode('');
    setNewCodeInput('');
  };

  const handleUpdateUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUserStatus(null);
    const res = updateOwnerUsername(currPassForUser, newUsernameInput);
    if (!res.success) {
      setUserStatus({ type: 'error', message: res.error || 'Failed to update username.' });
      return;
    }
    setUserStatus({ type: 'success', message: `Login ID updated to '${newUsernameInput.trim()}'!` });
    setCurrPassForUser('');
    setNewUsernameInput('');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-400" />
            <span>Restaurant Branding & Settings</span>
          </h3>
          <p className="text-xs text-zinc-400">Direct computer image uploads, brand identity, and security configuration</p>
        </div>

        {savedSuccess && (
          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
            <Check className="w-4 h-4" />
            <span>Saved Successfully</span>
          </span>
        )}
      </div>

      {/* SECTION 1: OWNER ACCOUNT SECURITY & PASSWORD MANAGEMENT */}
      <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">Owner Portal Credentials & Security</h4>
              <p className="text-xs text-zinc-400">Manage Login ID, Change & Reset Password with Unique Security Code</p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-zinc-400 block">Current Login Username</span>
            <span className="text-xs font-mono font-bold text-amber-400 bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800 inline-block mt-0.5">
              {ownerUsername}
            </span>
          </div>
        </div>

        {/* Unique Security Code Display Banner */}
        <div className="p-4 rounded-xl bg-zinc-950 border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
              <Key className="w-4 h-4 text-amber-400" />
              <span>Your Unique Password Reset Code</span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Use this code to recover or reset your owner portal password at any time.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono font-bold text-white tracking-wider">
              {showSecurityCode ? ownerSecurityCode : '••••••••'}
            </div>
            <button
              onClick={() => setShowSecurityCode(!showSecurityCode)}
              className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
              title={showSecurityCode ? 'Hide Code' : 'Reveal Code'}
            >
              {showSecurityCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <button
              onClick={handleCopyCode}
              className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-amber-400 transition cursor-pointer"
              title="Copy Unique Code"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Security Tabs / Forms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Form A: Change Password */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
            <h5 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-amber-400" /> Change Password
            </h5>

            {changePassStatus && (
              <div
                className={`p-2.5 rounded-lg text-xs font-semibold ${
                  changePassStatus.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                    : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                }`}
              >
                {changePassStatus.message}
              </div>
            )}

            <form onSubmit={handleChangePasswordSubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-1">
                  Current Password *
                </label>
                <input
                  type="password"
                  required
                  value={currPassForChange}
                  onChange={(e) => setCurrPassForChange(e.target.value)}
                  placeholder="Enter current password..."
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500/80 rounded-xl px-3 py-2 text-xs text-zinc-100 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-1">
                  New Password *
                </label>
                <input
                  type="password"
                  required
                  value={newPassForChange}
                  onChange={(e) => setNewPassForChange(e.target.value)}
                  placeholder="New password (min 4 chars)..."
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500/80 rounded-xl px-3 py-2 text-xs text-zinc-100 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-1">
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassForChange}
                  onChange={(e) => setConfirmPassForChange(e.target.value)}
                  placeholder="Re-enter new password..."
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500/80 rounded-xl px-3 py-2 text-xs text-zinc-100 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold py-2 rounded-xl text-xs transition cursor-pointer"
              >
                Update Password
              </button>
            </form>
          </div>

          {/* Form B: Reset Password with Unique Code */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
            <h5 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Key className="w-4 h-4 text-amber-400" /> Reset Password (Unique Code)
            </h5>

            {resetPassStatus && (
              <div
                className={`p-2.5 rounded-lg text-xs font-semibold ${
                  resetPassStatus.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                    : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                }`}
              >
                {resetPassStatus.message}
              </div>
            )}

            <form onSubmit={handleResetPasswordSubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-1">
                  Unique Security Code *
                </label>
                <input
                  type="text"
                  required
                  value={resetCodeInput}
                  onChange={(e) => setResetCodeInput(e.target.value)}
                  placeholder={`e.g. ${ownerSecurityCode}`}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500/80 rounded-xl px-3 py-2 text-xs text-zinc-100 font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-1">
                  New Password *
                </label>
                <input
                  type="password"
                  required
                  value={newPassForReset}
                  onChange={(e) => setNewPassForReset(e.target.value)}
                  placeholder="New password..."
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500/80 rounded-xl px-3 py-2 text-xs text-zinc-100 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-1">
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassForReset}
                  onChange={(e) => setConfirmPassForReset(e.target.value)}
                  placeholder="Re-enter new password..."
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500/80 rounded-xl px-3 py-2 text-xs text-zinc-100 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-2 rounded-xl text-xs transition border border-zinc-700 cursor-pointer"
              >
                Reset via Code
              </button>
            </form>
          </div>
        </div>

        {/* Secondary Credentials Settings: Update Security Code & Username */}
        <div className="pt-4 border-t border-zinc-800 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Update Unique Security Code */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
            <h5 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 text-amber-400" /> Change Unique Security Code
            </h5>

            {codeStatus && (
              <div
                className={`p-2.5 rounded-lg text-xs font-semibold ${
                  codeStatus.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                    : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                }`}
              >
                {codeStatus.message}
              </div>
            )}

            <form onSubmit={handleUpdateCodeSubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-1">
                  Current Password *
                </label>
                <input
                  type="password"
                  required
                  value={currPassForCode}
                  onChange={(e) => setCurrPassForCode(e.target.value)}
                  placeholder="Verify password..."
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500/80 rounded-xl px-3 py-2 text-xs text-zinc-100 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-1">
                  New Unique Code *
                </label>
                <input
                  type="text"
                  required
                  value={newCodeInput}
                  onChange={(e) => setNewCodeInput(e.target.value)}
                  placeholder="e.g. SEC-9988 or custom code..."
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500/80 rounded-xl px-3 py-2 text-xs text-zinc-100 font-mono tracking-wider outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-amber-400 font-bold py-2 rounded-xl text-xs transition border border-zinc-700 cursor-pointer"
              >
                Update Security Code
              </button>
            </form>
          </div>

          {/* Update Username / Login ID */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
            <h5 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-400" /> Change Login Username ID
            </h5>

            {userStatus && (
              <div
                className={`p-2.5 rounded-lg text-xs font-semibold ${
                  userStatus.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                    : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                }`}
              >
                {userStatus.message}
              </div>
            )}

            <form onSubmit={handleUpdateUsernameSubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-1">
                  Current Password *
                </label>
                <input
                  type="password"
                  required
                  value={currPassForUser}
                  onChange={(e) => setCurrPassForUser(e.target.value)}
                  placeholder="Verify password..."
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500/80 rounded-xl px-3 py-2 text-xs text-zinc-100 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-1">
                  New Username ID *
                </label>
                <input
                  type="text"
                  required
                  value={newUsernameInput}
                  onChange={(e) => setNewUsernameInput(e.target.value)}
                  placeholder="e.g. manager, admin_owner..."
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500/80 rounded-xl px-3 py-2 text-xs text-zinc-100 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-2 rounded-xl text-xs transition border border-zinc-700 cursor-pointer"
              >
                Update Login ID
              </button>
            </form>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Brand Info */}
        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">Brand Identity Details</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                Restaurant Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500/80 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                Brand Tagline
              </label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500/80 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                Contact Phone
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500/80 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                Currency Symbol
              </label>
              <input
                type="text"
                value={formData.currencySymbol}
                onChange={(e) => setFormData({ ...formData, currencySymbol: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500/80 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                Tax Percentage (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.taxPercentage}
                onChange={(e) => setFormData({ ...formData, taxPercentage: parseFloat(e.target.value) })}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500/80 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
              Physical Address
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500/80 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 outline-none"
            />
          </div>
        </div>

        {/* Local Direct Computer Uploads Section */}
        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
            Direct Local Computer Image Uploads
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <ImageUploader
              label="Restaurant Logo"
              value={formData.logoUrl}
              onChange={(url) => setFormData({ ...formData, logoUrl: url })}
              aspectRatio="square"
            />

            <ImageUploader
              label="Restaurant Cover Photo"
              value={formData.coverUrl}
              onChange={(url) => setFormData({ ...formData, coverUrl: url })}
              aspectRatio="cover"
            />

            <ImageUploader
              label="Favicon / Icon"
              value={formData.faviconUrl}
              onChange={(url) => setFormData({ ...formData, faviconUrl: url })}
              aspectRatio="square"
            />
          </div>

          {/* Gallery Images Upload */}
          <div className="pt-4 border-t border-zinc-800 space-y-3">
            <h5 className="text-xs font-semibold text-zinc-300">Ambiance Gallery Photos</h5>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {formData.galleryUrls.map((img, idx) => (
                <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border border-zinc-800">
                  <img src={img} alt="Gallery" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveGalleryImage(idx)}
                    className="absolute top-1 right-1 p-1.5 rounded-lg bg-rose-500 text-white opacity-0 group-hover:opacity-100 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              <ImageUploader
                label="Add Gallery Photo"
                value=""
                onChange={(url) => handleAddGalleryImage(url)}
                aspectRatio="square"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm shadow-xl shadow-amber-500/20 transition cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Save All Settings & Brand Assets</span>
        </button>
      </form>
    </div>
  );
};

