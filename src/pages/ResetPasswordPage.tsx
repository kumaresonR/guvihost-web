import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, Lock, CheckCircle, Box, ShieldCheck, Headset, Tag } from "lucide-react";
import { resetPassword } from "@/lib/api/auth";
import { GuvihostApiError } from "@/lib/guvihost-api";
import { toast } from "sonner";
import leftAuthImage from "@/assets/auth/login-left.png";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({ password: "", confirmPassword: "", token: "" });

  const validate = () => {
    const next = { password: "", confirmPassword: "", token: "" };
    let ok = true;

    if (!token) {
      next.token = "Invalid or missing reset link. Request a new password reset email.";
      ok = false;
    }
    if (password.length < 8) {
      next.password = "Password must be at least 8 characters";
      ok = false;
    }
    if (password !== confirmPassword) {
      next.confirmPassword = "Passwords do not match";
      ok = false;
    }

    setErrors(next);
    return ok;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      await resetPassword({ token, password, confirmPassword });
      setSuccess(true);
      toast.success("Password updated successfully");
      setTimeout(() => navigate("/login", { replace: true }), 2500);
    } catch (err) {
      const message =
        err instanceof GuvihostApiError ? err.message : "Failed to reset password";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!token && !success) {
    return (
      <AuthShell title="Invalid Reset Link" subtitle="This password reset link is invalid or has expired.">
        <div className="text-center space-y-6">
          <p className="text-gray-500 text-[15px]">{errors.token || "Request a new reset link from the forgot password page."}</p>
          <Link to="/forgot-password" className="text-[14px] font-semibold text-[#0b5cff] hover:text-blue-700">
            Request new reset link
          </Link>
          <Link to="/login" className="block text-[14px] font-medium text-gray-600 hover:text-gray-900">
            <ArrowLeft size={16} className="inline mr-1" />
            Back to Login
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={success ? "Password Updated" : "Set New Password"}
      subtitle={
        success
          ? "Your password has been updated. Redirecting to login..."
          : "Enter your new password below."
      }
    >
      {success ? (
        <div className="text-center space-y-6">
          <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto" />
          <Link to="/login" className="text-[14px] font-semibold text-[#0b5cff] hover:text-blue-700">
            Go to Login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[14px] font-semibold text-gray-800">New Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                <Lock size={20} strokeWidth={1.5} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors({ ...errors, password: "" });
                }}
                placeholder="Enter new password (min 8 characters)"
                className={`block w-full pl-12 pr-12 py-3.5 border ${errors.password ? "border-red-500" : "border-gray-200"} rounded-xl text-[15px] text-gray-700 outline-none`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-xs font-medium">{errors.password}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-[14px] font-semibold text-gray-800">Confirm Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                <Lock size={20} strokeWidth={1.5} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: "" });
                }}
                placeholder="Confirm new password"
                className={`block w-full pl-12 pr-4 py-3.5 border ${errors.confirmPassword ? "border-red-500" : "border-gray-200"} rounded-xl text-[15px] text-gray-700 outline-none`}
              />
            </div>
            {errors.confirmPassword && <p className="text-red-500 text-xs font-medium">{errors.confirmPassword}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-xl text-[15px] font-semibold text-white bg-[#0b5cff] hover:bg-blue-700 disabled:opacity-70"
          >
            {isLoading ? "Updating..." : "Update Password"}
          </button>

          <Link
            to="/login"
            className="w-full flex items-center justify-center gap-2 py-3 text-[14px] font-medium text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={16} />
            Back to Login
          </Link>
        </form>
      )}
    </AuthShell>
  );
}

function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#ffffff] font-sans">
      <div className="hidden lg:flex w-[40%] bg-[#eff4fa] flex-col py-12 px-16 border-r border-blue-100/50">
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
        <div className="relative w-full max-w-[320px] mx-auto mb-10">
          <img src={leftAuthImage} alt="Cloud Hosting Illustration" className="w-full h-auto object-contain drop-shadow-xl" />
        </div>
        <div className="space-y-6">
          <FeatureItem icon={<Box size={20} />} title="Secure Reset" desc="Choose a strong password to protect your account." />
          <FeatureItem icon={<ShieldCheck size={20} />} title="Encrypted" desc="Your credentials are stored securely." />
          <FeatureItem icon={<Headset size={20} />} title="Support" desc="Contact us if you need help accessing your account." />
          <FeatureItem icon={<Tag size={20} />} title="Quick Recovery" desc="Get back to managing your hosting services." />
        </div>
      </div>

      <div className="w-full lg:w-[60%] flex items-center justify-center p-6 sm:p-12 mt-24">
        <div className="w-full max-w-[620px] bg-white rounded-[2rem] shadow-[0_8px_40px_rgb(0,0,0,0.04)] border border-gray-100 p-10 sm:p-14">
          <div className="text-center mb-10">
            <h2 className="text-[28px] font-bold text-[#0a1b3f] mb-2">{title}</h2>
            <p className="text-gray-500 text-[15px]">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="bg-[#0b5cff] text-white p-2.5 rounded-lg shadow-md shadow-blue-500/20 shrink-0">{icon}</div>
      <div className="pt-0.5">
        <h4 className="font-bold text-[#0a1b3f] text-[15px] mb-1">{title}</h4>
        <p className="text-[13px] text-[#64748b] leading-relaxed pr-4">{desc}</p>
      </div>
    </div>
  );
}
