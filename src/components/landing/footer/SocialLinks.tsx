export default function SocialLinks() {
  const socials = [
    { name: 'Twitter', icon: '𝕏', href: '#' },
    { name: 'LinkedIn', icon: 'in', href: '#' },
    { name: 'Instagram', icon: '📷', href: '#' },
    { name: 'Facebook', icon: 'f', href: '#' }
  ];

  return (
    <div className="flex gap-2">
      {socials.map(social => (
        <a
          key={social.name}
          href={social.href}
          className="w-9 h-9 flex items-center justify-center bg-[var(--elevated)] border border-[var(--border)] rounded-lg text-[var(--muted)] hover:text-white hover:bg-[var(--surface)] transition-all"
          aria-label={social.name}
        >
          {social.icon}
        </a>
      ))}
    </div>
  );
}
