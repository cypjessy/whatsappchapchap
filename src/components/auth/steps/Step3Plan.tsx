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
    <div className="animate-[fadeIn_0.35s_ease] flex flex-col gap-6 px-1">
      {/* M3 Headline */}
      <div className="mb-2">
        <h1 className="text-[1.75rem] font-normal tracking-tight text-[#1C1B1F]">
          Choose your plan
        </h1>
        <p className="text-base text-[#49454F] mt-1.5 leading-relaxed">
          Select the plan that best fits your needs
        </p>
      </div>

      {/* M3 Switch for billing toggle */}
      <div className="flex items-center justify-center gap-4 py-1">
        <span
          className={`text-sm font-medium transition-colors ${
            !yearlyBilling ? "text-[#1C1B1F]" : "text-[#49454F]"
          }`}
        >
          Monthly
        </span>
        <button
          onClick={onBillingToggle}
          role="switch"
          aria-checked={yearlyBilling}
          className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${
            yearlyBilling ? "bg-[#25D366]" : "bg-[#CAC4D0]"
          }`}
        >
          <div
            className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-200 ${
              yearlyBilling ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
        <span
          className={`text-sm font-medium transition-colors ${
            yearlyBilling ? "text-[#1C1B1F]" : "text-[#49454F]"
          }`}
        >
          Yearly{" "}
          <span className="text-[#25D366] font-semibold">Save 20%</span>
        </span>
      </div>

      {/* M3 Elevated Cards */}
      <div className="flex flex-col sm:flex-row gap-4">
        {plans.map((plan) => {
          const isSelected = selectedPlan === plan.id;
          return (
            <div
              key={plan.id}
              onClick={() => onPlanSelect(plan.id)}
              className={`flex-1 flex flex-col p-5 rounded-2xl cursor-pointer transition-all duration-200 ${
                isSelected
                  ? "bg-[#FFFBFF] border-2 border-[#25D366] shadow-[0_4px_16px_rgba(37,211,102,0.2)]"
                  : "bg-[#FFFBFF] border-2 border-[#CAC4D0] shadow-sm hover:border-[#79747E] hover:shadow-md active:scale-[0.98]"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-medium text-[#1C1B1F]">
                  {plan.name}
                </span>
                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-[#25D366] flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="mb-4">
                <span className="text-[2rem] font-light text-[#1C1B1F]">
                  ${yearlyBilling ? Math.floor(plan.price * 12 * 0.8) : plan.price}
                </span>
                <span className="text-sm text-[#49454F] ml-1">/mo</span>
              </div>
              <ul className="space-y-2.5 flex-1">
                {plan.features.map((feature, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2.5 text-sm text-[#49454F]"
                  >
                    <svg
                      className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#25D366]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
