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
    <div className="animate-[fadeIn_0.35s_ease] flex flex-col gap-6 px-1">
      {/* M3 Headline */}
      <div className="mb-2">
        <h1 className="text-[1.75rem] font-normal tracking-tight text-[#1C1B1F]">
          Create account
        </h1>
        <p className="text-base text-[#49454F] mt-1.5 leading-relaxed">
          Enter your details to get started
        </p>
      </div>

      {/* Name Row */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <input
              type="text"
              id="firstName"
              value={formData.firstName}
              onChange={onChange}
              placeholder="First name"
              className="peer w-full h-14 px-4 pt-4 pb-1.5 text-base text-[#1C1B1F] bg-transparent border-2 border-[#79747E] rounded-xl focus:border-[#25D366] focus:outline-none transition-colors placeholder-shown:pt-3.5 placeholder:text-transparent"
            />
            <label
              htmlFor="firstName"
              className="absolute left-4 top-2 text-xs text-[#49454F] peer-focus:text-[#25D366] peer-placeholder-shown:text-base peer-placeholder-shown:top-4 transition-all pointer-events-none"
            >
              First name
            </label>
          </div>
        </div>
        <div className="flex-1">
          <div className="relative">
            <input
              type="text"
              id="lastName"
              value={formData.lastName}
              onChange={onChange}
              placeholder="Last name"
              className="peer w-full h-14 px-4 pt-4 pb-1.5 text-base text-[#1C1B1F] bg-transparent border-2 border-[#79747E] rounded-xl focus:border-[#25D366] focus:outline-none transition-colors placeholder-shown:pt-3.5 placeholder:text-transparent"
            />
            <label
              htmlFor="lastName"
              className="absolute left-4 top-2 text-xs text-[#49454F] peer-focus:text-[#25D366] peer-placeholder-shown:text-base peer-placeholder-shown:top-4 transition-all pointer-events-none"
            >
              Last name
            </label>
          </div>
        </div>
      </div>

      {/* Email */}
      <div className="relative">
        <input
          type="email"
          id="email"
          value={formData.email}
          onChange={onChange}
          placeholder="Email address"
          className="peer w-full h-14 px-4 pt-4 pb-1.5 text-base text-[#1C1B1F] bg-transparent border-2 border-[#79747E] rounded-xl focus:border-[#25D366] focus:outline-none transition-colors placeholder-shown:pt-3.5 placeholder:text-transparent"
        />
        <label
          htmlFor="email"
          className="absolute left-4 top-2 text-xs text-[#49454F] peer-focus:text-[#25D366] peer-placeholder-shown:text-base peer-placeholder-shown:top-4 transition-all pointer-events-none"
        >
          Email address
        </label>
      </div>

      {/* Phone */}
      <div className="relative">
        <input
          type="tel"
          id="phone"
          value={formData.phone}
          onChange={onChange}
          placeholder="Phone number"
          className="peer w-full h-14 px-4 pt-4 pb-1.5 text-base text-[#1C1B1F] bg-transparent border-2 border-[#79747E] rounded-xl focus:border-[#25D366] focus:outline-none transition-colors placeholder-shown:pt-3.5 placeholder:text-transparent"
        />
        <label
          htmlFor="phone"
          className="absolute left-4 top-2 text-xs text-[#49454F] peer-focus:text-[#25D366] peer-placeholder-shown:text-base peer-placeholder-shown:top-4 transition-all pointer-events-none"
        >
          Phone number
        </label>
      </div>

      {/* Password */}
      <div>
        <div className="relative">
          <input
            type="password"
            id="password"
            value={formData.password}
            onChange={onChange}
            placeholder="Password"
            className="peer w-full h-14 px-4 pt-4 pb-1.5 text-base text-[#1C1B1F] bg-transparent border-2 border-[#79747E] rounded-xl focus:border-[#25D366] focus:outline-none transition-colors placeholder-shown:pt-3.5 placeholder:text-transparent"
          />
          <label
            htmlFor="password"
            className="absolute left-4 top-2 text-xs text-[#49454F] peer-focus:text-[#25D366] peer-placeholder-shown:text-base peer-placeholder-shown:top-4 transition-all pointer-events-none"
          >
            Password
          </label>
        </div>
        {/* M3 Linear Progress Indicator */}
        <div className="mt-3">
          <div className="h-1 bg-[#E7E0EC] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                passwordStrength < 3 ? "bg-[#B3261E]" : passwordStrength < 5 ? "bg-[#F9A03F]" : "bg-[#25D366]"
              }`}
              style={{ width: `${(passwordStrength / 5) * 100}%` }}
            />
          </div>
          <p className={`text-xs font-medium mt-1.5 ${strengthInfo.color}`}>
            {strengthInfo.text}
          </p>
        </div>
      </div>

      {/* Terms - M3 Checkbox */}
      <label className="flex items-start gap-3 cursor-pointer group mt-2">
        <div className="relative flex items-center justify-center w-5 h-5 mt-0.5 flex-shrink-0">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => onTermsChange(e.target.checked)}
            className="peer appearance-none w-5 h-5 border-2 border-[#79747E] rounded-sm checked:border-[#25D366] checked:bg-[#25D366] transition-all cursor-pointer"
          />
          <svg
            className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span className="text-sm text-[#49454F] leading-relaxed">
          I agree to the{" "}
          <a href="#" className="text-[#25D366] font-medium hover:underline">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="text-[#25D366] font-medium hover:underline">
            Privacy Policy
          </a>
        </span>
      </label>
    </div>
  );
}
