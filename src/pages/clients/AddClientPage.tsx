import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { createClient } from '@/lib/api';
import { GuvihostApiError } from '@/lib/guvihost-api';
import { toast } from 'sonner';
import { Eye, EyeOff, Calendar } from 'lucide-react';

export default function AddClientPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    companyName: '', taxId: '', username: '', password: '',
    confirmPassword: '', dob: '', address: '', country: 'India',
    state: '', city: '', zipCode: '', clientGroup: '',
    language: 'English', currency: 'INR - Indian Rupee (₹)',
    paymentMethod: '', creditLimit: '0.00', taxExempt: false,
    sendWelcomeEmail: true, clientLoginDetails: true,
    billingNotifications: true, supportNotifications: true,
    internalNotes: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleToggle = (name: string) => {
    setFormData(prev => ({ ...prev, [name]: !(prev as Record<string, unknown>)[name] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const languageMap: Record<string, string> = { English: 'en', Hindi: 'hi', Tamil: 'ta' };
      await createClient({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        phoneCountryCode: '+91',
        company: formData.companyName || undefined,
        gstin: formData.taxId || undefined,
        username: formData.username,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        dateOfBirth: formData.dob || undefined,
        address: formData.address || undefined,
        country: formData.country,
        state: formData.state || undefined,
        city: formData.city || undefined,
        postalCode: formData.zipCode || undefined,
        language: languageMap[formData.language] ?? 'en',
        currency: formData.currency.startsWith('USD') ? 'USD' : 'INR',
        creditLimit: parseFloat(formData.creditLimit) || 0,
        taxExempt: formData.taxExempt,
        sendWelcomeEmail: formData.sendWelcomeEmail,
        sendLoginDetails: formData.clientLoginDetails,
        internalNotes: formData.internalNotes || undefined,
      });
      toast.success('Client created successfully');
      navigate('/clients/all');
    } catch (err) {
      toast.error(err instanceof GuvihostApiError ? err.message : 'Failed to create client');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="bg-[#ffffff] min-h-full p-4 sm:p-6 font-sans">
        
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Add New Client</h1>
          <p className="text-sm text-slate-500 mt-1">Create a new client profile and configure their account preferences.</p>
        </div>

        <form className="flex flex-col xl:flex-row gap-6" onSubmit={handleSubmit}>
          
          {/* LEFT COLUMN: Personal Information */}
          <div className="flex-1">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">
              <h2 className="text-base font-bold text-[#0a1b3f] mb-6">Personal Information</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                <InputField label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="Enter first name" required />
                <InputField label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Enter last name" required />
                
                <InputField label="Email Address" type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Enter email address" required />
                
                {/* Custom Phone Input */}
                <div className="space-y-1.5">
                  <label className="text-[13px] font-semibold text-slate-800">Phone Number <span className="text-red-500">*</span></label>
                  <div className="flex h-11">
                    <div className="flex items-center justify-center px-3 border border-r-0 border-slate-200 bg-slate-50 rounded-l-xl text-sm font-medium text-slate-600 shrink-0">
                      🇮🇳 <span className="ml-2">+91</span>
                    </div>
                    <input 
                      type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="Enter phone number" required
                      className="block w-full px-4 border border-slate-200 rounded-r-xl focus:ring-1 focus:ring-blue-600 focus:border-blue-600 text-[14px] text-slate-800 outline-none transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <InputField label="Company Name" name="companyName" value={formData.companyName} onChange={handleChange} placeholder="Enter company name" />
                <InputField label="Tax ID / GSTIN" name="taxId" value={formData.taxId} onChange={handleChange} placeholder="Enter tax id or gstin" />
                
                <InputField label="Username" name="username" value={formData.username} onChange={handleChange} placeholder="Enter username" required />
                
                {/* Password Input */}
                <div className="space-y-1.5">
                  <label className="text-[13px] font-semibold text-slate-800">Password <span className="text-red-500">*</span></label>
                  <div className="relative h-11">
                    <input 
                      type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} placeholder="Enter password" required
                      className="block w-full h-full pl-4 pr-10 border border-slate-200 rounded-xl focus:ring-1 focus:ring-blue-600 focus:border-blue-600 text-[14px] text-slate-800 outline-none transition-all placeholder:text-slate-400"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password Input */}
                <div className="space-y-1.5">
                  <label className="text-[13px] font-semibold text-slate-800">Confirm Password <span className="text-red-500">*</span></label>
                  <div className="relative h-11">
                    <input 
                      type={showConfirmPassword ? "text" : "password"} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm password" required
                      className="block w-full h-full pl-4 pr-10 border border-slate-200 rounded-xl focus:ring-1 focus:ring-blue-600 focus:border-blue-600 text-[14px] text-slate-800 outline-none transition-all placeholder:text-slate-400"
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600">
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Date of Birth Input */}
                <div className="space-y-1.5">
                  <label className="text-[13px] font-semibold text-slate-800">Date of Birth</label>
                  <div className="relative h-11">
                    <input 
                      type="date" name="dob" value={formData.dob} onChange={handleChange}
                      className="block w-full h-full pl-4 pr-10 border border-slate-200 rounded-xl focus:ring-1 focus:ring-blue-600 focus:border-blue-600 text-[14px] text-slate-800 outline-none transition-all text-slate-500"
                    />
                    <Calendar size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Full Address Textarea */}
                <div className="col-span-1 sm:col-span-2 space-y-1.5">
                  <label className="text-[13px] font-semibold text-slate-800">Address</label>
                  <textarea 
                    name="address" value={formData.address} onChange={handleChange} placeholder="Enter full address" rows={3}
                    className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-1 focus:ring-blue-600 focus:border-blue-600 text-[14px] text-slate-800 outline-none transition-all placeholder:text-slate-400 resize-none"
                  />
                </div>

                <SelectField label="Country" name="country" value={formData.country} onChange={handleChange} options={['India', 'USA', 'UK']} required />
                <SelectField label="State / Province" name="state" value={formData.state} onChange={handleChange} options={['Tamil Nadu', 'Kerala', 'Karnataka', 'Maharashtra']} required />
                <InputField label="City" name="city" value={formData.city} onChange={handleChange} placeholder="Enter city" required />
                <InputField label="Postal / Zip Code" name="zipCode" value={formData.zipCode} onChange={handleChange} placeholder="Enter postal / zip code" required />

              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 mt-8 pt-6 border-t border-slate-100">
                <button type="submit" disabled={submitting} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-[14px] font-semibold rounded-lg shadow-sm shadow-blue-500/20 transition-colors">
                  {submitting ? 'Saving...' : 'Save Client'}
                </button>
                <button type="button" onClick={() => window.location.reload()} className="px-6 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[14px] font-semibold rounded-lg transition-colors">
                  Reset
                </button>
              </div>

            </div>
          </div>

          {/* RIGHT COLUMN: Settings & Preferences */}
          <div className="w-full xl:w-[420px] shrink-0 space-y-6">
            
            {/* Additional Information */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">
              <h2 className="text-base font-bold text-[#0a1b3f] mb-6">Additional Information</h2>
              <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                <SelectField label="Client Group" name="clientGroup" value={formData.clientGroup} onChange={handleChange} options={['Individual', 'Corporate', 'Reseller']} />
                <SelectField label="Language" name="language" value={formData.language} onChange={handleChange} options={['English', 'Hindi', 'Tamil']} />
                <SelectField label="Currency" name="currency" value={formData.currency} onChange={handleChange} options={['INR - Indian Rupee (₹)', 'USD - US Dollar ($)']} />
                <SelectField label="Payment Method" name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} options={['Credit Card', 'Bank Transfer', 'UPI', 'PayPal']} />
                
                <InputField label="Credit Limit" name="creditLimit" value={formData.creditLimit} onChange={handleChange} placeholder="0.00" />
                
                <div className="space-y-2 flex flex-col justify-center">
                  <label className="text-[13px] font-semibold text-slate-800">Tax Exempt</label>
                  <div className="flex items-center gap-2 mt-1">
                    <ToggleSwitch active={formData.taxExempt} onClick={() => handleToggle('taxExempt')} />
                    <span className="text-[13px] text-slate-600">Yes, exempt from tax</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Email Preferences */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">
              <h2 className="text-base font-bold text-[#0a1b3f] mb-6">Email Preferences</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-semibold text-slate-800">Send Welcome Email</span>
                  <ToggleSwitch active={formData.sendWelcomeEmail} onClick={() => handleToggle('sendWelcomeEmail')} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-semibold text-slate-800">Client Login Details</span>
                  <ToggleSwitch active={formData.clientLoginDetails} onClick={() => handleToggle('clientLoginDetails')} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-semibold text-slate-800">Billing Notifications</span>
                  <ToggleSwitch active={formData.billingNotifications} onClick={() => handleToggle('billingNotifications')} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-semibold text-slate-800">Support Notifications</span>
                  <ToggleSwitch active={formData.supportNotifications} onClick={() => handleToggle('supportNotifications')} />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">
              <h2 className="text-base font-bold text-[#0a1b3f] mb-6">Notes</h2>
              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold text-slate-800">Internal Notes</label>
                <textarea 
                  name="internalNotes" value={formData.internalNotes} onChange={handleChange} placeholder="Add any internal notes about this client..." rows={4}
                  className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-1 focus:ring-blue-600 focus:border-blue-600 text-[14px] text-slate-800 outline-none transition-all placeholder:text-slate-400 resize-none"
                />
              </div>
            </div>

          </div>
        </form>

      </div>
    </AdminLayout>
  );
}

