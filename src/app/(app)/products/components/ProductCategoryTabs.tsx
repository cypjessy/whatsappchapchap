"use client";

import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "./product-category-tabs.css";

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Constants ─────────────────────────────────────────────────────────────

const SCROLL_AMOUNT = 240;
const DRAG_MULTIPLIER = 1.8;

// ─── Sub-Components ───────────────────────────────────────────────────────────

function ScrollButton({
  direction,
  visible,
  onClick,
}: {
  direction: "left" | "right";
  visible: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        absolute top-1/2 -translate-y-1/2 z-20 w-9 h-9 md:w-10 md:h-10
        rounded-full bg-white shadow-lg border border-[var(--md-sys-color-outline-variant)]/80
        flex items-center justify-center transition-all duration-300
        hover:shadow-xl hover:border-[var(--md-sys-color-primary)]/30 hover:text-[var(--md-sys-color-primary)]
        active:scale-90
        ${direction === "left" ? "left-0" : "right-0"}
        ${visible ? "opacity-100 translate-x-0" : "opacity-0 pointer-events-none"}
        ${direction === "left" && !visible ? "-translate-x-3" : ""}
        ${direction === "right" && !visible ? "translate-x-3" : ""}
      `}
      aria-label={`Scroll categories ${direction}`}
    >
      <ChevronLeft
        className={`w-4 h-4 md:w-5 md:h-5 transition-transform duration-200 ${
          direction === "right" ? "rotate-180" : ""
        }`}
      />
    </button>
  );
}

function CategoryTab({
  category,
  isActive,
  onClick,
  onKeyDown,
  tabIndex,
  isFirst,
  isLast,
}: {
  category: Category;
  isActive: boolean;
  onClick: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  tabIndex: number;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Scroll active into view on mount/change
  useEffect(() => {
    if (isActive && buttonRef.current) {
      buttonRef.current.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [isActive]);

  return (
    <button
      ref={buttonRef}
      data-category={category.id}
      onClick={onClick}
      onKeyDown={onKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      role="tab"
      aria-selected={isActive}
      aria-controls={`category-panel-${category.id}`}
      tabIndex={tabIndex}
      className={`
        relative flex items-center gap-1.5 md:gap-2.5 px-3 md:px-5 py-2 md:py-2.5 
        rounded-full font-medium text-sm whitespace-nowrap
        transition-all duration-300 ease-out select-none
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)]/40 focus-visible:ring-offset-2
        ${isActive
          ? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-md shadow-[var(--md-sys-color-primary)]/20 z-10"
          : "bg-[var(--md-sys-color-surface)] border-2 border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface-variant)] z-0"
        }
        ${!isActive && isHovered
          ? "border-[var(--md-sys-color-primary)] text-[var(--md-sys-color-primary)] shadow-sm -translate-y-0.5"
          : ""
        }
        ${isPressed ? "scale-95" : "scale-100"}
        ${isFirst ? "ml-1" : ""}
        ${isLast ? "mr-1" : ""}
      `}
    >
      {/* Icon */}
      {category.icon && (
        <span
          className={`
            transition-all duration-300 text-base md:text-lg
            ${isActive ? "scale-110" : isHovered ? "scale-105" : "scale-100"}
          `}
        >
          {category.icon}
        </span>
      )}

      {/* Label */}
      <span className="relative z-10">{category.label}</span>

      {/* Count badge with animation */}
      <span
        className={`
          inline-flex items-center justify-center min-w-[1.25rem] px-1.5 md:px-2 py-0.5 rounded-full 
          text-[10px] md:text-[11px] font-medium transition-all duration-300
          ${isActive
            ? "bg-[var(--md-sys-color-on-primary)]/20 text-[var(--md-sys-color-on-primary)]"
            : "bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface-variant)]"
          }
          ${!isActive && isHovered ? "bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]" : ""}
        `}
      >
        <span
          className={`
            inline-block transition-transform duration-200
            ${isHovered && !isActive ? "scale-110" : "scale-100"}
          `}
        >
          {category.count > 999 ? "999+" : category.count}
        </span>
      </span>

      {/* Active glow effect */}
      {isActive && (
        <div className="absolute inset-0 rounded-full bg-[var(--md-sys-color-primary)]/20 blur-md -z-10 scale-110" />
      )}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

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
  const [scrollLeftStart, setScrollLeftStart] = useState(0);
  const [hasDragged, setHasDragged] = useState(false);

  // Check scrollability
  const checkScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);

    // Also check after images/icons load
    const observer = new MutationObserver(checkScroll);
    observer.observe(el, { childList: true, subtree: true });

    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
      observer.disconnect();
    };
  }, [checkScroll, categories]);

  // Scroll by button
  const scrollBy = useCallback((direction: "left" | "right") => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const scrollAmount = direction === "left" ? -SCROLL_AMOUNT : SCROLL_AMOUNT;
    el.scrollBy({ left: scrollAmount, behavior: "smooth" });
  }, []);

  // Drag to scroll
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setIsDragging(true);
    setHasDragged(false);
    setStartX(e.pageX - el.offsetLeft);
    setScrollLeftStart(el.scrollLeft);
    el.style.cursor = "grabbing";
    el.style.scrollBehavior = "auto";
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      const el = scrollContainerRef.current;
      if (!el) return;
      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      const walk = (x - startX) * DRAG_MULTIPLIER;
      el.scrollLeft = scrollLeftStart - walk;
      if (Math.abs(walk) > 5) setHasDragged(true);
    },
    [isDragging, startX, scrollLeftStart]
  );

  const handleMouseUp = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setIsDragging(false);
    el.style.cursor = "";
    el.style.scrollBehavior = "smooth";

    // Snap to nearest tab after drag
    if (hasDragged) {
      const children = Array.from(el.children) as HTMLElement[];
      const containerCenter = el.scrollLeft + el.clientWidth / 2;
      let closest = children[0];
      let closestDist = Infinity;

      children.forEach((child) => {
        const childCenter = child.offsetLeft + child.offsetWidth / 2;
        const dist = Math.abs(childCenter - containerCenter);
        if (dist < closestDist) {
          closestDist = dist;
          closest = child;
        }
      });

      closest.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [hasDragged]);

  // Touch support
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setIsDragging(true);
    setHasDragged(false);
    setStartX(e.touches[0].pageX - el.offsetLeft);
    setScrollLeftStart(el.scrollLeft);
    el.style.scrollBehavior = "auto";
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging) return;
      const el = scrollContainerRef.current;
      if (!el) return;
      const x = e.touches[0].pageX - el.offsetLeft;
      const walk = (x - startX) * DRAG_MULTIPLIER;
      el.scrollLeft = scrollLeftStart - walk;
      if (Math.abs(walk) > 5) setHasDragged(true);
    },
    [isDragging, startX, scrollLeftStart]
  );

  const handleTouchEnd = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setIsDragging(false);
    el.style.scrollBehavior = "smooth";
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, catId: string) => {
      const currentIndex = categories.findIndex((c) => c.id === catId);

      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setActiveCategory(catId);
      }

      if (e.key === "ArrowRight") {
        e.preventDefault();
        const nextIndex = Math.min(currentIndex + 1, categories.length - 1);
        setActiveCategory(categories[nextIndex].id);
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        const prevIndex = Math.max(currentIndex - 1, 0);
        setActiveCategory(categories[prevIndex].id);
      }

      if (e.key === "Home") {
        e.preventDefault();
        setActiveCategory(categories[0].id);
      }

      if (e.key === "End") {
        e.preventDefault();
        setActiveCategory(categories[categories.length - 1].id);
      }
    },
    [categories, setActiveCategory]
  );

  // Progress calculation
  const progressPercent = useMemo(() => {
    const activeIndex = categories.findIndex((c) => c.id === activeCategory);
    if (activeIndex === -1) return 0;
    return ((activeIndex + 1) / categories.length) * 100;
  }, [categories, activeCategory]);

  if (categories.length === 0) return null;

  return (
    <div className="relative mb-3 md:mb-6 px-0">
      {/* Mobile: flex-wrap chip layout */}
      <div className="md:hidden mb-2">
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`
                  inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold leading-none
                  transition-all duration-200 active:scale-95 select-none
                  ${
                    isActive
                      ? "bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white shadow-md"
                      : "bg-surface border border-outline-variant text-on-surface-variant hover:border-[#25D366]/40 hover:text-[#25D366]"
                  }
                `}
              >
                {cat.icon && <span className="text-sm">{cat.icon}</span>}
                <span>{cat.label}</span>
                {cat.count > 0 && (
                  <span
                    className={`
                      inline-flex items-center justify-center min-w-[18px] h-[16px] px-1
                      rounded-md text-[9px] font-bold leading-none
                      ${isActive ? "bg-white/20" : "bg-surface-variant text-on-surface-variant"}
                    `}
                  >
                    {cat.count > 999 ? "999+" : cat.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop: full category tabs with scroll */}
      <div className="hidden md:block relative group">
        {/* Left scroll button */}
        <ScrollButton
          direction="left"
          visible={canScrollLeft}
          onClick={() => scrollBy("left")}
        />

        {/* Right scroll button */}
        <ScrollButton
          direction="right"
          visible={canScrollRight}
          onClick={() => scrollBy("right")}
        />

        {/* Gradient fade indicators */}
        <div
          className={`
            absolute left-0 top-0 bottom-4 w-14
            bg-gradient-to-r from-white to-transparent
            z-[5] pointer-events-none transition-opacity duration-300
            ${canScrollLeft ? "opacity-100" : "opacity-0"}
          `}
        />
        <div
          className={`
            absolute right-0 top-0 bottom-4 w-14
            bg-gradient-to-l from-white to-transparent
            z-[5] pointer-events-none transition-opacity duration-300
            ${canScrollRight ? "opacity-100" : "opacity-0"}
          `}
        />

        {/* Scrollable container */}
        <div
          ref={scrollContainerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className={`
            flex gap-3 overflow-x-auto pb-3 pt-1
            scrollbar-hide select-none snap-x snap-mandatory
            ${isDragging ? "cursor-grabbing" : "cursor-grab"}
          `}
          role="tablist"
          aria-label="Product categories"
        >
          {categories.map((cat, index) => (
            <div key={cat.id} className="snap-center">
              <CategoryTab
                category={cat}
                isActive={activeCategory === cat.id}
                onClick={() => {
                  if (!hasDragged) setActiveCategory(cat.id);
                }}
                onKeyDown={(e) => handleKeyDown(e, cat.id)}
                tabIndex={activeCategory === cat.id ? 0 : -1}
                isFirst={index === 0}
                isLast={index === categories.length - 1}
              />
            </div>
          ))}
        </div>

        {/* Active indicator line */}
        <div className="absolute -bottom-1 left-0 right-0 h-[2px] bg-surface-variant rounded-full mx-0 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#25D366] to-[#128C7E] rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${100 / categories.length}%`,
              marginLeft: `${((categories.findIndex((c) => c.id === activeCategory) / categories.length) * 100)}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}