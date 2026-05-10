import Navbar from '@/components/landing/navigation/Navbar';
import Hero from '@/components/landing/hero/Hero';
import Testimonials from '@/components/landing/social/Testimonials';
import AIChatDemo from '@/components/landing/ai/AIChatDemo';
import PricingCard from '@/components/landing/pricing/PricingCard';
import Footer from '@/components/landing/footer/Footer';
import Section from '@/components/landing/layout/Section';
import Container from '@/components/landing/layout/Container';
import SectionHeader from '@/components/landing/layout/SectionHeader';
import Reveal from '@/components/landing/common/Reveal';

export default function LandingPage() {
  const navLinks = [
    { href: '#features', label: 'Features' },
    { href: '#platform', label: 'Platform' },
    { href: '#pricing', label: 'Pricing' },
    { href: '#testimonials', label: 'Testimonials' }
  ];

  const testimonials = [
    {
      quote: "This platform transformed my business! I went from managing orders manually to automating everything through WhatsApp.",
      name: "Wanjiku Mwangi",
      role: "Fashion Boutique Owner, Nairobi",
      initials: "WM",
      gradient: "from-[var(--green)] to-[#128C7E]",
      highlighted: true,
      metric: "3x",
      metricLabel: "increase in sales"
    },
    {
      quote: "The AI assistant handles customer inquiries 24/7. My response time dropped from hours to seconds!",
      name: "James Ochieng",
      role: "Electronics Store, Kisumu",
      initials: "JO",
      gradient: "from-[var(--purple)] to-[#7c3aed]",
      metric: "90%",
      metricLabel: "faster responses"
    },
    {
      quote: "Setting up my service bookings was incredibly easy. Now clients can book appointments directly through WhatsApp.",
      name: "Amina Hassan",
      role: "Beauty Salon, Mombasa",
      initials: "AH",
      gradient: "from-[var(--gold)] to-[#d97706]"
    }
  ];

  const pricingPlans = [
    {
      title: "Starter",
      price: "Free",
      period: "Forever",
      description: "Perfect for testing the waters",
      features: [
        { text: "Up to 100 orders/month", included: true },
        { text: "Basic analytics", included: true },
        { text: "WhatsApp integration", included: true },
        { text: "AI assistant (limited)", included: true },
        { text: "Service bookings", included: false },
        { text: "Advanced automation", included: false }
      ],
      buttonText: "Get Started Free",
      buttonVariant: "outline" as const
    },
    {
      title: "Professional",
      price: "$29",
      yearlyPrice: "$24",
      period: "/month",
      description: "For growing businesses",
      features: [
        { text: "Unlimited orders", included: true },
        { text: "Advanced analytics", included: true },
        { text: "Full AI assistant", included: true },
        { text: "Service bookings", included: true },
        { text: "Priority support", included: true },
        { text: "Custom branding", included: false }
      ],
      popular: true,
      isFeatured: true,
      buttonText: "Start Free Trial",
      buttonVariant: "green" as const
    },
    {
      title: "Enterprise",
      price: "$99",
      period: "/month",
      description: "For established businesses",
      features: [
        { text: "Everything in Pro", included: true },
        { text: "Multiple locations", included: true },
        { text: "API access", included: true },
        { text: "Dedicated support", included: true },
        { text: "Custom integrations", included: true },
        { text: "White-label option", included: true }
      ],
      buttonText: "Contact Sales",
      buttonVariant: "purple" as const
    }
  ];

  return (
    <div className="min-h-screen bg-[var(--obsidian)] text-[var(--text)]">
      <Navbar links={navLinks} />
      
      <Hero />

      {/* Features Section */}
      <Section background="deep" padding="default">
        <Container>
          <Reveal>
            <SectionHeader
              centered
              label="Why Choose Us"
              labelVariant="green"
              title={<>Built for <span className="italic text-[var(--green)]">African</span> Businesses</>}
              subtitle="Everything you need to sell smarter and grow faster on WhatsApp"
            />
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-14">
            {[
              {
                icon: "🤖",
                title: "AI-Powered Assistant",
                desc: "Automatically respond to customer inquiries, process orders, and handle bookings 24/7"
              },
              {
                icon: "📦",
                title: "Product Management",
                desc: "Easy catalog management with variants, inventory tracking, and automated order processing"
              },
              {
                icon: "📅",
                title: "Service Bookings",
                desc: "Let customers book appointments directly through WhatsApp with calendar integration"
              },
              {
                icon: "💳",
                title: "M-Pesa Integration",
                desc: "Accept payments seamlessly with M-Pesa and other local payment methods"
              },
              {
                icon: "📊",
                title: "Smart Analytics",
                desc: "Track sales, customer behavior, and business performance with detailed insights"
              },
              {
                icon: "🌍",
                title: "Multi-Language",
                desc: "Support for Swahili, English, and other local languages to serve diverse customers"
              }
            ].map((feature, idx) => (
              <Reveal key={idx} delay={idx * 100}>
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-xl)] p-7 transition-all hover:-translate-y-1 hover:border-[var(--border-light)]">
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="font-display text-1.25rem font-bold mb-3">{feature.title}</h3>
                  <p className="text-[0.9rem] text-[var(--muted)] leading-relaxed">{feature.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* Platform Demo Section */}
      <Section background="transparent" padding="default">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <Reveal>
              <SectionHeader
                label="AI in Action"
                labelVariant="purple"
                title={<>See Our <span className="italic text-[var(--purple)]">AI Assistant</span> Work</>}
                subtitle="Watch how our AI handles customer conversations, processes orders, and manages your store automatically"
              />
            </Reveal>
            
            <Reveal delay={200}>
              <AIChatDemo />
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* Testimonials Section */}
      <Section background="surface" padding="default">
        <Container>
          <Reveal>
            <SectionHeader
              centered
              label="Success Stories"
              labelBg="bg-[var(--gold-glow)] text-[var(--gold-light)] border-[rgba(201,168,76,0.2)]"
              title={<>Loved by <span className="italic text-[var(--gold)]">Thousands</span></>}
              subtitle="Join successful African entrepreneurs who are scaling their businesses with WhatsApp Chap Chap"
            />
          </Reveal>
          
          <Testimonials testimonials={testimonials} />
        </Container>
      </Section>

      {/* Pricing Section */}
      <Section id="pricing" background="deep" padding="default">
        <Container>
          <Reveal>
            <SectionHeader
              centered
              label="Transparent Pricing"
              labelVariant="green"
              title={<>Choose Your <span className="italic text-[var(--gold)]">Growth Plan</span></>}
              subtitle="Start free, upgrade when you're ready. No hidden fees."
            />
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-14">
            {pricingPlans.map((plan, idx) => (
              <Reveal key={idx} delay={idx * 100}>
                <PricingCard {...plan} />
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* CTA Section */}
      <Section background="transparent" padding="default">
        <Container>
          <Reveal>
            <div className="relative bg-gradient-to-r from-[var(--green)] to-[var(--purple)] rounded-[var(--r-xl)] p-12 text-center overflow-hidden">
              <div className="absolute inset-0 opacity-20 [background-size:60px_60px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black_20%,transparent_80%)]" />
              
              <div className="relative z-10">
                <h2 className="font-display text-[clamp(2rem,5vw,3.5rem)] font-black leading-tight mb-4 text-white">
                  Ready to Transform Your Business?
                </h2>
                <p className="text-[clamp(1rem,2vw,1.25rem)] text-white/90 max-w-2xl mx-auto mb-8">
                  Join thousands of African entrepreneurs already selling smarter with WhatsApp Chap Chap
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <button className="inline-flex items-center gap-2 px-9 py-[17px] rounded-full bg-white text-[var(--obsidian)] font-semibold text-[1.05rem] transition-all duration-200 hover:-translate-y-0.5 shadow-lg">
                    🚀 Start Selling Now
                  </button>
                  <button className="inline-flex items-center gap-2 px-9 py-[17px] rounded-full bg-transparent border-2 border-white text-white font-semibold text-[1.05rem] transition-all duration-200 hover:-translate-y-0.5">
                    Schedule Demo
                  </button>
                </div>
              </div>
            </div>
          </Reveal>
        </Container>
      </Section>

      <Footer />
    </div>
  );
}
