import React, { useRef, useState } from 'react';
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Mail,
  Box,
  ShieldCheck,
  Headset,
  Tag,
  LogIn,
  KeyRound,
  ArrowLeft,
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { GuvihostApiError } from '@/lib/guvihost-api';
import { isGoogleLoginAvailable, useGoogleSignInButton } from '@/lib/google-auth';
import leftAuthImage from '@/assets/auth/login-left.png'; 

export default function LoginPage() { 
  const { login, googleLogin, verifyTwoFactor, cancelTwoFactor, twoFactorPending } = useAuth();
  const navigate = useNavigate();
  const googleBtnRef = useRef<HTMLDivElement>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  
  const [errors, setErrors] = useState({ email: '', password: '', code: '' });

  const validate = () => {
    let isValid = true;
    const newErrors = { email: '', password: '', code: '' };

    if (!twoFactorPending) {
      if (!email) {
        newErrors.email = 'Email address is required';
        isValid = false;
      } else if (!/\S+@\S+\.\S+/.test(email)) {
        newErrors.email = 'Please enter a valid email address';
        isValid = false;
      }

      if (!password) {
        newErrors.password = 'Password is required';
        isValid = false;
      }
    } else if (!twoFactorCode.trim()) {
      newErrors.code = 'Security code is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const goToPortal = (portal: 'admin' | 'client') => {
    navigate(portal === 'client' ? '/client-dashboard' : '/dashboard', { replace: true });
  };

  useGoogleSignInButton(
    googleBtnRef,
    async (idToken) => {
      setIsLoading(true);
      try {
        const portal = await googleLogin(idToken);
        toast.success('Login successful');
        goToPortal(portal);
      } catch (err) {
        toast.error(err instanceof GuvihostApiError ? err.message : 'Google login failed');
      } finally {
        setIsLoading(false);
      }
    },
    isLoading || !!twoFactorPending
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    setIsLoading(true);
    try {
      if (twoFactorPending) {
        const portal = await verifyTwoFactor(twoFactorCode.trim());
        toast.success('Login successful');
        goToPortal(portal);
        return;
      }

      const result = await login(email, password, rememberMe);
      if (result === 'two_factor') {
        toast.message('Check your email for the security code');
        return;
      }

      toast.success('Login successful');
      goToPortal(result);
    } catch (error: unknown) {
      const message =
        error instanceof GuvihostApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Invalid credentials';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    cancelTwoFactor();
    setTwoFactorCode('');
    setErrors({ email: '', password: '', code: '' });
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#ffffff] font-sans">
      
      {/* LEFT PANEL - Branding & Features */}
      <div className="hidden lg:flex w-[40%] bg-[#eff4fa] flex-col py-12 px-16 border-r border-blue-100/50">
        
        {/* Header Logo */}
        <div className="flex items-center gap-3 mb-10">
          <div className="bg-[#0b5cff] text-white rounded-lg font-bold text-3xl italic flex items-center justify-center w-14 h-14 shadow-lg shadow-blue-500/30">
            G
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-[#0a1b3f] tracking-tight">GUVIHOST</h1>
            <p className="text-[10px] font-bold text-gray-500 tracking-[0.2em] uppercase mt-0.5">
              — Cloud • Hosting • Solutions —
            </p>
          </div>
        </div>

        {/* Welcome Text */}
        <div className="text-center mb-8">
          <h2 className="text-[28px] font-bold text-[#1a2b4f] mb-3">Welcome Back!</h2>
          <p className="text-[#64748b] text-[15px] leading-relaxed max-w-xs mx-auto">
            Login to your Guvihost client area and manage your services.
          </p>
        </div>

        {/* Illustration Image replaced with the imported image */}
        <div className="relative w-full max-w-[320px] mx-auto mb-10">
          <img 
            src={leftAuthImage} // USE THE IMPORTED IMAGE HERE
            alt="Cloud Hosting Illustration" 
            className="w-full h-auto object-contain drop-shadow-xl"
          />
        </div>

        {/* Feature List */}
        <div className="space-y-6 ">
          <FeatureItem 
            icon={<Box size={20} />} 
            title="Manage Services" 
            desc="Manage your hosting, domains, and other services in one place." 
          />
          <FeatureItem 
            icon={<ShieldCheck size={20} />} 
            title="Secure & Reliable" 
            desc="Top-notch security and 99.9% uptime for your services." 
          />
          <FeatureItem 
            icon={<Headset size={20} />} 
            title="24/7 Support" 
            desc="Our expert support team is always here to help you." 
          />
          <FeatureItem 
            icon={<Tag size={20} />} 
            title="Best Prices" 
            desc="Get the best hosting solutions at unbeatable prices." 
          />
        </div>
      </div>

      {/* RIGHT PANEL - Login Form */}
      <div className="w-full lg:w-[60%] flex items-center justify-center p-6 sm:p-12 mt-24">
        <div className="w-full max-w-[620px] bg-white rounded-[2rem] shadow-[0_8px_40px_rgb(0,0,0,0.04)] border border-gray-100 p-10 sm:p-14">
          
          <div className="text-center mb-10">
            <h2 className="text-[28px] font-bold text-[#0a1b3f] mb-2">
              {twoFactorPending ? 'Two-Factor Verification' : 'Client Login'}
            </h2>
            <p className="text-gray-500 text-[15px]">
              {twoFactorPending
                ? `Enter the code sent to ${twoFactorPending.email}`
                : 'Enter your credentials to access your account'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {twoFactorPending ? (
              <>
                <div className="space-y-2">
                  <label className="text-[14px] font-semibold text-gray-800">Security Code</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                      <KeyRound size={20} strokeWidth={1.5} />
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={twoFactorCode}
                      onChange={(e) => {
                        setTwoFactorCode(e.target.value);
                        if (errors.code) setErrors({ ...errors, code: '' });
                      }}
                      placeholder="Enter 6-digit code"
                      className={`block w-full pl-12 pr-4 py-3.5 border ${errors.code ? 'border-red-500' : 'border-gray-200'} rounded-xl text-[15px] text-gray-700 outline-none transition-all tracking-widest`}
                    />
                  </div>
                  {errors.code && <p className="text-red-500 text-xs font-medium mt-1">{errors.code}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-[15px] font-semibold text-white bg-[#0b5cff] hover:bg-blue-700 disabled:opacity-70"
                >
                  {isLoading ? 'Verifying...' : 'Verify & Login'}
                </button>

                <button
                  type="button"
                  onClick={handleBackToLogin}
                  className="w-full flex items-center justify-center gap-2 py-3 text-[14px] font-medium text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft size={16} />
                  Back to login
                </button>
              </>
            ) : (
              <>
            {/* Email Address */}
            <div className="space-y-2">
              <label className="text-[14px] font-semibold text-gray-800">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <Mail size={20} strokeWidth={1.5} />
                </div>
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors({...errors, email: ''});
                  }}
                  placeholder="Enter your email address"
                  className={`block w-full pl-12 pr-4 py-3.5 border ${errors.email ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-200 focus:ring-blue-600 focus:border-blue-600'} rounded-xl text-[15px] text-gray-700 outline-none transition-all`}
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs font-medium mt-1">{errors.email}</p>}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-[14px] font-semibold text-gray-800">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <Lock size={20} strokeWidth={1.5} />
                </div>
                <input 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors({...errors, password: ''});
                  }}
                  placeholder="Enter your password"
                  className={`block w-full pl-12 pr-12 py-3.5 border ${errors.password ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-200 focus:ring-blue-600 focus:border-blue-600'} rounded-xl text-[15px] text-gray-700 outline-none transition-all`}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} strokeWidth={1.5} /> : <Eye size={20} strokeWidth={1.5} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs font-medium mt-1">{errors.password}</p>}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center">
                <input 
                  id="remember-me" 
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-[#0b5cff] focus:ring-[#0b5cff] border-gray-300 rounded cursor-pointer" 
                />
                <label htmlFor="remember-me" className="ml-2.5 block text-[14px] text-gray-700 font-medium cursor-pointer">
                  Remember Me
                </label>
              </div>
              <Link to="/forgot-password" className="text-[14px] font-semibold text-[#0b5cff] hover:text-blue-700 transition-colors">
                Forgot Password?
              </Link>
            </div>

            {/* Login Button */}
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-md shadow-blue-500/20 text-[15px] font-semibold text-white bg-[#0b5cff] hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 disabled:opacity-70 transition-all mt-2"
            >
              <LogIn size={20} strokeWidth={2} />
              {isLoading ? 'Logging in...' : 'Login to Account'}
            </button>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-400 font-medium">or</span>
              </div>
            </div>

            {/* Google Login */}
            {isGoogleLoginAvailable() ? (
              <div ref={googleBtnRef} className="flex justify-center min-h-[44px]" />
            ) : (
              <p className="text-center text-xs text-gray-400">
                Google login unavailable — set VITE_GOOGLE_CLIENT_ID in .env
              </p>
            )}
              </>
            )}

          </form>

          <p className="mt-8 text-center text-[15px] text-gray-500 font-medium">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-[#0b5cff] hover:text-blue-700 transition-colors">
              Create Account
            </Link>
          </p>
        </div>
      </div>

    </div>
  );
}

// Subcomponent for the Left Panel Feature Items
function FeatureItem({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="bg-[#0b5cff] text-white p-2.5 rounded-lg shadow-md shadow-blue-500/20 shrink-0">
        {icon}
      </div>
      <div className="pt-0.5">
        <h4 className="font-bold text-[#0a1b3f] text-[15px] mb-1">{title}</h4>
        <p className="text-[13px] text-[#64748b] leading-relaxed pr-4">{desc}</p>
      </div>
    </div>
  );
}