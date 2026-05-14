interface Step3Props {
  selectedPlan: string;
  yearlyBilling: boolean;
  onPlanSelect: (plan: string) => void;
  onBillingToggle: () => void;
}

const plans = [
  {
    id: "free",
    name: "Free",
    price: 0,
    features: ["Up to 50 customers", "Basic AI responses", "Email support"],
  },
  {
    id: "starter",
    name: "Starter",
    price: 29,
    features: ["Up to 500 customers", "Advanced AI responses", "Priority support", "Analytics"],
  },
  {
    id: "professional",
    name: "Professional",
    price: 79,
    features: ["Unlimited customers", "Custom AI training", "24/7 support", "Advanced analytics", "API access"],
  },
];

export default function Step3Plan({
  selectedPlan,
  yearlyBilling,
  onPlanSelect,
  onBillingToggle,
}: Step3Props) {
  return (
    <div className="animate-[fadeIn_0.4s_ease]">
      <h3 className="text-xl md:text-2xl font-extrabold mb-1 md:mb-2">Choose your plan</h3>
      <p className="text-[#64748b] mb-4 md:mb-6 text-sm md:text-base">Select the plan that best fits your needs</p>

      <div className="flex items-center justify-center gap-3 md:gap-4 mb-6 md:mb-8">
        <span className={`text-xs md:text-sm font-semibold transition-colors duration-300 ${!yearlyBilling ? "text-[#1a1a2e]" : "text-[#64748b]"}`}>Monthly</span>
        <button
          onClick={onBillingToggle}
          className={`w-12 md:w-14 h-6 md:h-7 rounded-full transition-all duration-300 active:scale-95 ${yearlyBilling ? "bg-[#25D366]" : "bg-[#e2e8f0]"}`}
        >
          <div
            className={`w-4 md:w-5 h-4 md:h-5 bg-white rounded-full shadow transition-transform duration-300 ${
              yearlyBilling ? "translate-x-7 md:translate-x-8" : "translate-x-1"
            }`}
          />
        </button>
        <span className={`text-xs md:text-sm font-semibold transition-colors duration-300 ${yearlyBilling ? "text-[#1a1a2e]" : "text-[#64748b]"}`}>
          Yearly <span className="text-[#25D366]">(Save 20%)</span>
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 md:gap-4">
        {plans.map((plan) => (
          <div
            key={plan.id}
            onClick={() => onPlanSelect(plan.id)}
            className={`p-4 md:p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 
              active:scale-[0.98] select-none ${
              selectedPlan === plan.id
                ? "border-[#25D366] bg-[#f0fdf4] shadow-lg"
                : "border-[#e2e8f0] hover:border-[#25D366] hover:shadow-md"
            }`}
          >
            <div className="font-bold text-base md:text-lg mb-1 md:mb-2">{plan.name}</div>
            <div className="text-2xl md:text-3xl font-extrabold mb-3 md:mb-4">
              ${yearlyBilling ? Math.floor(plan.price * 12 * 0.8) : plan.price}
              <span className="text-xs md:text-sm font-normal text-[#64748b]">/mo</span>
            </div>
            <ul className="space-y-1.5 md:space-y-2">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="text-xs md:text-sm text-[#64748b] flex items-center gap-2">
                  <i className="fas fa-check text-[#25D366] text-xs"></i>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
