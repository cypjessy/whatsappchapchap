interface Step1Props {
  formData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
  };
  termsAccepted: boolean;
  passwordStrength: number;
  strengthInfo: { class: string; text: string; color: string };
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onTermsChange: (checked: boolean) => void;
}

export default function Step1Account({
  formData,
  termsAccepted,
  passwordStrength,
  strengthInfo,
  onChange,
  onTermsChange,
}: Step1Props) {
  return (
    <div className="animate-[fadeIn_0.4s_ease]">
      <h3 className="text-xl md:text-2xl font-extrabold mb-1 md:mb-2">Create your account</h3>
      <p className="text-on-surface-variant mb-4 md:mb-6 text-sm md:text-base">Let&apos;s get you started with your account</p>

      <div className="grid grid-cols-2 gap-3 md:gap-4 mb-3 md:mb-4">
        <div>
          <label className="block text-xs md:text-sm font-semibold mb-1.5 md:mb-2">First Name</label>
          <input
            type="text"
            id="firstName"
            value={formData.firstName}
            onChange={onChange}
            className="w-full px-3 md:px-4 py-3 md:py-3.5 border-2 border-outline-variant rounded-xl 
              focus:border-[#25D366] focus:outline-none text-sm md:text-base 
              transition-all duration-300 hover:border-[#c4b5fd] hover:shadow-md3-level1
              bg-[#fafafa] focus:bg-white focus:shadow-[0_0_0_4px_rgba(37,211,102,0.1)]"
            placeholder="John"
          />
        </div>
        <div>
          <label className="block text-xs md:text-sm font-semibold mb-1.5 md:mb-2">Last Name</label>
          <input
            type="text"
            id="lastName"
            value={formData.lastName}
            onChange={onChange}
            className="w-full px-3 md:px-4 py-3 md:py-3.5 border-2 border-outline-variant rounded-xl 
              focus:border-[#25D366] focus:outline-none text-sm md:text-base 
              transition-all duration-300 hover:border-[#c4b5fd] hover:shadow-md3-level1
              bg-[#fafafa] focus:bg-white focus:shadow-[0_0_0_4px_rgba(37,211,102,0.1)]"
            placeholder="Doe"
          />
        </div>
      </div>

      <div className="mb-3 md:mb-4">
        <label className="block text-xs md:text-sm font-semibold mb-1.5 md:mb-2">Email Address</label>
        <input
          type="email"
          id="email"
          value={formData.email}
          onChange={onChange}
          className="w-full px-3 md:px-4 py-3 md:py-3.5 border-2 border-outline-variant rounded-xl 
            focus:border-[#25D366] focus:outline-none text-sm md:text-base 
            transition-all duration-300 hover:border-[#c4b5fd] hover:shadow-md3-level1
            bg-[#fafafa] focus:bg-white focus:shadow-[0_0_0_4px_rgba(37,211,102,0.1)]"
          placeholder="john@example.com"
        />
      </div>

      <div className="mb-3 md:mb-4">
        <label className="block text-xs md:text-sm font-semibold mb-1.5 md:mb-2">Phone Number</label>
        <input
          type="tel"
          id="phone"
          value={formData.phone}
          onChange={onChange}
          className="w-full px-3 md:px-4 py-3 md:py-3.5 border-2 border-outline-variant rounded-xl 
            focus:border-[#25D366] focus:outline-none text-sm md:text-base 
            transition-all duration-300 hover:border-[#c4b5fd] hover:shadow-md3-level1
            bg-[#fafafa] focus:bg-white focus:shadow-[0_0_0_4px_rgba(37,211,102,0.1)]"
          placeholder="+254 712 345 678"
        />
      </div>

      <div className="mb-4">
        <label className="block text-xs md:text-sm font-semibold mb-1.5 md:mb-2">Password</label>
        <input
          type="password"
          id="password"
          value={formData.password}
          onChange={onChange}
          className="w-full px-3 md:px-4 py-3 md:py-3.5 border-2 border-outline-variant rounded-xl 
            focus:border-[#25D366] focus:outline-none text-sm md:text-base 
            transition-all duration-300 hover:border-[#c4b5fd] hover:shadow-md3-level1
            bg-[#fafafa] focus:bg-white focus:shadow-[0_0_0_4px_rgba(37,211,102,0.1)]"
          placeholder="Create a strong password"
        />
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1 h-1.5 md:h-2 bg-surface-variant rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                passwordStrength < 3 ? "bg-red-500" : passwordStrength < 5 ? "bg-yellow-500" : "bg-green-500"
              }`}
              style={{ width: `${(passwordStrength / 5) * 100}%` }}
            />
          </div>
          <span className={`text-xs font-semibold ${strengthInfo.color}`}>{strengthInfo.text}</span>
        </div>
      </div>

      <div className="mb-4 md:mb-6">
        <label className="flex items-center gap-3 cursor-pointer select-none group">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => onTermsChange(e.target.checked)}
            className="w-5 h-5 accent-[#25D366] cursor-pointer"
          />
          <span className="text-xs md:text-sm text-on-surface-variant group-hover:text-[#1a1a2e] transition-colors">
            I agree to the{" "}
            <a href="#" className="text-[#25D366] font-semibold">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-[#25D366] font-semibold">
              Privacy Policy
            </a>
          </span>
        </label>
      </div>
    </div>
  );
}
