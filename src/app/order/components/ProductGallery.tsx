"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

import './ProductGallery.css';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock?: number;
  image?: string;
  images?: string[];
  category?: string;
  categoryName?: string;
  subcategory?: string;
  brand?: string;
  filters?: Record<string, string[]>;
  variants?: Array<{
    id: number;
    specs: Record<string, string>;
    price: number;
    stock: number;
  }>;
}

interface ProductGalleryProps {
  product: Product;
  selectedImageIndex: number;
  onImageChange: (index: number) => void;
  getBasePrice: () => number;
  getVariantStock: () => number;
  selectedSpecs: Record<string, string>;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORY_EMOJIS: Record<string, string> = {
  electronics: "📱",
  footwear: "👟",
  clothing: "👕",
  beauty: "💄",
  furniture: "🛋️",
  food: "🍎",
  sports: "🏋️",
  toys: "🧸",
};

function getProductEmoji(product: Product): string {
  if (product.image) return "";
  return CATEGORY_EMOJIS[product.category || ""] || "📦";
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

function getStockConfig(stock: number) {
  if (stock === 0) return { color: "text-[#ef4444]", bg: "bg-[#ef4444]/10", border: "border-[#ef4444]/20", icon: "fa-times-circle", label: "Out of Stock" };
  if (stock <= 5) return { color: "text-[#f59e0b]", bg: "bg-[#f59e0b]/10", border: "border-[#f59e0b]/20", icon: "fa-exclamation-circle", label: `Only ${stock} left` };
  return { color: "text-[#10b981]", bg: "bg-[#10b981]/10", border: "border-[#10b981]/20", icon: "fa-check-circle", label: `In Stock - ${stock} available` };
}

function isColorKey(key: string): boolean {
  return key.toLowerCase().includes("color") || key.toLowerCase().includes("colour");
}

function getColorStyle(colorName: string): string {
  const colorMap: Record<string, string> = {
    black: "#000000",
    white: "#ffffff",
    red: "#ef4444",
    blue: "#3b82f6",
    green: "#10b981",
    yellow: "#f59e0b",
    purple: "#8b5cf6",
    pink: "#ec4899",
    orange: "#f97316",
    gray: "#6b7280",
    grey: "#6b7280",
    brown: "#92400e",
    navy: "#1e3a5f",
    beige: "#f5f5dc",
    cream: "#fffdd0",
    gold: "#fbbf24",
    silver: "#c0c0c0",
    bronze: "#cd7f32",
  };
  return colorMap[colorName.toLowerCase()] || colorName.toLowerCase();
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function ImageSkeleton() {
  return (
    <div className="relative w-full aspect-square rounded-xl md:rounded-2xl bg-surface-variant overflow-hidden">
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/70 to-transparent" />
    </div>
  );
}

function MainImage({
  src,
  alt,
  onPrev,
  onNext,
  currentIndex,
  total,
}: {
  src: string;
  alt: string;
  onPrev: () => void;
  onNext: () => void;
  currentIndex: number;
  total: number;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const touchStartX = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? onNext() : onPrev();
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  };

  return (
    <div
      className="relative w-full aspect-square rounded-xl md:rounded-2xl overflow-hidden bg-surface-container-lowest group"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseMove={handleMouseMove}
      onClick={() => setIsZoomed(!isZoomed)}
    >
      {!isLoaded && <ImageSkeleton />}
      <img
        src={src}
        alt={alt}
        className={`
          w-full h-full object-cover transition-all duration-300
          ${isLoaded ? "opacity-100" : "opacity-0"}
          ${isZoomed ? "scale-150 cursor-zoom-out" : "scale-100 cursor-zoom-in"}
        `}
        style={isZoomed ? {
          transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
        } : {}}
        onLoad={() => setIsLoaded(true)}
      />

      {/* Navigation arrows */}
      {total > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); onPrev(); }}
            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-9 h-9 md:w-10 md:h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-lg flex items-center justify-center text-on-surface-variant hover:bg-white hover:text-on-surface transition-all duration-200 active:scale-90 opacity-0 group-hover:opacity-100 md:opacity-100"
            aria-label="Previous image"
          >
            <i className="fas fa-chevron-left text-sm" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onNext(); }}
            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-9 h-9 md:w-10 md:h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-lg flex items-center justify-center text-on-surface-variant hover:bg-white hover:text-on-surface transition-all duration-200 active:scale-90 opacity-0 group-hover:opacity-100 md:opacity-100"
            aria-label="Next image"
          >
            <i className="fas fa-chevron-right text-sm" />
          </button>
        </>
      )}

      {/* Counter */}
      {total > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs font-bold">
          {currentIndex + 1} / {total}
        </div>
      )}

      {/* Zoom hint */}
      <div className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-black/40 backdrop-blur-sm text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity md:hidden">
        <i className="fas fa-search-plus mr-1" />
        Tap to zoom
      </div>
    </div>
  );
}

