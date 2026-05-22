"use client";

interface FeaturesProps {}

export default function Features({}: FeaturesProps) {
  const features = [
    {
      icon: "fa-robot",
      title: "AI Sales Assistant",
      description: "Let AI handle customer queries, send order updates, and upsell products automatically 24/7."
    },
    {
      icon: "fa-boxes",
      title: "Smart Inventory",
      description: "Track stock levels, get low-stock alerts, and manage variants with our visual product builder."
    },
    {
      icon: "fa-chart-line",
      title: "Real-time Analytics",
      description: "Monitor sales, track customer behavior, and make data-driven decisions with detailed insights."
    },
    {
      icon: "fa-shopping-bag",
      title: "Order Management",
      description: "Process orders, track deliveries, and handle returns — all from one unified dashboard."
    },
    {
      icon: "fa-users",
      title: "Customer CRM",
      description: "Build customer profiles, track purchase history, and send personalized offers via WhatsApp."
    },
    {
      icon: "fa-mobile-alt",
      title: "Mobile First",
      description: "Manage your entire business from your phone. Responsive design that works perfectly on any device."
    }
  ];

  return (
    <section className="features" id="features">
      <div className="features-container">
        <div className="section-header">
          <div className="section-badge">
            <i className="fas fa-magic"></i>
            Powerful Features
          </div>
          <h2 className="section-title">Everything You Need to Sell</h2>
          <p className="section-subtitle">
            From inventory management to AI-powered automation, we've built the complete toolkit for modern WhatsApp sellers.
          </p>
        </div>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">
                <i className={`fas ${feature.icon}`}></i>
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-desc">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
