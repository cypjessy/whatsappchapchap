export default function FloatingShapes() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      <div className="shape absolute w-[400px] h-[400px] rounded-full bg-white/10 animate-float top-[-200px] right-[-100px]" />
      <div className="shape absolute w-[300px] h-[300px] rounded-full bg-white/10 animate-float-delayed bottom-[-150px] left-[-100px]" />
      <div className="shape absolute w-[200px] h-[200px] rounded-full bg-white/10 animate-float-slow top-1/2 left-1/2" />
    </div>
  );
}