// --- SUBCOMPONENTS ---

function InputField({ label, name, type = "text", value, onChange, placeholder, required = false }: any) {
  return (
    <div className="space-y-1.5 w-full">
      <label className="text-[13px] font-semibold text-slate-800">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input 
        type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} required={required}
        className="block w-full h-11 px-4 border border-slate-200 rounded-xl focus:ring-1 focus:ring-blue-600 focus:border-blue-600 text-[14px] text-slate-800 outline-none transition-all placeholder:text-slate-400"
      />
    </div>
  );
}

function SelectField({ label, name, value, onChange, options, required = false }: any) {
  return (
    <div className="space-y-1.5 w-full">
      <label className="text-[13px] font-semibold text-slate-800">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        name={name} value={value} onChange={onChange} required={required}
        className="block w-full h-11 px-4 border border-slate-200 rounded-xl focus:ring-1 focus:ring-blue-600 focus:border-blue-600 text-[14px] text-slate-800 outline-none transition-all bg-white appearance-none"
        style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right .75rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.2em 1.2em` }}
      >
        <option value="" disabled>Select {label.split(' ')[0].toLowerCase()}</option>
        {options.map((opt: string) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

// Custom Toggle Switch matching the image style
function ToggleSwitch({ active, onClick }: { active: boolean, onClick: () => void }) {
  return (
    <button 
      type="button" 
      onClick={onClick}
      className={`relative inline-flex h-[22px] w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${active ? 'bg-blue-600' : 'bg-slate-200'}`}
    >
      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${active ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  );
}