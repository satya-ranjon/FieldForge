'use client';

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  X,
  Lock,
  Mail,
  Building2,
  Phone,
  Shield,
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
        let fullName = companyName || tokens.user.email.split('@')[0];

        try {
          const profile = await authApi.getMe(tokens.accessToken);
          if (profile.buyerProfile?.companyName) {
            fullName = profile.buyerProfile.companyName;
          } else if (profile.technicianProfile?.firstName) {
            fullName =
              `${profile.technicianProfile.firstName} ${profile.technicianProfile.lastName || ''}`.trim();
          }
        } catch {
          // getMe fallback to entered companyName or email prefix
        }

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
            ? { companyName: companyName || email.split('@')[0] }
            : {
                firstName: firstName || 'Technician',
                lastName: lastName || 'User',
                hourlyRateMinor: 8500
              })
        };

        const tokens = await authApi.register(registerPayload);
        const fullName =
          role === 'BUYER'
            ? companyName || email.split('@')[0]
            : `${firstName || 'Technician'} ${lastName || 'User'}`.trim();

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-[#FFFFFF] border border-[#E3E8E1] rounded-2xl shadow-2xl text-[#090E11] overflow-hidden relative"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        {/* Subtle top accent line */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#A8F22D] via-[#22B947] to-[#A8F22D]" />

        {/* Modal Header */}
        <div className="p-5 border-b border-[#EBEFE9] flex items-center justify-between relative z-10">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#A8F22D] flex items-center justify-center text-[#08120D] font-black text-base shadow-sm">
              F
            </div>
            <div>
              <h2
                id="auth-modal-title"
                className="text-sm font-bold tracking-tight text-[#090E11] flex items-center gap-1.5"
              >
                FieldForge Identity
                <span className="text-[10px] uppercase font-mono font-semibold px-1.5 py-0.5 rounded bg-[#EAF8E9] text-[#18852E] border border-[#C3EBC2]">
                  Trust Edge
                </span>
              </h2>
              <p className="text-[11px] text-[#59636E]">
                {mode === 'login'
                  ? 'Sign in to your enterprise account'
                  : 'Provision a new organization or technician identity'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#7D8791] hover:text-[#090E11] hover:bg-[#F0F2F3] transition cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="grid grid-cols-2 p-1.5 bg-[#F0F2F3] border-b border-[#EBEFE9] text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              dispatch(setError(null));
              setSuccessMsg(null);
            }}
            className={`py-2 rounded-xl transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-[#FFFFFF] text-[#090E11] border border-[#C3EBC2] shadow-sm'
                : 'text-[#7D8791] hover:text-[#090E11]'
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
            className={`py-2 rounded-xl transition-all cursor-pointer ${
              mode === 'register'
                ? 'bg-[#FFFFFF] text-[#090E11] border border-[#C3EBC2] shadow-sm'
                : 'text-[#7D8791] hover:text-[#090E11]'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Quick Demo Credentials Preset Bar */}
        <div className="p-3 bg-[#EAF8E9] border-b border-[#C3EBC2] flex items-center justify-between text-[11px]">
          <span className="text-[#18852E] font-medium flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-[#22B947]" />
            Quick Demo Auto-Fill:
          </span>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => handleQuickDemo('buyer')}
              className="px-2 py-0.5 rounded-lg bg-[#FFFFFF] hover:bg-[#F0F2F3] text-[#18852E] font-mono text-[10px] transition cursor-pointer border border-[#C3EBC2] font-semibold"
            >
              Buyer Org
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('technician')}
              className="px-2 py-0.5 rounded-lg bg-[#FFFFFF] hover:bg-[#F0F2F3] text-[#18852E] font-mono text-[10px] transition cursor-pointer border border-[#C3EBC2] font-semibold"
            >
              Technician
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-[#FDEAEA] border border-[#FBBFBB] text-[#C92C2C] flex items-start space-x-2 text-[11px]">
              <AlertCircle className="w-4 h-4 text-[#C92C2C] shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold">Authentication Error: </span>
                {error}
              </div>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-[#EAF8E9] border border-[#C3EBC2] text-[#18852E] flex items-center space-x-2 text-[11px]">
              <CheckCircle2 className="w-4 h-4 text-[#22B947] shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Registration Role Switcher */}
          {mode === 'register' && (
            <div className="space-y-1.5">
              <label className="text-[#090E11] font-semibold">Account Role</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole(UserRole.BUYER)}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center space-x-2 ${
                    role === UserRole.BUYER
                      ? 'border-[#22B947] bg-[#EAF8E9] text-[#090E11]'
                      : 'border-[#E3E8E1] bg-[#F8FAF7] text-[#7D8791] hover:border-[#DDE4DA]'
                  }`}
                >
                  <Building2 className="w-4 h-4 text-[#22B947]" />
                  <div>
                    <div className="font-semibold text-xs text-[#090E11]">Enterprise Buyer</div>
                    <div className="text-[10px] text-[#59636E]">Post &amp; fund work orders</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole(UserRole.TECHNICIAN)}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center space-x-2 ${
                    role === UserRole.TECHNICIAN
                      ? 'border-[#22B947] bg-[#EAF8E9] text-[#090E11]'
                      : 'border-[#E3E8E1] bg-[#F8FAF7] text-[#7D8791] hover:border-[#DDE4DA]'
                  }`}
                >
                  <UserCheck className="w-4 h-4 text-[#22B947]" />
                  <div>
                    <div className="font-semibold text-xs text-[#090E11]">Technician</div>
                    <div className="text-[10px] text-[#59636E]">Execute field service jobs</div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Company Name (For Buyer Registration) */}
          {mode === 'register' && role === UserRole.BUYER && (
            <div className="space-y-1">
              <label className="text-[#090E11] font-semibold">Organization / Company Name</label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-[#7D8791] absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Apex Retail Corp"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#DDE4DA] text-[#090E11] placeholder-[#7D8791] focus:outline-none focus:border-[#A8F22D] focus:ring-2 focus:ring-[#A8F22D]/40 transition"
                />
              </div>
            </div>
          )}

          {/* First / Last Name (For Technician Registration) */}
          {mode === 'register' && role === 'TECHNICIAN' && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[#090E11] font-semibold">First Name</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Marcus"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#DDE4DA] text-[#090E11] placeholder-[#7D8791] focus:outline-none focus:border-[#A8F22D] focus:ring-2 focus:ring-[#A8F22D]/40 transition"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[#090E11] font-semibold">Last Name</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Vance"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#DDE4DA] text-[#090E11] placeholder-[#7D8791] focus:outline-none focus:border-[#A8F22D] focus:ring-2 focus:ring-[#A8F22D]/40 transition"
                />
              </div>
            </div>
          )}

          {/* Email Address */}
          <div className="space-y-1">
            <label className="text-[#090E11] font-semibold">Work Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#7D8791] absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="buyer@fieldforge.dev"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#DDE4DA] text-[#090E11] placeholder-[#7D8791] focus:outline-none focus:border-[#A8F22D] focus:ring-2 focus:ring-[#A8F22D]/40 transition"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-[#090E11] font-semibold">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#7D8791] absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#DDE4DA] text-[#090E11] placeholder-[#7D8791] focus:outline-none focus:border-[#A8F22D] focus:ring-2 focus:ring-[#A8F22D]/40 transition"
              />
            </div>
            {mode === 'register' && (
              <span className="text-[10px] text-[#7D8791]">
                Minimum 8 characters with letters &amp; numbers.
              </span>
            )}
          </div>

          {/* Phone Number (For Registration) */}
          {mode === 'register' && (
            <div className="space-y-1">
              <label className="text-[#090E11] font-semibold">Phone Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#7D8791] absolute left-3.5 top-3" />
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#DDE4DA] text-[#090E11] placeholder-[#7D8791] focus:outline-none focus:border-[#A8F22D] focus:ring-2 focus:ring-[#A8F22D]/40 transition"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-[#A8F22D] hover:bg-[#9CE228] active:bg-[#8ED620] text-[#08120D] font-bold flex items-center justify-center space-x-2 shadow-xs transition disabled:opacity-60 cursor-pointer"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-[#08120D]/30 border-t-[#08120D] rounded-full animate-spin" />
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
          <div className="pt-2 text-center text-[10px] text-[#7D8791] flex items-center justify-center gap-1">
            <Shield className="w-3 h-3 text-[#22B947]" />
            <span>Protected by AES-256 trust boundary &amp; rotating token pairs</span>
          </div>
        </form>
      </div>
    </div>
  );
};
