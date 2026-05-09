"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Category {
  id: string;
  label: string;
  count: number;
  icon?: string | null;
}

interface ProductCategoryTabsProps {
  categories: Category[];
  activeCategory: string;
  setActiveCategory: (id: string) => void;
}

export default function ProductCategoryTabs({
  categories,
  activeCategory,
  setActiveCategory,
}: ProductCategoryTabsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Check scrollability
  const checkScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll, categories]);

  // Scroll by button
  const scrollBy = (direction: "left" | "right") => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const scrollAmount = direction === "left" ? -200 : 200;
    el.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  // Drag to scroll (mobile)
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - (scrollContainerRef.current?.offsetLeft || 0));
    setScrollLeft(scrollContainerRef.current?.scrollLeft || 0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - (scrollContainerRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 1.5;
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, catId: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setActiveCategory(catId);
    }
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      const currentIndex = categories.findIndex((c) => c.id === catId);
      const nextIndex =
        e.key === "ArrowRight"
          ? Math.min(currentIndex + 1, categories.length - 1)
          : Math.max(currentIndex - 1, 0);
      const nextId = categories[nextIndex].id;
      setActiveCategory(nextId);
      // Scroll into view
      const btn = document.querySelector(`[data-category="${nextId}"]`);
      btn?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  };

  // Active indicator ref for sliding animation
  const activeRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="relative group mb-6 md:mb-8">
      {/* Left scroll button */}
      <button
        onClick={() => scrollBy("left")}
        className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/95 backdrop-blur-sm shadow-md border border-[#e2e8f0] flex items-center justify-center text-[#64748b] hover:text-[#128C7E] transition-all duration-300 md:hidden ${
          canScrollLeft ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 pointer-events-none"
        }`}
        aria-label="Scroll categories left"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Right scroll button */}
      <button
        onClick={() => scrollBy("right")}
        className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/95 backdrop-blur-sm shadow-md border border-[#e2e8f0] flex items-center justify-center text-[#64748b] hover:text-[#128C7E] transition-all duration-300 md:hidden ${
          canScrollRight ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2 pointer-events-none"
        }`}
        aria-label="Scroll categories right"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Gradient fade indicators */}
      <div
        className={`absolute left-0 top-0 bottom-2 w-8 bg-gradient-to-r from-white to-transparent z-[5] pointer-events-none transition-opacity duration-300 md:hidden ${
          canScrollLeft ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        className={`absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-white to-transparent z-[5] pointer-events-none transition-opacity duration-300 md:hidden ${
          canScrollRight ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Scrollable container */}
      <div
        ref={scrollContainerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`flex gap-2 md:gap-3 overflow-x-auto pb-3 pt-1 px-1 -mx-1 hide-scrollbar select-none ${
          isDragging ? "cursor-grabbing" : "cursor-grab md:cursor-default"
        }`}
        role="tablist"
        aria-label="Product categories"
      >
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              ref={isActive ? activeRef : null}
              data-category={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              onKeyDown={(e) => handleKeyDown(e, cat.id)}
              role="tab"
              aria-selected={isActive}
              aria-controls={`category-panel-${cat.id}`}
              tabIndex={isActive ? 0 : -1}
              className={`
                relative px-3 md:px-5 py-2 md:py-2.5 rounded-full font-semibold text-sm whitespace-nowrap 
                flex items-center gap-1.5 md:gap-2.5 transition-all duration-300 ease-out
                active:scale-95 md:active:scale-100
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]/50 focus-visible:ring-offset-2
                ${isActive
                  ? "bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white shadow-lg shadow-[#25D366]/25 scale-[1.02]"
                  : "bg-white border-2 border-[#e2e8f0] text-[#64748b] hover:border-[#25D366] hover:text-[#128C7E] hover:shadow-sm hover:-translate-y-0.5"
                }
              `}
            >
              {/* Icon with subtle animation */}
              {cat.icon && (
                <span className={`transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-105"}`}>
                  {cat.icon}
                </span>
              )}

              {/* Label */}
              <span className="relative z-10">{cat.label}</span>

              {/* Count badge */}
              <span
                className={`
                  inline-flex items-center justify-center min-w-[1.25rem] px-1.5 md:px-2 py-0.5 rounded-full text-[10px] md:text-xs font-bold transition-all duration-300
                  ${isActive
                    ? "bg-white/25 text-white backdrop-blur-sm"
                    : "bg-[#f1f5f9] text-[#64748b] group-hover:bg-[#25D366]/10 group-hover:text-[#128C7E]"
                  }
                `}
              >
                {cat.count > 99 ? "99+" : cat.count}
              </span>

              {/* Active indicator dot (mobile) */}
              {isActive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#25D366] md:hidden" />
              )}
            </button>
          );
        })}
      </div>

      {/* Progress bar (mobile) */}
      <div className="md:hidden h-0.5 bg-[#e2e8f0] rounded-full mt-1 mx-4 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#25D366] to-[#128C7E] rounded-full transition-all duration-300"
          style={{
            width: `${((categories.findIndex((c) => c.id === activeCategory) + 1) / categories.length) * 100}%`,
          }}
        />
      </div>
    </div>
  );
}