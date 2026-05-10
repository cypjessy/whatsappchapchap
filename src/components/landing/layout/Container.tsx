interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  fluid?: boolean;
}

export default function Container({ children, className = '', fluid = false }: ContainerProps) {
  const baseClass = fluid ? 'w-full' : 'max-w-[1240px] mx-auto px-[clamp(20px,5vw,60px)]';
  return <div className={`${baseClass} ${className}`}>{children}</div>;
}