function ThumbnailStrip({
  images,
  selectedIndex,
  onSelect,
}: {
  images: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const thumb = scrollRef.current.children[selectedIndex] as HTMLElement;
      if (thumb) {
        thumb.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      }
    }
  }, [selectedIndex]);

  return (
    <div
      ref={scrollRef}
      className="flex gap-2 md:gap-2.5 overflow-x-auto scrollbar-hide py-1 px-0.5"
    >
      {images.map((img, index) => (
        <button
          key={index}
          onClick={() => onSelect(index)}
          className={`
            relative w-14 h-14 md:w-16 md:h-16 rounded-lg overflow-hidden shrink-0
            transition-all duration-200
            ${selectedIndex === index
              ? "ring-2 ring-[#25D366] ring-offset-2 scale-105"
              : "ring-1 ring-[#e2e8f0] hover:ring-[#cbd5e1] opacity-70 hover:opacity-100"
            }
          `}
          aria-label={`View image ${index + 1}`}
        >
          <img
            src={img}
            alt={`Thumbnail ${index + 1}`}
            className="w-full h-full object-cover"
          />
        </button>
      ))}
    </div>
  );
}

function PlaceholderImage({ emoji }: { emoji: string }) {
  return (
    <div className="w-full aspect-square rounded-xl md:rounded-2xl bg-gradient-to-br from-[#DCF8C6] to-[#e0e7ff] flex items-center justify-center text-6xl md:text-8xl mb-4">
      {emoji}
    </div>
  );
}

function StockBadge({ stock }: { stock: number }) {
  const config = getStockConfig(stock);

  return (
    <span className={`
      inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] md:text-xs font-bold border
      ${config.bg} ${config.color} ${config.border}
    `}>
      <i className={`fas ${config.icon} text-[10px]`} />
      {config.label}
    </span>
  );
}

