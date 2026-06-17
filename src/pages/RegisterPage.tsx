import React, { useState } from "react";
import {
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
  Headset,
  Tag,
  User,
  Server,
} from "lucide-react";
import { Link } from "react-router-dom";
import { registerClient } from "@/lib/api/auth";
import { GuvihostApiError, setAccessToken } from "@/lib/guvihost-api";
import { toast } from "sonner";
import logo from "../assets/auth/login-left.png";

const CLIENT_USER_KEY = "guvihost_client_user";

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!formData.firstName.trim()) next.firstName = "First name is required";
    if (!formData.lastName.trim()) next.lastName = "Last name is required";
    if (!formData.email.trim()) next.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) next.email = "Enter a valid email address";
    if (formData.phone && (formData.phone.length < 10 || formData.phone.length > 15)) {
      next.phone = "Phone must be 10–15 digits";
    }
    if (formData.password.length < 8) next.password = "Password must be at least 8 characters";
    if (formData.password !== formData.confirmPassword) next.confirmPassword = "Passwords do not match";
    if (!formData.agreeTerms) next.agreeTerms = "You must agree to the Terms of Service";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const body = {
        email: formData.email.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        ...(formData.phone.trim() ? { phone: formData.phone.trim(), phoneCountryCode: "+91" } : {}),
      };

      const result = await registerClient(body);
      setAccessToken(result.accessToken);

      const displayName =
        [result.user.firstName, result.user.lastName].filter(Boolean).join(" ") || result.user.email;
      localStorage.setItem(
        CLIENT_USER_KEY,
        JSON.stringify({
          id: result.user.id,
          name: displayName,
          email: result.user.email,
          mobile: formData.phone.trim(),
          customer_id: result.user.clientCode ?? result.user.id,
          password_set: true,
        })
      );

      toast.success("Account created successfully");
      window.location.href = "/client-dashboard";
    } catch (error: unknown) {
      const message =
        error instanceof GuvihostApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Registration failed";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#ffffff] font-sans">
      <div className="hidden lg:flex w-[40%] bg-[#040e29] flex-col py-12 px-14 border-r border-blue-900/50 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative w-full max-w-[320px] mx-auto mb-8 z-10">
          <img src={logo} alt="Cloud Servers Illustration" className="w-full h-auto object-contain drop-shadow-2xl opacity-90" />
        </div>

        <div className="mb-10 z-10">
          <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
            Create Your Account <br />
            <span className="text-blue-500">& Get Started!</span>
          </h2>
          <p className="text-[#94a3b8] text-[15px] leading-relaxed max-w-md">
            Join Guvihost and manage all your hosting, domains, emails and billing in one place.
          </p>
        </div>

        <div className="space-y-6 z-10 flex-1">
          <FeatureItem icon={<Server size={20} />} title="All-in-One Management" desc="Manage domains, hosting, emails and more from a single dashboard." />
          <FeatureItem icon={<ShieldCheck size={20} />} title="Secure & Reliable" desc="Enterprise-grade security with 99.9% uptime and 24/7 monitoring." />
          <FeatureItem icon={<Headset size={20} />} title="24/7 Expert Support" desc="Our support team is available around the clock to assist you." />
          <FeatureItem icon={<Tag size={20} />} title="Best Prices" desc="Get the best deals on hosting, domains, and email services." />
        </div>
      </div>

      <div className="w-full lg:w-[60%] h-full overflow-y-auto flex items-start justify-center p-6 sm:p-12 relative">
        <div className="w-full max-w-[640px] bg-white rounded-[2rem] shadow-[0_8px_40px_rgb(0,0,0,0.04)] border border-gray-100 p-8 sm:p-12 my-auto">
          <div className="text-center mb-10">
            <h2 className="text-[28px] font-bold text-[#0a1b3f] mb-2">Create Account</h2>
            <p className="text-gray-500 text-[15px]">Fill in the details below to create your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <h3 className="flex items-center gap-2 text-blue-600 font-bold text-[15px] mb-4">
                <User size={18} strokeWidth={2.5} /> Personal Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <InputField label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="Enter first name" required error={errors.firstName} />
                <InputField label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Enter last name" required error={errors.lastName} />
                <InputField label="Email Address" type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Enter email address" required error={errors.email} />
                <div className="space-y-2">
                  <label className="text-[13px] font-semibold text-gray-800">Phone Number <span className="text-gray-400 font-normal">(optional)</span></label>
                  <div className="flex">
                    <div className="flex items-center justify-center px-3 border border-r-0 border-gray-200 bg-gray-50 rounded-l-xl text-sm font-medium text-gray-600">
                      +91
                    </div>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Enter phone number"
                      className={`block w-full px-4 py-3 border ${errors.phone ? "border-red-500" : "border-gray-200"} rounded-r-xl focus:ring-blue-600 focus:border-blue-600 text-[14px] text-gray-700 outline-none transition-all`}
                    />
                  </div>
                  {errors.phone && <p className="text-red-500 text-xs font-medium">{errors.phone}</p>}
                </div>
              </div>
            </div>

            <div>
              <h3 className="flex items-center gap-2 text-blue-600 font-bold text-[15px] mb-4">
                <Lock size={18} strokeWidth={2.5} /> Account Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[13px] font-semibold text-gray-800">Password <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Create a password (min 8 chars)"
                      className={`block w-full pl-4 pr-10 py-3 border ${errors.password ? "border-red-500" : "border-gray-200"} rounded-xl focus:ring-blue-600 focus:border-blue-600 text-[14px] text-gray-700 outline-none transition-all`}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-xs font-medium">{errors.password}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-[13px] font-semibold text-gray-800">Confirm Password <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm your password"
                      className={`block w-full pl-4 pr-10 py-3 border ${errors.confirmPassword ? "border-red-500" : "border-gray-200"} rounded-xl focus:ring-blue-600 focus:border-blue-600 text-[14px] text-gray-700 outline-none transition-all`}
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-red-500 text-xs font-medium">{errors.confirmPassword}</p>}
                </div>
              </div>
            </div>

            <div className="flex items-start bg-blue-50 border border-blue-100 p-4 rounded-xl">
              <input
                id="agreeTerms"
                name="agreeTerms"
                type="checkbox"
                checked={formData.agreeTerms}
                onChange={handleChange}
                className="h-5 w-5 mt-0.5 text-[#0b5cff] focus:ring-[#0b5cff] border-gray-300 rounded cursor-pointer"
              />
              <label htmlFor="agreeTerms" className="ml-3 block text-[14px] text-gray-700 leading-relaxed cursor-pointer">
                I agree to the <a href="#" className="text-blue-600 font-semibold hover:underline">Terms of Service</a> and{" "}
                <a href="#" className="text-blue-600 font-semibold hover:underline">Privacy Policy</a>
              </label>
            </div>
            {errors.agreeTerms && <p className="text-red-500 text-xs font-medium -mt-4">{errors.agreeTerms}</p>}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-4 px-4 border border-transparent rounded-xl shadow-md shadow-blue-500/20 text-[16px] font-semibold text-white bg-[#0b5cff] hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 disabled:opacity-70 transition-all"
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </button>

              <p className="mt-8 text-center text-[15px] text-gray-500 font-medium">
                Already have an account?{" "}
                <Link to="/login" className="font-semibold text-[#0b5cff] hover:text-blue-700 transition-colors">
                  Login Here
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-4 group">
      <div className="bg-white/10 text-blue-400 p-3 rounded-xl border border-white/5 shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
        {icon}
      </div>
      <div className="pt-0.5">
        <h4 className="font-bold text-white text-[15px] mb-1">{title}</h4>
        <p className="text-[13px] text-[#94a3b8] leading-relaxed pr-4">{desc}</p>
      </div>
    </div>
  );
}

function InputField({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  error,
}: {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  required?: boolean;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-[13px] font-semibold text-gray-800">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`block w-full px-4 py-3 border ${error ? "border-red-500" : "border-gray-200"} rounded-xl focus:ring-blue-600 focus:border-blue-600 text-[14px] text-gray-700 outline-none transition-all placeholder:text-gray-400`}
      />
      {error && <p className="text-red-500 text-xs font-medium">{error}</p>}
    </div>
  );
}
