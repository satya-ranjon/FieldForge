import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  X,
  Lock,
  Mail,
  Building2,
  Phone,
  Shield,
  Zap,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  UserCheck
} from 'lucide-react';
import { authApi, AuthApiError } from '../../store/services/authApi';
import { setCredentials, setLoading, setError } from '../../store/slices/authSlice';
import type { RootState } from '../../store';
import { UserRole } from '@fieldforge/contracts';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [role, setRole] = useState<UserRole>(UserRole.BUYER);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleQuickDemo = (demoType: 'buyer' | 'technician') => {
    if (demoType === 'buyer') {
      setEmail('buyer.portal@fieldforge.dev');
      setPassword('SecurePassword123!');
      setRole(UserRole.BUYER);
      setCompanyName('Apex Logistics Corp');
      setPhoneNumber('+15551234567');
    } else {
      setEmail('tech.field@fieldforge.dev');
      setPassword('SecurePassword123!');
      setRole(UserRole.TECHNICIAN);
      setFirstName('Marcus');
      setLastName('Vance');
      setPhoneNumber('+15559876543');
    }
    dispatch(setError(null));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(setLoading(true));
    dispatch(setError(null));
    setSuccessMsg(null);

    try {
      if (mode === 'login') {
        const tokens = await authApi.login({ email, password });
        const fullName =
          tokens.user.role === 'BUYER' ? companyName || 'Apex Buyer Corp' : 'Field Technician';

        dispatch(
          setCredentials({
            user: {
              id: tokens.user.id,
              email: tokens.user.email,
              fullName,
              role: tokens.user.role,
              status: tokens.user.status,
              companyName: tokens.user.role === 'BUYER' ? fullName : undefined
            },
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken
          })
        );
        setSuccessMsg('Authentication successful! Welcome back.');
        setTimeout(() => {
          onClose();
        }, 600);
      } else {
        const registerPayload = {
          email,
          password,
          role,
          phoneNumber: phoneNumber || '+15551234567',
          ...(role === 'BUYER'
            ? { companyName: companyName || 'Enterprise Buyer Inc' }
            : {
                firstName: firstName || 'John',
                lastName: lastName || 'Doe',
                hourlyRateMinor: 8500
              })
        };

        const tokens = await authApi.register(registerPayload);
        const fullName =
          role === 'BUYER'
            ? companyName || 'Enterprise Buyer Inc'
            : `${firstName} ${lastName}`.trim();

        dispatch(
          setCredentials({
            user: {
              id: tokens.user.id,
              email: tokens.user.email,
              fullName,
              role: tokens.user.role,
              status: tokens.user.status,
              phoneNumber,
              companyName: role === 'BUYER' ? fullName : undefined
            },
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken
          })
        );
        setSuccessMsg('Account registered successfully!');
        setTimeout(() => {
          onClose();
        }, 600);
      }
    } catch (err: unknown) {
      if (err instanceof AuthApiError) {
        dispatch(setError(err.message));
      } else if (err instanceof Error) {
        dispatch(setError(err.message));
      } else {
        dispatch(setError('An unexpected error occurred'));
      }
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl shadow-blue-950/40 text-slate-100 overflow-hidden relative"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        {/* Glow effect at modal top */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-gradient-to-b from-blue-600/20 to-transparent blur-xl pointer-events-none" />

        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between relative z-10">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/40">
              <Zap className="w-4 h-4 fill-white" />
            </div>
            <div>
              <h2
                id="auth-modal-title"
                className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5"
              >
                FieldForge Identity
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800/60">
                  Trust Edge
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                {mode === 'login'
                  ? 'Sign in to your enterprise account'
                  : 'Provision a new organization or technician identity'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="grid grid-cols-2 p-1.5 bg-[#090d16] border-b border-slate-800/80 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              dispatch(setError(null));
              setSuccessMsg(null);
            }}
            className={`py-2 rounded-lg transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-[#1e293b] text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              dispatch(setError(null));
              setSuccessMsg(null);
            }}
            className={`py-2 rounded-lg transition-all cursor-pointer ${
              mode === 'register'
                ? 'bg-[#1e293b] text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Quick Demo Credentials Preset Bar */}
        <div className="p-3 bg-blue-950/30 border-b border-blue-900/40 flex items-center justify-between text-[11px]">
          <span className="text-blue-300 font-medium flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            Quick Demo Auto-Fill:
          </span>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => handleQuickDemo('buyer')}
              className="px-2 py-0.5 rounded bg-blue-900/60 hover:bg-blue-800 text-blue-200 font-mono text-[10px] transition cursor-pointer border border-blue-700/50"
            >
              Buyer Org
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('technician')}
              className="px-2 py-0.5 rounded bg-cyan-950/60 hover:bg-cyan-900 text-cyan-200 font-mono text-[10px] transition cursor-pointer border border-cyan-700/50"
            >
              Technician
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-200 flex items-start space-x-2 text-[11px]">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold">Authentication Error: </span>
                {error}
              </div>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-800/80 text-emerald-200 flex items-center space-x-2 text-[11px]">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Registration Role Switcher */}
          {mode === 'register' && (
            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium">Account Role</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole(UserRole.BUYER)}
                  className={`p-2.5 rounded-lg border text-left transition cursor-pointer flex items-center space-x-2 ${
                    role === UserRole.BUYER
                      ? 'border-blue-500 bg-blue-950/50 text-white'
                      : 'border-slate-800 bg-[#090d16] text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Building2 className="w-4 h-4 text-blue-400" />
                  <div>
                    <div className="font-semibold text-xs">Enterprise Buyer</div>
                    <div className="text-[10px] text-slate-400">Post & fund work orders</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole(UserRole.TECHNICIAN)}
                  className={`p-2.5 rounded-lg border text-left transition cursor-pointer flex items-center space-x-2 ${
                    role === UserRole.TECHNICIAN
                      ? 'border-cyan-500 bg-cyan-950/50 text-white'
                      : 'border-slate-800 bg-[#090d16] text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <UserCheck className="w-4 h-4 text-cyan-400" />
                  <div>
                    <div className="font-semibold text-xs">Technician</div>
                    <div className="text-[10px] text-slate-400">Execute field service jobs</div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Company Name (For Buyer Registration) */}
          {mode === 'register' && role === UserRole.BUYER && (
            <div className="space-y-1">
              <label className="text-slate-300 font-medium">Organization / Company Name</label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Apex Retail Corp"
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#090d16] border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>
          )}

          {/* First / Last Name (For Technician Registration) */}
          {mode === 'register' && role === 'TECHNICIAN' && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-slate-300 font-medium">First Name</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Marcus"
                  className="w-full px-3 py-2 rounded-lg bg-[#090d16] border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Last Name</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Vance"
                  className="w-full px-3 py-2 rounded-lg bg-[#090d16] border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                />
              </div>
            </div>
          )}

          {/* Email Address */}
          <div className="space-y-1">
            <label className="text-slate-300 font-medium">Work Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="buyer@fieldforge.dev"
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#090d16] border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-slate-300 font-medium">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#090d16] border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
              />
            </div>
            {mode === 'register' && (
              <span className="text-[10px] text-slate-500">
                Minimum 8 characters with letters & numbers.
              </span>
            )}
          </div>

          {/* Phone Number (For Registration) */}
          {mode === 'register' && (
            <div className="space-y-1">
              <label className="text-slate-300 font-medium">Phone Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#090d16] border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/30 transition disabled:opacity-60 cursor-pointer"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>
                  {mode === 'login' ? 'Authorize Session' : 'Create Organization Identity'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Footer Security Note */}
          <div className="pt-2 text-center text-[10px] text-slate-500 flex items-center justify-center gap-1">
            <Shield className="w-3 h-3 text-emerald-400" />
            <span>Protected by AES-256 trust boundary & rotating token pairs</span>
          </div>
        </form>
      </div>
    </div>
  );
};
