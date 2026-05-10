import Container from '../layout/Container';
import HeroTicker from './HeroTicker';
import Button from '../common/Button';
import Reveal from '../common/Reveal';
import { MockupDashboard, MockupChat } from './Mockups';
import TrustBadges from './TrustBadges';

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col justify-center pt-[120px] overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 z-0 bg-hero-mesh">
        <div className="absolute inset-0 opacity-25 [background-size:60px_60px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_40%,black_20%,transparent_80%)]" />
      </div>
      
      <Container>
        <div className="relative z-10 max-w-[800px]">
          <Reveal><HeroTicker /></Reveal>
          
          <h1 className="font-display text-[clamp(3.2rem,7vw,7.5rem)] font-black leading-[0.95] tracking-[-0.02em] mb-6">
            Your WhatsApp<br />Store, <em className="italic text-[var(--green)]">Supercharged.</em>
          </h1>
          
          <p className="text-[clamp(1.05rem,2vw,1.25rem)] text-[var(--muted)] max-w-[560px] leading-relaxed mb-10">
            Africa's first AI-powered WhatsApp commerce OS. Manage products, bookings, orders & payments — all from one dashboard.
          </p>
          
          <div className="flex flex-wrap gap-4 mb-16">
            <Button variant="green" size="lg">🛍 Start Selling Products</Button>
            <Button variant="purple" size="lg">📅 Offer Services</Button>
          </div>
          
          <TrustBadges />
        </div>
        
        {/* Mockups - hidden on smaller screens */}
        <div className="hidden lg:flex absolute right-[-40px] top-1/2 -translate-y-1/2 gap-5 z-10">
          <MockupDashboard />
          <MockupChat />
        </div>
      </Container>
    </section>
  );
}
