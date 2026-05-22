interface Step2Props {
  formData: {
    businessName: string;
    category: string;
    country: string;
    currency: string;
  };
  selectedBusinessType: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onTypeSelect: (type: string) => void;
}

const businessTypes = [
  { id: "retail", label: "Retail", icon: "fa-store" },
  { id: "wholesale", label: "Wholesale", icon: "fa-warehouse" },
  { id: "services", label: "Services", icon: "fa-concierge-bell" },
  { id: "manufacturing", label: "Manufacturing", icon: "fa-industry" },
];

export default function Step2Business({
  formData,
  selectedBusinessType,
  onChange,
  onTypeSelect,
}: Step2Props) {
  return (
    <div className="animate-[fadeIn_0.35s_ease] flex flex-col gap-6 px-1">
      {/* M3 Headline */}
      <div className="mb-2">
        <h1 className="text-[1.75rem] font-normal tracking-tight text-[#1C1B1F]">
          Business information
        </h1>
        <p className="text-base text-[#49454F] mt-1.5 leading-relaxed">
          Tell us about your business
        </p>
      </div>

      {/* Business Type - M3 Filled Tonal Chips */}
      <div>
        <label className="block text-sm font-medium text-[#1C1B1F] mb-3">
          Business type
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {businessTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => onTypeSelect(type.id)}
              className={`h-[72px] flex flex-col items-center justify-center gap-1.5 rounded-2xl text-sm font-medium transition-all duration-200 ${
                selectedBusinessType === type.id
                  ? "bg-[#DCF8C6] text-[#1C1B1F] border-2 border-[#25D366] shadow-sm"
                  : "bg-[#F5F5F5] text-[#49454F] border-2 border-transparent hover:bg-[#E8E8E8] active:scale-[0.98]"
              }`}
            >
              <i className={`fas ${type.icon} text-xl`}></i>
              <span className="text-xs font-semibold">{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Business Name */}
      <div className="relative">
        <input
          type="text"
          id="businessName"
          value={formData.businessName}
          onChange={onChange}
          placeholder="Business name"
          className="peer w-full h-14 px-4 pt-4 pb-1.5 text-base text-[#1C1B1F] bg-transparent border-2 border-[#79747E] rounded-xl focus:border-[#25D366] focus:outline-none transition-colors placeholder-shown:pt-3.5"
        />
        <label
          htmlFor="businessName"
          className="absolute left-4 top-2 text-xs text-[#49454F] peer-focus:text-[#25D366] peer-placeholder-shown:text-base peer-placeholder-shown:top-4 transition-all pointer-events-none"
        >
          Business name
        </label>
      </div>

      {/* Category */}
      <div className="relative">
        <select
          id="category"
          value={formData.category}
          onChange={onChange}
          className="w-full h-14 px-4 pt-4 pb-1.5 text-base text-[#1C1B1F] bg-transparent border-2 border-[#79747E] rounded-xl focus:border-[#25D366] focus:outline-none transition-colors appearance-none"
        >
          <option value="" disabled>Select a category</option>
          <option value="fashion">Fashion & Clothing</option>
          <option value="electronics">Electronics</option>
          <option value="food">Food & Beverages</option>
          <option value="health">Health & Beauty</option>
          <option value="home">Home & Garden</option>
          <option value="sports">Sports & Outdoors</option>
          <option value="other">Other</option>
        </select>
        <label className="absolute left-4 top-2 text-xs text-[#25D366] pointer-events-none">
          Category
        </label>
        <svg
          className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#49454F] pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Country + Currency Row */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <select
            id="country"
            value={formData.country}
            onChange={onChange}
            className="w-full h-14 px-4 pt-4 pb-1.5 text-base text-[#1C1B1F] bg-transparent border-2 border-[#79747E] rounded-xl focus:border-[#25D366] focus:outline-none transition-colors appearance-none"
          >
            <option value="KE">Kenya</option>
            <option value="NG">Nigeria</option>
            <option value="ZA">South Africa</option>
            <option value="GH">Ghana</option>
            <option value="TZ">Tanzania</option>
            <option value="UG">Uganda</option>
            <option value="other">Other</option>
          </select>
          <label className="absolute left-4 top-2 text-xs text-[#25D366] pointer-events-none">
            Country
          </label>
          <svg
            className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#49454F] pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        <div className="flex-1 relative">
          <input
            type="text"
            id="currency"
            value={formData.currency}
            readOnly
            className="w-full h-14 px-4 pt-4 pb-1.5 text-base text-[#1C1B1F] bg-[#F5F5F5] border-2 border-[#CAC4D0] rounded-xl cursor-default"
          />
          <label className="absolute left-4 top-2 text-xs text-[#49454F] pointer-events-none">
            Currency
          </label>
        </div>
      </div>
    </div>
  );
}
