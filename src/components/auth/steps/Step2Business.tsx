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
    <div className="animate-[fadeIn_0.4s_ease]">
      <h3 className="text-xl md:text-2xl font-extrabold mb-1 md:mb-2">Business Information</h3>
      <p className="text-[#64748b] mb-4 md:mb-6 text-sm md:text-base">Tell us about your business</p>

      <div className="mb-4 md:mb-6">
        <label className="block text-xs md:text-sm font-semibold mb-2 md:mb-3">Business Type</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
          {businessTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => onTypeSelect(type.id)}
              className={`py-3 md:py-4 px-2 md:px-3 rounded-xl border-2 transition-all duration-300 
                flex flex-col items-center gap-1.5 md:gap-2 
                active:scale-95 select-none
                ${
                selectedBusinessType === type.id
                  ? "border-[#25D366] bg-[#f0fdf4] text-[#25D366] shadow-md"
                  : "border-[#e2e8f0] text-[#64748b] hover:border-[#25D366] hover:shadow-sm"
              }`}
            >
              <i className={`fas ${type.icon} text-lg md:text-xl transition-transform duration-300 ${
                selectedBusinessType === type.id ? 'scale-110' : ''
              }`}></i>
              <span className="text-xs md:text-sm font-semibold">{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3 md:mb-4">
        <label className="block text-xs md:text-sm font-semibold mb-1.5 md:mb-2">Business Name</label>
        <input
          type="text"
          id="businessName"
          value={formData.businessName}
          onChange={onChange}
          className="w-full px-3 md:px-4 py-3 md:py-3.5 border-2 border-[#e2e8f0] rounded-xl 
            focus:border-[#25D366] focus:outline-none text-sm md:text-base 
            transition-all duration-300 hover:border-[#c4b5fd] hover:shadow-sm
            bg-[#fafafa] focus:bg-white focus:shadow-[0_0_0_4px_rgba(37,211,102,0.1)]"
          placeholder="Your Business Name"
        />
      </div>

      <div className="mb-3 md:mb-4">
        <label className="block text-xs md:text-sm font-semibold mb-1.5 md:mb-2">Category</label>
        <select
          id="category"
          value={formData.category}
          onChange={onChange}
          className="w-full px-3 md:px-4 py-3 md:py-3.5 border-2 border-[#e2e8f0] rounded-xl 
            focus:border-[#25D366] focus:outline-none text-sm md:text-base 
            transition-all duration-300 hover:border-[#c4b5fd] hover:shadow-sm
            bg-[#fafafa] focus:bg-white focus:shadow-[0_0_0_4px_rgba(37,211,102,0.1)]"
        >
          <option value="">Select a category</option>
          <option value="fashion">Fashion & Clothing</option>
          <option value="electronics">Electronics</option>
          <option value="food">Food & Beverages</option>
          <option value="health">Health & Beauty</option>
          <option value="home">Home & Garden</option>
          <option value="sports">Sports & Outdoors</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2 md:gap-4">
        <div>
          <label className="block text-xs md:text-sm font-semibold mb-1.5 md:mb-2">Country</label>
          <select
            id="country"
            value={formData.country}
            onChange={onChange}
            className="w-full px-3 md:px-4 py-3 md:py-3.5 border-2 border-[#e2e8f0] rounded-xl 
              focus:border-[#25D366] focus:outline-none text-sm md:text-base 
              transition-all duration-300 hover:border-[#c4b5fd] hover:shadow-sm
              bg-[#fafafa] focus:bg-white focus:shadow-[0_0_0_4px_rgba(37,211,102,0.1)]"
          >
            <option value="KE">Kenya</option>
            <option value="NG">Nigeria</option>
            <option value="ZA">South Africa</option>
            <option value="GH">Ghana</option>
            <option value="TZ">Tanzania</option>
            <option value="UG">Uganda</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-xs md:text-sm font-semibold mb-1.5 md:mb-2">Currency</label>
          <input
            type="text"
            id="currency"
            value={formData.currency}
            onChange={onChange}
            className="w-full px-3 md:px-4 py-3 md:py-3.5 border-2 border-[#e2e8f0] rounded-xl 
              focus:border-[#25D366] focus:outline-none text-sm md:text-base 
              bg-white cursor-not-allowed"
            readOnly
          />
        </div>
      </div>
    </div>
  );
}
