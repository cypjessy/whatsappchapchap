"use client";

import { useState, useEffect } from 'react';
import Button from '../common/Button';
import Container from '../layout/Container';
import Logo from './Logo';
import HamburgerMenu from './HamburgerMenu';

interface NavLink {
  href: string;
  label: string;
}

interface NavbarProps {
  links?: NavLink[];
}

export default function Navbar({ links = [] }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  return (
    <nav className={`fixed top-0 left-0 right-0 z-[1000] transition-all duration-300 ${scrolled ? 'bg-[rgba(10,11,15,0.92)] backdrop-blur-xl border-b border-[var(--border)] py-3' : 'py-5'}`}>
      <Container>
        <div className="flex items-center justify-between gap-8">
          <Logo />
          <ul className="hidden md:flex items-center gap-8">
            {links.map(link => (
              <li key={link.href}>
                <a href={link.href} className="text-[0.9rem] font-medium text-[var(--muted)] hover:text-white transition-colors">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">Sign In</Button>
            <Button variant="green" size="sm">Get Started Free</Button>
          </div>
          <HamburgerMenu />
        </div>
      </Container>
    </nav>
  );
}
