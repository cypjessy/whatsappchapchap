"use client";

import { useState, useCallback, useRef, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BroadcastModalProps {
  customerCount: number;
  message: string;
  onMessageChange: (message: string) => void;
  onSend: () => void;
  onClose: () => void;
  sending: boolean;
  sentCount?: number;
  failedCount?: number;
}

// ─── Constants ─────────────────────────────────────────────────────────────

const MESSAGE_TEMPLATES = [
  { id: "promo", label: "Promotion", icon: "fa-tag", text: "🎉 Special offer! Get 20% off your next booking. Valid until [date]. Book now!" },
  { id: "reminder", label: "Reminder", icon: "fa-clock", text: "⏰ Hi [name], just a friendly reminder about your upcoming appointment on [date] at [time]. See you soon!" },
  { id: "thankyou", label: "Thank You", icon: "fa-heart", text: "🙏 Thank you for choosing us, [name]! We hope you enjoyed your service. Leave us a review?" },
  { id: "followup", label: "Follow Up", icon: "fa-handshake", text: "👋 Hi [name], how was your experience with us? We'd love your feedback!" },
  { id: "reengagement", label: "Re-engage", icon: "fa-bell", text: "💫 We miss you, [name]! It's been a while. Book your next appointment and get a special welcome-back discount." },
] as const;

const MAX_CHARS = 1000;

// ─── Sub-Components ───────────────────────────────────────────────────────────

function CharacterCounter({ current, max }: { current: number; max: number }) {
  const percentage = Math.min((current / max) * 100, 100);
  const isNearLimit = percentage > 80;
  const isOverLimit = current > max;

  return (
    <div className="flex items-center gap-2 mt-2">
      <div className="flex-1 h-1.5 bg-[#e2e8f0] rounded-full overflow-hidden">
        <div
          className={`
            h-full rounded-full transition-all duration-300
            ${isOverLimit ? "bg-[#ef4444]" : isNearLimit ? "bg-[#f59e0b]" : "bg-[#25D366]"}
          `}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <span className={`
        text-[10px] font-bold tabular-nums
        ${isOverLimit ? "text-[#ef4444]" : isNearLimit ? "text-[#f59e0b]" : "text-[#94a3b8]"}
      `}>
        {current}/{max}
      </span>
    </div>
  );
}

function TemplateButton({
  template,
  isActive,
  onClick,
}: {
  template: typeof MESSAGE_TEMPLATES[number];
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-xs font-bold
        transition-all duration-200 active:scale-95
        ${isActive
          ? "border-[#25D366] bg-[#DCF8C6]/30 text-[#25D366]"
          : "border-[#e2e8f0] bg-white text-[#64748b] hover:border-[#cbd5e1]"
        }
      `}
    >
      <i className={`fas ${template.icon}`} />
      {template.label}
    </button>
  );
}

function DeliveryPreview({
  customerCount,
  message,
}: {
  customerCount: number;
  message: string;
}) {
  const estimatedTime = Math.ceil(customerCount * 0.5); // ~0.5s per message
  const cost = customerCount * 0; // WhatsApp API cost estimation

  return (
    <div className="bg-white rounded-xl p-3 md:p-4 space-y-2 border border-[#e2e8f0]">
      <div className="flex items-center gap-2 text-xs font-bold text-[#64748b] uppercase tracking-wider">
        <i className="fas fa-chart-pie text-[#8b5cf6]" />
        Delivery Preview
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center p-2 bg-white rounded-lg border border-[#e2e8f0]">
          <div className="text-lg font-extrabold text-[#8b5cf6]">{customerCount}</div>
          <div className="text-[10px] text-[#94a3b8] font-semibold">Recipients</div>
        </div>
        <div className="text-center p-2 bg-white rounded-lg border border-[#e2e8f0]">
          <div className="text-lg font-extrabold text-[#f59e0b]">~{estimatedTime}s</div>
          <div className="text-[10px] text-[#94a3b8] font-semibold">Est. Time</div>
        </div>
        <div className="text-center p-2 bg-white rounded-lg border border-[#e2e8f0]">
          <div className="text-lg font-extrabold text-[#10b981]">{message.length}</div>
          <div className="text-[10px] text-[#94a3b8] font-semibold">Characters</div>
        </div>
      </div>
    </div>
  );
}

function MessagePreview({ message }: { message: string }) {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="space-y-2">
      <button
        onClick={() => setShowPreview(!showPreview)}
        className="flex items-center gap-2 text-xs font-bold text-[#8b5cf6] hover:text-[#7c3aed] transition-colors"
      >
        <i className={`fas fa-eye${showPreview ? "-slash" : ""}`} />
        {showPreview ? "Hide Preview" : "Show Preview"}
      </button>

      {showPreview && (
        <div className="animate-fadeIn">
          <div className="bg-[#DCF8C6] rounded-2xl rounded-tl-sm p-3 md:p-4 max-w-[85%] ml-auto shadow-sm">
            <div className="flex items-start gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center text-white text-xs font-bold shrink-0">
                <i className="fas fa-broadcast-tower" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-bold text-[#075E54]">Your Business</div>
                <p className="text-sm text-[#1e293b] whitespace-pre-wrap leading-relaxed">
                  {message || "Your message will appear here..."}
                </p>
                <div className="flex items-center justify-end gap-1 text-[10px] text-[#34B7F1]">
                  <span>12:30 PM</span>
                  <i className="fas fa-check-double" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BroadcastModal({
  customerCount,
  message,
  onMessageChange,
  onSend,
  onClose,
  sending,
  sentCount = 0,
  failedCount = 0,
}: BroadcastModalProps) {
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTemplateClick = useCallback((template: typeof MESSAGE_TEMPLATES[number]) => {
    setActiveTemplate(template.id);
    onMessageChange(template.text);
    textareaRef.current?.focus();
  }, [onMessageChange]);

  const handleSend = async () => {
    if (!message.trim()) return;
    await onSend();
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const isOverLimit = message.length > MAX_CHARS;
  const canSend = message.trim().length > 0 && !isOverLimit && !sending;

  return (
    <div
      className="fixed inset-0 md3-dialog-backdrop z-50 flex items-start justify-center p-3 md:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="md3-dialog w-full max-w-lg my-4 md:my-8 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - MD3 Dialog Header */}
        <div className="px-6 py-5 border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center text-white shadow-md">
              <i className="fas fa-broadcast-tower" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-normal text-[var(--md-sys-color-on-surface)]">Broadcast Message</h2>
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] font-medium">
                Reach {customerCount} customer{customerCount !== 1 ? "s" : ""} instantly
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={sending}
            className="w-10 h-10 flex items-center justify-center text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-variant)] rounded-full transition-all duration-200 active:scale-95"
          >
            <i className="fas fa-times" />
          </button>
        </div>

        {/* Body - MD3 Dialog Content */}
        <div className="md3-dialog-content space-y-4 md:space-y-5">
          {/* Success State */}
          {showSuccess && (
            <div className="bg-[#10b981]/10 border border-[#10b981]/20 rounded-xl p-3 flex items-center gap-3 animate-fadeIn">
              <div className="w-8 h-8 rounded-full bg-[#10b981] flex items-center justify-center text-white shrink-0">
                <i className="fas fa-check" />
              </div>
              <div>
                <div className="text-sm font-bold text-[#10b981]">Broadcast Sent!</div>
                <div className="text-xs text-[#64748b]">
                  {sentCount} delivered • {failedCount} failed
                </div>
              </div>
            </div>
          )}

          {/* Templates */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#64748b] uppercase tracking-wider">
              Quick Templates
            </label>
            <div className="flex flex-wrap gap-2">
              {MESSAGE_TEMPLATES.map((template) => (
                <TemplateButton
                  key={template.id}
                  template={template}
                  isActive={activeTemplate === template.id}
                  onClick={() => handleTemplateClick(template)}
                />
              ))}
            </div>
          </div>

          {/* Message Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#475569] uppercase tracking-wider">
                Message
              </label>
              <span className="text-[10px] text-[#94a3b8] font-medium">
                Supports [name], [date] placeholders
              </span>
            </div>
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => {
                  onMessageChange(e.target.value);
                  if (activeTemplate) setActiveTemplate(null);
                }}
                rows={5}
                className={`
                  w-full px-4 py-3 rounded-xl border-2 text-sm font-medium resize-none
                  transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0
                  ${isOverLimit
                    ? "border-[#ef4444] bg-[#fef2f2] focus:ring-[#ef4444]/20 text-[#ef4444]"
                    : "border-[#e2e8f0] focus:border-[#25D366] focus:ring-[#25D366]/20 text-[#1e293b]"
                  }
                `}
                placeholder="Enter your message or select a template above..."
                disabled={sending}
              />
              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                <button
                  onClick={() => onMessageChange(message + "😊")}
                  className="w-7 h-7 rounded-lg bg-[#f1f5f9] text-[#94a3b8] hover:bg-[#fde68a] hover:text-[#d97706] flex items-center justify-center transition-all text-xs"
                  title="Add emoji"
                >
                  <i className="fas fa-smile" />
                </button>
              </div>
            </div>
            <CharacterCounter current={message.length} max={MAX_CHARS} />
          </div>

          {/* Preview */}
          <MessagePreview message={message} />

          {/* Delivery Stats */}
          <DeliveryPreview customerCount={customerCount} message={message} />
        </div>

        {/* Footer - MD3 Dialog Actions */}
        <div className="md3-dialog-actions">
          <button
            onClick={onClose}
            disabled={sending}
            className="md3-btn-text disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            onClick={handleSend}
            disabled={!canSend}
            className={`
              md3-btn-filled disabled:opacity-50 flex items-center gap-2
              ${!canSend ? 'cursor-not-allowed' : ''}
            `}
          >
            {sending ? (
              <>
                <i className="fas fa-circle-notch fa-spin text-sm" />
                <span>Sending {sentCount}/{customerCount}...</span>
              </>
            ) : (
              <>
                <i className="fas fa-paper-plane text-sm" />
                <span>Send to {customerCount}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}