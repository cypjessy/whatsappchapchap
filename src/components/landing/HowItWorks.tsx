"use client";

interface HowItWorksProps {}

export default function HowItWorks({}: HowItWorksProps) {
  const steps = [
    {
      number: 1,
      title: "Connect WhatsApp",
      description: "Link your WhatsApp Business account with one click. No complex setup required."
    },
    {
      number: 2,
      title: "Add Products",
      description: "Upload your catalog with our visual builder. Add specs, prices, and images easily."
    },
    {
      number: 3,
      title: "AI Takes Over",
      description: "Our AI handles customer queries, processes orders, and sends updates automatically."
    },
    {
      number: 4,
      title: "Watch Sales Grow",
      description: "Track performance, optimize with insights, and scale your business effortlessly."
    }
  ];

  return (
    <section className="how-it-works" id="how-it-works">
      <div className="features-container">
        <div className="section-header">
          <div className="section-badge">
            <i className="fas fa-route"></i>
            Simple Process
          </div>
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">
            Get started in minutes and start selling smarter today.
          </p>
        </div>
        <div className="steps-container">
          {steps.map((step, index) => (
            <div key={index} className="step-card">
              <div className="step-number">{step.number}</div>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-desc">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