function SelectedVariantCard({ specs }: { specs: Record<string, string> }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  return (
    <div className={`
      bg-gradient-to-br from-[rgba(37,211,102,0.08)] to-[rgba(18,140,126,0.08)] 
      border-2 border-[#25D366] rounded-xl md:rounded-2xl p-3.5 md:p-4 mt-4 md:mt-5
      transition-all duration-300
      ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}
    `}>
      <div className="flex items-center gap-2 mb-2.5 md:mb-3">
        <div className="w-6 h-6 rounded-full bg-[#25D366]/10 flex items-center justify-center">
          <i className="fas fa-check-circle text-[#25D366] text-xs" />
        </div>
        <span className="font-bold text-sm text-[#128C7E]">Selected Configuration</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {Object.entries(specs).map(([key, value], index) => (
          <span
            key={key}
            className={`
              inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-outline-variant
              text-xs md:text-sm font-semibold text-on-surface shadow-sm
              transition-all duration-200 delay-${index * 50}
              ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-90"}
            `}
            style={{ transitionDelay: `${index * 50}ms` }}
          >
            <i className="fas fa-check text-[#10b981] text-[10px]" />
            <span className="capitalize">{key.replace(/_/g, " ")}:</span>
            <span className="font-bold">{value}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function ProductDetails({ filters }: { filters: Record<string, string[]> }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  return (
    <div className={`
      mt-5 md:mt-6 p-4 md:p-5 bg-surface-container-lowest rounded-xl md:rounded-2xl border border-outline-variant
      transition-all duration-500
      ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
    `}>
      <div className="flex items-center gap-2 mb-3 md:mb-4">
        <div className="w-7 h-7 rounded-lg bg-[#25D366]/10 flex items-center justify-center">
          <i className="fas fa-info-circle text-[#25D366] text-xs" />
        </div>
        <h3 className="font-bold text-sm md:text-base text-on-surface">Product Details</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
        {Object.entries(filters).map(([key, options], sectionIndex) => {
          if (!Array.isArray(options) || options.length === 0) return null;
          const colorKey = isColorKey(key);

          return (
            <div
              key={key}
              className={`
                transition-all duration-300
                ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
              `}
              style={{ transitionDelay: `${sectionIndex * 100}ms` }}
            >
              <div className="text-[11px] md:text-xs font-bold text-outline uppercase tracking-wider mb-2">
                {key.replace(/_/g, " ")}
              </div>
              <div className="flex flex-wrap gap-1.5 md:gap-2">
                {options.map((option, idx) => {
                  if (colorKey) {
                    const colorStyle = getColorStyle(option);
                    const isLight = ["white", "cream", "beige"].includes(option.toLowerCase());

                    return (
                      <div
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white rounded-lg border border-outline-variant text-xs font-semibold text-on-surface"
                      >
                        <div
                          className="w-3.5 h-3.5 rounded-full border-2 shrink-0"
                          style={{
                            backgroundColor: colorStyle,
                            borderColor: isLight ? "#e2e8f0" : "transparent",
                          }}
                        />
                        <span className="capitalize">{option}</span>
                      </div>
                    );
                  }

                  return (
                    <span
                      key={idx}
                      className="inline-flex px-2.5 py-1.5 bg-white rounded-lg border border-outline-variant text-xs font-semibold text-on-surface capitalize"
                    >
                      {option}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProductGallery({
  product,
  selectedImageIndex,
  onImageChange,
  getBasePrice,
  getVariantStock,
  selectedSpecs,
}: ProductGalleryProps) {
  const [isVisible, setIsVisible] = useState(false);
  const allImages = product?.images && product.images.length > 0
    ? product.images
    : product?.image ? [product.image] : [];
  const productEmoji = getProductEmoji(product);
  const currentStock = getVariantStock();
  const hasImages = allImages.length > 0;

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  const handlePrev = useCallback(() => {
    onImageChange(selectedImageIndex === 0 ? allImages.length - 1 : selectedImageIndex - 1);
  }, [selectedImageIndex, allImages.length, onImageChange]);

  const handleNext = useCallback(() => {
    onImageChange(selectedImageIndex === allImages.length - 1 ? 0 : selectedImageIndex + 1);
  }, [selectedImageIndex, allImages.length, onImageChange]);

  return (
    <div
      className={`
        p-4 md:p-6 border-b border-outline-variant transition-all duration-500
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
      `}
    >
      {/* Image Gallery */}
      {hasImages ? (
        <div className="space-y-3 md:space-y-4">
          <MainImage
            src={allImages[selectedImageIndex]}
            alt={product?.name || "Product"}
            onPrev={handlePrev}
            onNext={handleNext}
            currentIndex={selectedImageIndex}
            total={allImages.length}
          />
          {allImages.length > 1 && (
            <ThumbnailStrip
              images={allImages}
              selectedIndex={selectedImageIndex}
              onSelect={onImageChange}
            />
          )}
        </div>
      ) : (
        <PlaceholderImage emoji={productEmoji} />
      )}

      {/* Product Info */}
      <div className="mt-4 md:mt-5">
        <h2 className="text-xl md:text-2xl lg:text-3xl font-extrabold text-on-surface mb-2 md:mb-3 leading-tight">
          {product?.name}
        </h2>

        {product?.description && (
          <p className="text-sm md:text-[15px] text-on-surface-variant leading-relaxed mb-4 md:mb-5 line-clamp-3 md:line-clamp-none">
            {product.description}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-baseline gap-1">
            <span className="text-xs text-outline font-bold uppercase tracking-wider">Price</span>
            <span className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-[#25D366] tracking-tight">
              KES {getBasePrice().toLocaleString()}
            </span>
          </div>
          <StockBadge stock={currentStock} />
        </div>
      </div>

      {/* Selected Variant */}
      {Object.keys(selectedSpecs).length > 0 && (
        <SelectedVariantCard specs={selectedSpecs} />
      )}

      {/* Product Details */}
      {product?.filters && Object.keys(product.filters).length > 0 && (
        <ProductDetails filters={product.filters} />
      )}
    </div>
  );
}