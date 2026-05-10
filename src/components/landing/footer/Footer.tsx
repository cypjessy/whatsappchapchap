import Container from '../layout/Container';
import FooterLogo from './FooterLogo';
import TrustBadge from './TrustBadge';
import SocialLinks from './SocialLinks';

interface FooterSection {
  title: string;
  links: string[];
}

export default function Footer() {
  const footerSections: FooterSection[] = [
    { title: 'Product', links: ['Features', 'Pricing', 'AI Assistant', 'For Sellers', 'For Services', 'Roadmap'] },
    { title: 'Company', links: ['About Us', 'Blog', 'Careers', 'Press Kit', 'Contact'] },
    { title: 'Resources', links: ['Help Center', 'API Docs', 'Community', 'Video Tutorials', 'Seller Stories'] },
    { title: 'Legal', links: ['Privacy Policy', 'Terms of Service', 'Data Protection', 'Cookie Policy'] }
  ];
  
  return (
    <footer className="border-t border-[var(--border)] pt-16 pb-8">
      <Container>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-12">
          <div className="col-span-2">
            <FooterLogo />
            <p className="text-[0.85rem] text-[var(--muted)] max-w-[240px] mt-4 leading-relaxed">
              Africa's first AI-powered WhatsApp commerce OS. Built by African entrepreneurs, for African entrepreneurs.
            </p>
          </div>
          
          {footerSections.map(section => (
            <div key={section.title}>
              <h4 className="font-bold text-[0.85rem] mb-4">{section.title}</h4>
              <ul className="flex flex-col gap-2.5 text-[0.83rem] text-[var(--muted)]">
                {section.links.map(link => (
                  <li key={link}><a href="#" className="hover:text-white transition-colors">{link}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <div className="flex flex-wrap justify-between items-center gap-4 pt-7 border-t border-[var(--border)]">
          <div className="text-[0.8rem] text-[var(--faint)]">© 2026 WhatsApp Chap Chap. Made with 🖤 in Nairobi.</div>
          <div className="flex gap-2">
            <TrustBadge icon="🔒" text="SSL Secured" />
            <TrustBadge icon="✓" text="GDPR" />
            <TrustBadge icon="🛡" text="Kenya DPA" />
          </div>
          <SocialLinks />
        </div>
      </Container>
    </footer>
  );
}
