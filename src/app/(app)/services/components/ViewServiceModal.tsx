"use client";

import { useEffect, useRef } from "react";
import { Service } from "@/lib/db";
import { formatCurrency } from "@/lib/currency";

interface ViewServiceModalProps {
  service: Service | null;
  open: boolean;
  onClose: () => void;
}

export default function ViewServiceModal({ service, open, onClose }: ViewServiceModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, onClose]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  if (!open || !service) return null;

  // Map business type to display name
  const businessTypeNames: Record<string, string> = {
    beauty: 'Beauty & Hair',
    home: 'Home Services',
    health: 'Health & Wellness',
    education: 'Education',
    automotive: 'Automotive',
    events: 'Events',
    tech: 'Tech Support',
    fitness: 'Fitness',
    cleaning: 'Cleaning',
    photography: 'Photography',
    catering: 'Catering',
    medical: 'Hospital & Medical',
    other: 'Other Services',
  };

  const modeLabels: Record<string, string> = {
    'in-person': 'In-Person',
    'remote': 'Remote/Video',
    'both': 'Both In-Person & Remote'
  };

  const locationLabels: Record<string, string> = {
    'client-place': "Client's Place",
    'my-place': 'My Studio/Shop',
    'both-places': 'Both Options',
    'remote': 'Online/Remote Only'
  };

  const tierLabels: Record<string, { label: string; badge: string; color: string }> = {
    basic: { 
      label: 'Starter', 
      badge: 'Basic', 
      color: 'bg-gray-200 text-gray-600' 
    },
    standard: { 
      label: 'Standard', 
      badge: 'Popular', 
      color: 'bg-gradient-to-r from-purple-600 to-purple-700 text-white' 
    },
    premium: { 
      label: 'Premium', 
      badge: 'Best', 
      color: 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white' 
    },
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'active': return 'bg-[rgba(37,211,102,0.9)] text-white';
      case 'paused': return 'bg-[rgba(245,158,11,0.9)] text-white';
      case 'draft': return 'bg-[rgba(100,116,139,0.9)] text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  // Calculate package prices with auto-calculation
  const basePrice = service.priceMin || 0;
  const packagePrices = {
    basic: basePrice,
    standard: Math.round(basePrice * 1.5),
    premium: Math.round(basePrice * 2)
  };

  // Default package features
  const defaultFeatures = {
    basic: ['Core service included', 'Professional quality'],
    standard: ['Everything in Basic', 'Priority scheduling', 'Enhanced support'],
    premium: ['Everything in Standard', 'VIP treatment', '24/7 support']
  };

  const packageFeatures = service.packageFeatures || defaultFeatures;

  // Day names for availability
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const fullDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4" onClick={onClose}>
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(30px) scale(0.98); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease; }
        .animate-slideUp { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-pulse { animation: pulse 2s infinite; }
      `}</style>

      <div 
        className="bg-white rounded-[20px] w-full max-w-[800px] max-h-[90vh] overflow-hidden shadow-2xl animate-slideUp flex flex-col" 
        onClick={(e) => e.stopPropagation()} 
        ref={modalRef}
      >
        
        {/* Modal Header - Hero Section */}
        <div className={`relative h-[220px] bg-gradient-to-br ${service.bgGradient || 'from-[#8b5cf6] to-[#7c3aed]'} flex items-center justify-center overflow-hidden`}>
          {/* Background Icon */}
          <div className="absolute text-9xl opacity-20">
            {service.emoji || '✨'}
          </div>
          
          {/* Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/70 to-transparent">
            {/* Status Badge */}
            <div className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-white text-xs font-bold uppercase mb-3 ${service.status === 'active' ? '' : ''}`}>
              {service.status === 'active' && (
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              )}
              {service.status || 'active'}
            </div>
            
            {/* Service Title */}
            <h1 className="text-3xl font-extrabold text-white mb-1">{service.name}</h1>
            <p className="text-white/80 text-sm font-medium">
              {businessTypeNames[service.businessType] || service.businessType}
            </p>
          </div>

          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/30 transition-all hover:rotate-90 z-10"
          >
            <i className="fas fa-times text-lg"></i>
          </button>
        </div>

        {/* Modal Body - Scrollable Content */}
        <div className="overflow-y-auto flex-1">
          
          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-3 p-6 border-b border-[#e2e8f0]">
            <div className="text-center p-3 bg-[#f8fafc] rounded-xl hover:bg-[#ede9fe] hover:-translate-y-0.5 transition-all">
              <div className="text-2xl font-extrabold text-[#8b5cf6]">{service.duration}</div>
              <div className="text-xs text-[#64748b] mt-1.5 font-semibold uppercase">Duration</div>
            </div>
            <div className="text-center p-3 bg-[#f8fafc] rounded-xl hover:bg-[#ede9fe] hover:-translate-y-0.5 transition-all">
              <div className="text-2xl font-extrabold text-[#8b5cf6]">{service.bookings || 0}</div>
              <div className="text-xs text-[#64748b] mt-1.5 font-semibold uppercase">Bookings</div>
            </div>
            <div className="text-center p-3 bg-[#f8fafc] rounded-xl hover:bg-[#ede9fe] hover:-translate-y-0.5 transition-all">
              <div className="text-2xl font-extrabold text-[#8b5cf6]">{service.views || 0}</div>
              <div className="text-xs text-[#64748b] mt-1.5 font-semibold uppercase">Views</div>
            </div>
            <div className="text-center p-3 bg-[#f8fafc] rounded-xl hover:bg-[#ede9fe] hover:-translate-y-0.5 transition-all">
              <div className="text-2xl font-extrabold text-[#8b5cf6]">{service.rating ? service.rating.toFixed(1) : '—'}</div>
              <div className="text-xs text-[#64748b] mt-1.5 font-semibold uppercase">{service.rating ? 'Rating' : 'No Ratings'}</div>
            </div>
          </div>

          {/* Description Section */}
          {service.description && (
            <div className="p-6 border-b border-[#e2e8f0]">
              <div className="text-xs font-bold uppercase tracking-wide text-[#64748b] mb-3 flex items-center gap-2">
                <i className="fas fa-align-left"></i>
                Description
              </div>
              <p className="text-[#64748b] text-sm leading-relaxed">{service.description}</p>
            </div>
          )}

          {/* Provider Name */}
          {service.providerName && (
            <div className="p-6 border-b border-[#e2e8f0]">
              <div className="text-xs font-bold uppercase tracking-wide text-[#64748b] mb-3 flex items-center gap-2">
                <i className="fas fa-store"></i>
                Business/Provider
              </div>
              <div className="flex items-center gap-3 p-3 bg-[#f8fafc] rounded-xl">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] text-white flex items-center justify-center text-xl">
                  {service.emoji || '✨'}
                </div>
                <div>
                  <div className="font-bold text-[#1e293b]">{service.providerName}</div>
                  <div className="text-xs text-[#64748b]">Service Provider</div>
                </div>
              </div>
            </div>
          )}

          {/* Tags */}
          {service.tags && service.tags.length > 0 && (
            <div className="p-6 border-b border-[#e2e8f0]">
              <div className="text-xs font-bold uppercase tracking-wide text-[#64748b] mb-3 flex items-center gap-2">
                <i className="fas fa-tags"></i>
                Tags
              </div>
              <div className="flex flex-wrap gap-2">
                {service.tags.map((tag, idx) => (
                  <span key={idx} className="px-4 py-2 bg-[#f8fafc] rounded-full text-sm font-semibold text-[#64748b] border border-[#e2e8f0] flex items-center gap-1.5">
                    <i className="fas fa-tag text-[#8b5cf6] text-xs"></i>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Pricing Tiers */}
          <div className="p-6 border-b border-[#e2e8f0]">
            <div className="text-xs font-bold uppercase tracking-wide text-[#64748b] mb-4 flex items-center gap-2">
              <i className="fas fa-dollar-sign"></i>
              Pricing Packages
            </div>
            <div className="grid grid-cols-3 gap-3">
              {(['basic', 'standard', 'premium'] as const).map((tier) => {
                const isFeatured = tier === 'standard'; // Always feature standard tier
                return (
                  <div 
                    key={tier}
                    className={`bg-[#f8fafc] rounded-xl p-4 border-2 border-transparent hover:border-[#8b5cf6] hover:-translate-y-1 hover:shadow-lg transition-all relative overflow-hidden ${
                      isFeatured ? 'bg-gradient-to-br from-[#ede9fe] to-[#f5f3ff] border-[#8b5cf6]' : ''
                    }`}
                  >
                    {isFeatured && (
                      <div className="absolute top-0 right-0 px-3 py-1 bg-[#8b5cf6] text-white text-[10px] font-bold uppercase rounded-bl-lg">
                        Popular
                      </div>
                    )}
                  <div className="font-bold text-sm mb-2 text-[#1e293b]">{tierLabels[tier].label}</div>
                  <div className="text-3xl font-extrabold text-[#8b5cf6] mb-1">
                    {formatCurrency(packagePrices[tier])}
                  </div>
                  <div className="text-xs text-[#64748b] mb-3 pb-3 border-b border-[#e2e8f0]">
                    {(() => {
                      // Try to get duration from selectedDuration first (number)
                      if (service.selectedDuration && !isNaN(service.selectedDuration)) {
                        return `${service.selectedDuration} min duration`;
                      }
                      // Fallback: parse from duration string like "60 min"
                      const durationMatch = service.duration?.match(/(\d+)/);
                      if (durationMatch) {
                        return `${durationMatch[1]} min duration`;
                      }
                      return 'Duration TBD';
                    })()}
                  </div>
                  <ul className="space-y-2">
                    {(packageFeatures[tier] || defaultFeatures[tier]).map((feature: string, idx: number) => (
                      <li key={idx} className="text-xs text-[#64748b] flex items-start gap-2">
                        <i className="fas fa-check text-green-500 text-[10px] mt-0.5 flex-shrink-0"></i>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
              })}
            </div>
          </div>

          {/* Service Mode & Location */}
          <div className="p-6 border-b border-[#e2e8f0]">
            <div className="text-xs font-bold uppercase tracking-wide text-[#64748b] mb-4 flex items-center gap-2">
              <i className="fas fa-map-marker-alt"></i>
              Service Delivery
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-[#f8fafc] rounded-xl">
                <div className="text-xs font-semibold text-[#64748b] mb-2">Mode</div>
                <div className="font-bold text-[#1e293b] flex items-center gap-2">
                  <i className={`fas ${service.mode === 'remote' ? 'fa-video' : service.mode === 'both' ? 'fa-exchange-alt' : 'fa-user'} text-[#8b5cf6]`}></i>
                  {modeLabels[service.mode] || service.mode}
                </div>
              </div>
              <div className="p-4 bg-[#f8fafc] rounded-xl">
                <div className="text-xs font-semibold text-[#64748b] mb-2">Location</div>
                <div className="font-bold text-[#1e293b] flex items-center gap-2">
                  <i className="fas fa-location-dot text-[#8b5cf6]"></i>
                  {locationLabels[service.location] || service.location}
                </div>
              </div>
            </div>
          </div>

          {/* Availability */}
          {service.availability && service.availability.days && service.availability.days.length > 0 && (
            <div className="p-6 border-b border-[#e2e8f0]">
              <div className="text-xs font-bold uppercase tracking-wide text-[#64748b] mb-4 flex items-center gap-2">
                <i className="fas fa-calendar-check"></i>
                Available Days
              </div>
              <div className="grid grid-cols-7 gap-2">
                {dayNames.map((day, idx) => {
                  const isAvailable = service.availability?.days.includes(day);
                  return (
                    <div 
                      key={day}
                      className={`text-center p-3 rounded-xl transition-all ${
                        isAvailable 
                          ? 'bg-green-50 text-green-600' 
                          : 'opacity-40 bg-[#f8fafc]'
                      }`}
                    >
                      <div className="text-[10px] font-bold uppercase mb-1">{day}</div>
                      <div className="text-xs font-semibold">
                        {isAvailable ? '✓' : '—'}
                      </div>
                    </div>
                  );
                })}
              </div>
              {service.availability.timeSlots && service.availability.timeSlots.length > 0 && (
                <div className="mt-4">
                  <div className="text-xs font-semibold text-[#64748b] mb-2">Available Time Slots</div>
                  <div className="flex flex-wrap gap-2">
                    {service.availability.timeSlots.slice(0, 8).map((time, idx) => (
                      <span key={idx} className="px-3 py-1.5 bg-[#f8fafc] rounded-lg text-xs font-semibold text-[#64748b] border border-[#e2e8f0]">
                        {time}
                      </span>
                    ))}
                    {service.availability.timeSlots.length > 8 && (
                      <span className="px-3 py-1.5 bg-[#f8fafc] rounded-lg text-xs font-semibold text-[#64748b]">
                        +{service.availability.timeSlots.length - 8} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Specifications */}
          {service.specifications && Object.keys(service.specifications).length > 0 && (
            <div className="p-6 border-b border-[#e2e8f0]">
              <div className="text-xs font-bold uppercase tracking-wide text-[#64748b] mb-4 flex items-center gap-2">
                <i className="fas fa-sliders-h"></i>
                Service Specifications
              </div>
              <div className="space-y-4">
                {Object.entries(service.specifications).map(([key, values]) => (
                  <div key={key} className="border-b border-[#e2e8f0] pb-3 last:border-0">
                    <div className="text-xs font-semibold text-[#64748b] mb-2 capitalize">
                      {key.replace(/_/g, ' ')}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(values as string[]).map((val: string, idx: number) => (
                        <span key={idx} className="px-3 py-1.5 bg-[#ede9fe] text-[#7c3aed] rounded-full text-xs font-medium">
                          {val}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Portfolio Images */}
          {service.portfolioImages && service.portfolioImages.length > 0 && (
            <div className="p-6 border-b border-[#e2e8f0]">
              <div className="text-xs font-bold uppercase tracking-wide text-[#64748b] mb-4 flex items-center gap-2">
                <i className="fas fa-images"></i>
                Portfolio Photos ({service.portfolioImages.length})
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {service.portfolioImages.map((imageUrl, idx) => (
                  <div key={idx} className="aspect-square rounded-xl overflow-hidden bg-[#f8fafc] cursor-pointer hover:scale-105 transition-transform">
                    <img
                      src={imageUrl}
                      alt={`Portfolio ${idx + 1}`}
                      className="w-full h-full object-cover"
                      onClick={() => window.open(imageUrl, '_blank')}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Booking Link */}
          {service.bookingUrl && (
            <div className="p-6">
              <div className="text-xs font-bold uppercase tracking-wide text-[#64748b] mb-3 flex items-center gap-2">
                <i className="fas fa-link"></i>
                Booking Link
              </div>
              <div className="p-4 bg-[#ede9fe] rounded-xl border-2 border-[#8b5cf6]">
                <div className="flex items-center justify-between gap-3">
                  <code className="text-sm text-[#7c3aed] break-all flex-1 font-mono">
                    {service.bookingUrl}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(service.bookingUrl || '');
                      alert('Booking link copied!');
                    }}
                    className="px-4 py-2 bg-[#8b5cf6] text-white rounded-lg hover:bg-[#7c3aed] transition-all flex-shrink-0"
                  >
                    <i className="fas fa-copy"></i>
                  </button>
                </div>
              </div>
              <p className="text-xs text-[#64748b] mt-2">
                Share this link with clients to let them book appointments directly.
              </p>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#e2e8f0] bg-white sticky bottom-0">
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="flex-1 px-4 py-3 border-2 border-[#e2e8f0] rounded-xl font-bold text-[#64748b] hover:border-[#8b5cf6] hover:text-[#8b5cf6] transition-all"
            >
              Close
            </button>
            {service.bookingUrl && (
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(service.bookingUrl || '');
                  alert('Booking link copied!');
                }}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white rounded-xl font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2"
              >
                <i className="fas fa-copy"></i>
                Copy Booking Link
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
