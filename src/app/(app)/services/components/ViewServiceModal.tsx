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
    other: 'Other Services',
  };

  const businessTypeIcons: Record<string, string> = {
    beauty: '💇‍♀️', home: '🔧', health: '🏥', education: '📚',
    automotive: '🚗', events: '🎉', tech: '💻', fitness: '🏋️',
    cleaning: '🧹', photography: '📸', catering: '🍽️', other: '✨'
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
    basic: { label: 'Starter', badge: 'Basic', color: 'bg-gray-200 text-gray-600' },
    standard: { label: 'Standard', badge: 'Popular', color: 'bg-gradient-to-r from-purple-600 to-purple-700 text-white' },
    premium: { label: 'Premium', badge: 'Best', color: 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white' },
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'active': return 'bg-[rgba(37,211,102,0.9)] text-white';
      case 'paused': return 'bg-[rgba(245,158,11,0.9)] text-white';
      case 'draft': return 'bg-[rgba(100,116,139,0.9)] text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-1000 flex items-center justify-center p-4" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} ref={modalRef}>
        
        {/* Modal Header */}
        <div className="modal-header">
          <h2 className="modal-title">
            <i className="fas fa-eye"></i>
            View Service
          </h2>
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          
          {/* Header Banner with Emoji */}
            <div className={`h-40 bg-gradient-to-br ${service.bgGradient} flex items-center justify-center relative mb-4 rounded-lg mx-4 mt-4`}>
            <span className="text-6xl">{businessTypeIcons[service.businessType || 'other']}</span>
            <span className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusClass(service.status)}`}>
              {service.status}
            </span>
          </div>

          {/* Service Name & Description */}
          <div className="px-4 pb-4 border-b border-[#e2e8f0] mb-4">
            <h2 className="text-xl font-bold text-[#1e293b] mb-1">{service.name}</h2>
            {service.description && (
              <p className="text-[#64748b] text-sm">{service.description}</p>
            )}
          </div>

          {/* Business Type */}
          <div className="form-section">
            <div className="section-title">
              <i className="fas fa-store"></i>
              Business Type
            </div>
            <div className="flex items-center gap-3 p-3 bg-[#f8fafc] rounded-lg">
              <span className="text-2xl">{businessTypeIcons[service.businessType || 'other']}</span>
              <span className="font-semibold">{businessTypeNames[service.businessType || 'other']}</span>
            </div>
          </div>

          {/* Key Details Grid */}
          <div className="form-section">
            <div className="section-title">
              <i className="fas fa-info-circle"></i>
              Service Details
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-[#f8fafc] rounded-lg">
                <div className="text-xs text-[#64748b] mb-1">Duration</div>
                <div className="font-semibold flex items-center gap-2">
                  <i className="fas fa-clock text-[#8b5cf6]"></i>
                  {service.duration}
                </div>
              </div>
              <div className="p-3 bg-[#f8fafc] rounded-lg">
                <div className="text-xs text-[#64748b] mb-1">Location</div>
                <div className="font-semibold flex items-center gap-2">
                  <i className="fas fa-map-marker-alt text-[#8b5cf6]"></i>
                  {service.location}
                </div>
              </div>
               <div className="p-3 bg-[#f8fafc] rounded-lg">
                 <div className="text-xs text-[#64748b] mb-1">Price Range</div>
                 <div className="font-extrabold text-[#8b5cf6] text-lg">
                   {formatCurrency(service.priceMin ?? 0)} {service.priceMax != null && service.priceMin != null && service.priceMax > service.priceMin && `- ${formatCurrency(service.priceMax)}`}
                 </div>
               </div>
              <div className="p-3 bg-[#f8fafc] rounded-lg">
                <div className="text-xs text-[#64748b] mb-1">Status</div>
                <div className={`font-semibold px-2 py-1 rounded text-xs inline-block ${getStatusClass(service.status)}`}>
                  {service.status}
                </div>
              </div>
            </div>
          </div>

          {/* Tier */}
          {service.tier && tierLabels[service.tier] && (
            <div className="form-section">
              <div className="section-title">
                <i className="fas fa-tags"></i>
                Pricing Tier
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${tierLabels[service.tier]!.color}`}>
                  {tierLabels[service.tier]!.badge}
                </span>
                <span className="font-semibold">{tierLabels[service.tier]!.label}</span>
              </div>
            </div>
          )}

          {/* Service Mode */}
          {service.mode && (
            <div className="form-section">
              <div className="section-title">
                <i className="fas fa-briefcase"></i>
                Delivery Mode
              </div>
              <div className="flex items-center gap-2">
                {service.mode === 'in-person' && <i className="fas fa-map-marker-alt text-[#8b5cf6]"></i>}
                {service.mode === 'remote' && <i className="fas fa-video text-[#8b5cf6]"></i>}
                {service.mode === 'both' && <i className="fas fa-random text-[#8b5cf6]"></i>}
                <span className="font-semibold">{modeLabels[service.mode] || service.mode}</span>
              </div>
            </div>
          )}

          {/* Duration (if custom) */}
          {service.selectedDuration && (
            <div className="form-section">
              <div className="section-title">
                <i className="fas fa-clock"></i>
                Duration
              </div>
              <div className="font-semibold">
                {service.selectedDuration === 'custom' ? 'Custom' : `${service.selectedDuration} minutes`}
              </div>
            </div>
          )}

          {/* Specifications */}
          {service.specifications && Object.keys(service.specifications).length > 0 && (
            <div className="form-section">
              <div className="section-title">
                <i className="fas fa-sliders-h"></i>
                Specifications
              </div>
              <div className="space-y-3">
                {Object.entries(service.specifications).map(([key, values]) => (
                  <div key={key} className="border-b border-[#e2e8f0] pb-2 last:border-0">
                    <div className="text-sm font-semibold text-[#64748b] mb-1 capitalize">
                      {key.replace(/_/g, ' ')}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {values.map((val, idx) => (
                        <span key={idx} className="px-3 py-1 bg-[#ede9fe] text-[#7c3aed] rounded-full text-sm font-medium">
                          {val}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="form-section">
            <div className="section-title">
              <i className="fas fa-chart-bar"></i>
              Statistics
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 bg-[#f8fafc] rounded-lg text-center">
                <div className="text-2xl font-extrabold text-[#8b5cf6]">{service.bookings || 0}</div>
                <div className="text-xs text-[#64748b]">Total Bookings</div>
              </div>
              <div className="p-3 bg-[#f8fafc] rounded-lg text-center">
                <div className="text-2xl font-extrabold text-[#3b82f6]">{service.views || 0}</div>
                <div className="text-xs text-[#64748b]">Total Views</div>
              </div>
              {service.rating && (
                <div className="p-3 bg-[#f8fafc] rounded-lg text-center">
                  <div className="text-2xl font-extrabold text-yellow-500">{service.rating.toFixed(1)}</div>
                  <div className="text-xs text-[#64748b]">Rating</div>
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          {service.tags && service.tags.length > 0 && (
            <div className="form-section">
              <div className="section-title">
                <i className="fas fa-tags"></i>
                Tags
              </div>
              <div className="flex flex-wrap gap-2">
                {service.tags.map((tag, idx) => (
                  <span key={idx} className="px-3 py-1 bg-[#f8fafc] text-[#64748b] rounded-full text-sm">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Created Date */}
          {service.createdAt && (
            <div className="form-section">
              <div className="section-title">
                <i className="fas fa-calendar-plus"></i>
                Created
              </div>
              <div className="text-sm text-[#64748b]">
                {new Date(service.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
          <button className="btn btn-primary" onClick={() => { onClose(); /* Trigger edit flow */ }}>
            <i className="fas fa-edit"></i>
            Edit Service
          </button>
        </div>

      </div>
    </div>
  );
}
