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
      <h3 className="text-2xl font-extrabold mb-2">Business Information</h3>
      <p className="text-[#64748b] mb-6">Tell us about your business</p>

      <div className="mb-6">
        <label className="block text-sm font-semibold mb-3">Business Type</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {businessTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => onTypeSelect(type.id)}
              className={`py-4 px-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                selectedBusinessType === type.id
                  ? "border-[#25D366] bg-[#f0fdf4] text-[#25D366]"
                  : "border-[#e2e8f0] text-[#64748b] hover:border-[#25D366]"
              }`}
            >
              <i className={`fas ${type.icon} text-xl`}></i>
              <span className="text-sm font-semibold">{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-semibold mb-2">Business Name</label>
        <input
          type="text"
          id="businessName"
          value={formData.businessName}
          onChange={onChange}
          className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl focus:border-[#25D366] focus:outline-none"
          placeholder="Your Business Name"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-semibold mb-2">Category</label>
        <select
          id="category"
          value={formData.category}
          onChange={onChange}
          className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl focus:border-[#25D366] focus:outline-none"
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-2">Country</label>
          <select
            id="country"
            value={formData.country}
            onChange={onChange}
            className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl focus:border-[#25D366] focus:outline-none"
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
          <label className="block text-sm font-semibold mb-2">Currency</label>
          <input
            type="text"
            id="currency"
            value={formData.currency}
            onChange={onChange}
            className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl focus:border-[#25D366] focus:outline-none bg-gray-50"
            readOnly
          />
        </div>
      </div>
    </div>
  );
}
