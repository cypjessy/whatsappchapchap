"use client";

import { useState, useEffect, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BulkOperationsBarProps {
  bulkSelected: string[];
  filteredCustomersCount: number;
  onSelectAll: () => void;
  onActivate: () => void;
  onSetVIP: () => void;
  onDelete: () => void;
  onExport?: () => void;
  onTag?: () => void;
  onMessage?: () => void;
}

// ─── Constants ─────────────────────────────────────────────────────────────

const ACTIONS = [
  { id: "activate", label: "Activate", icon: "fa-check", color: "bg-[#10b981]/10 text-[#10b981] hover:bg-[#10b981] hover:text-white", border: "border-[#10b981]/20" },
  { id: "vip", label: "Set VIP", icon: "fa-crown", color: "bg-[#f59e0b]/10 text-[#f59e0b] hover:bg-[#f59e0b] hover:text-white", border: "border-[#f59e0b]/20" },
  { id: "tag", label: "Add Tag", icon: "fa-tag", color: "bg-[#8b5cf6]/10 text-[#8b5cf6] hover:bg-[#8b5cf6] hover:text-white", border: "border-[#8b5cf6]/20" },
  { id: "message", label: "Message", icon: "fa-comment", color: "bg-[#3b82f6]/10 text-[#3b82f6] hover:bg-[#3b82f6] hover:text-white", border: "border-[#3b82f6]/20" },
  { id: "export", label: "Export", icon: "fa-file-export", color: "bg-[#64748b]/10 text-[#64748b] hover:bg-[#64748b] hover:text-white", border: "border-[#64748b]/20" },
  { id: "delete", label: "Delete", icon: "fa-trash-alt", color: "bg-[#ef4444]/10 text-[#ef4444] hover:bg-[#ef4444] hover:text-white", border: "border-[#ef4444]/20" },
] as const;

// ─── Sub-Components ───────────────────────────────────────────────────────────

function SelectionCheckbox({
  checked,
  indeterminate,
  count,
  total,
  onChange,
}: {
  checked: boolean;
  indeterminate: boolean;
  count: number;
  total: number;
  onChange: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <div className="relative">
        <input
          ref={inputRef}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="peer sr-only"
        />
        <div className={`
          w-5 h-5 rounded-md border-2 flex items-center justify-center
          transition-all duration-200
          ${checked || indeterminate
            ? "bg-[#25D366] border-[#25D366] shadow-sm shadow-[#25D366]/20"
            : "border-[#e2e8f0] bg-white group-hover:border-[#cbd5e1]"
          }
        `}>
          {checked && <i className="fas fa-check text-white text-[10px]" />}
          {indeterminate && <i className="fas fa-minus text-white text-[10px]" />}
        </div>
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-bold text-[#1e293b]">
          {checked ? "All Selected" : indeterminate ? `${count} Selected` : "Select All"}
        </span>
        <span className="text-[10px] text-[#94a3b8] font-medium">
          {count} of {total} customers
        </span>
      </div>
    </label>
  );
}

function ActionButton({
  action,
  disabled,
  onClick,
  isConfirming,
}: {
  action: typeof ACTIONS[number];
  disabled: boolean;
  onClick: () => void;
  isConfirming: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        group flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold
        border transition-all duration-200 active:scale-95
        ${disabled
          ? "opacity-40 cursor-not-allowed border-transparent"
          : `${action.color} ${action.border} hover:shadow-md`
        }
      `}
    >
      <i className={`fas ${isConfirming ? "fa-exclamation-circle" : action.icon} text-[10px]`} />
      <span className="hidden md:inline">{isConfirming ? "Confirm?" : action.label}</span>
      <span className="md:hidden">{isConfirming ? "!" : ""}</span>
    </button>
  );
}

function MobileActionMenu({
  selectedCount,
  onActivate,
  onSetVIP,
  onDelete,
  onExport,
  onTag,
  onMessage,
}: {
  selectedCount: number;
  onActivate: () => void;
  onSetVIP: () => void;
  onDelete: () => void;
  onExport?: () => void;
  onTag?: () => void;
  onMessage?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  if (selectedCount === 0) return null;

  const availableActions = ACTIONS.filter((a) => {
    if (a.id === "tag" && !onTag) return false;
    if (a.id === "message" && !onMessage) return false;
    if (a.id === "export" && !onExport) return false;
    return true;
  });

  return (
    <div className="md:hidden relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold
          transition-all duration-200 active:scale-95
          ${isOpen
            ? "bg-[#8b5cf6] text-white shadow-md"
            : "bg-white border-2 border-[#e2e8f0] text-[#64748b]"
          }
        `}
      >
        <i className="fas fa-ellipsis-v" />
        Actions
        <span className="ml-1 px-1.5 py-0.5 bg-[#ef4444] text-white rounded-full text-[9px] min-w-[18px] text-center">
          {selectedCount}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl border border-[#e2e8f0] shadow-xl z-50 overflow-hidden animate-fadeIn">
          {availableActions.map((action) => (
            <button
              key={action.id}
              onClick={() => {
                if (action.id === "activate") onActivate();
                if (action.id === "vip") onSetVIP();
                if (action.id === "delete") onDelete();
                if (action.id === "tag") onTag?.();
                if (action.id === "message") onMessage?.();
                if (action.id === "export") onExport?.();
                setIsOpen(false);
              }}
              className={`
                w-full flex items-center gap-3 px-4 py-3 text-xs font-bold
                hover:bg-white transition-colors text-left
                ${action.id === "delete" ? "text-[#ef4444]" : "text-[#475569]"}
              `}
            >
              <div className={`
                w-7 h-7 rounded-lg flex items-center justify-center
                ${action.color.split(" ")[0]}
              `}>
                <i className={`fas ${action.icon} text-[10px]`} />
              </div>
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BulkOperationsBar({
  bulkSelected,
  filteredCustomersCount,
  onSelectAll,
  onActivate,
  onSetVIP,
  onDelete,
  onExport,
  onTag,
  onMessage,
}: BulkOperationsBarProps) {
  const [confirmingAction, setConfirmingAction] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const selectedCount = bulkSelected.length;
  const allSelected = selectedCount === filteredCustomersCount && filteredCustomersCount > 0;
  const indeterminate = selectedCount > 0 && !allSelected;

  useEffect(() => {
    setIsVisible(selectedCount > 0);
  }, [selectedCount]);

  const handleAction = (actionId: string, handler: () => void) => {
    if (confirmingAction === actionId) {
      handler();
      setConfirmingAction(null);
    } else {
      setConfirmingAction(actionId);
      // Auto-clear confirmation after 3 seconds
      setTimeout(() => setConfirmingAction((prev) => prev === actionId ? null : prev), 3000);
    }
  };

  if (!isVisible && selectedCount === 0) {
    return (
      <div className="mb-4 bg-white border border-[#e2e8f0] rounded-xl p-3 flex items-center justify-between animate-fadeIn">
        <SelectionCheckbox
          checked={allSelected}
          indeterminate={indeterminate}
          count={selectedCount}
          total={filteredCustomersCount}
          onChange={onSelectAll}
        />
        <span className="text-xs text-[#94a3b8] font-medium">
          {filteredCustomersCount} total
        </span>
      </div>
    );
  }

  return (
    <div className="mb-4 bg-white border border-[#e2e8f0] rounded-xl p-3 md:p-4 shadow-sm animate-slideDown">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Selection */}
        <div className="flex items-center gap-3">
          <SelectionCheckbox
            checked={allSelected}
            indeterminate={indeterminate}
            count={selectedCount}
            total={filteredCustomersCount}
            onChange={onSelectAll}
          />
          
          {/* Selected count badge */}
          {selectedCount > 0 && (
            <span className={`
              px-2.5 py-1 rounded-full text-[10px] font-extrabold
              bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20
              animate-fadeIn
            `}>
              {selectedCount} selected
            </span>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2">
            <ActionButton
              action={ACTIONS[0]}
              disabled={selectedCount === 0}
              onClick={() => handleAction("activate", onActivate)}
              isConfirming={confirmingAction === "activate"}
            />
            <ActionButton
              action={ACTIONS[1]}
              disabled={selectedCount === 0}
              onClick={() => handleAction("vip", onSetVIP)}
              isConfirming={confirmingAction === "vip"}
            />
            {onTag && (
              <ActionButton
                action={ACTIONS[2]}
                disabled={selectedCount === 0}
                onClick={() => handleAction("tag", onTag)}
                isConfirming={confirmingAction === "tag"}
              />
            )}
            {onMessage && (
              <ActionButton
                action={ACTIONS[3]}
                disabled={selectedCount === 0}
                onClick={() => handleAction("message", onMessage)}
                isConfirming={confirmingAction === "message"}
              />
            )}
            {onExport && (
              <ActionButton
                action={ACTIONS[4]}
                disabled={selectedCount === 0}
                onClick={() => handleAction("export", onExport)}
                isConfirming={confirmingAction === "export"}
              />
            )}
            <div className="w-px h-6 bg-[#e2e8f0] mx-1" />
            <ActionButton
              action={ACTIONS[5]}
              disabled={selectedCount === 0}
              onClick={() => handleAction("delete", onDelete)}
              isConfirming={confirmingAction === "delete"}
            />
          </div>

          {/* Mobile Actions */}
          <MobileActionMenu
            selectedCount={selectedCount}
            onActivate={() => handleAction("activate", onActivate)}
            onSetVIP={() => handleAction("vip", onSetVIP)}
            onDelete={() => handleAction("delete", onDelete)}
            onExport={onExport}
            onTag={onTag}
            onMessage={onMessage}
          />

          {/* Clear selection */}
          {selectedCount > 0 && (
            <button
              onClick={onSelectAll}
              className="w-8 h-8 rounded-lg bg-[#f1f5f9] text-[#94a3b8] flex items-center justify-center hover:bg-[#ef4444] hover:text-white transition-all duration-200 active:scale-90"
              title="Clear selection"
            >
              <i className="fas fa-times text-xs" />
            </button>
          )}
        </div>
      </div>

      {/* Confirmation hint */}
      {confirmingAction && (
        <div className="mt-3 pt-3 border-t border-[#e2e8f0] flex items-center gap-2 text-xs text-[#f59e0b] font-semibold animate-fadeIn">
          <i className="fas fa-exclamation-triangle" />
          Click again to confirm {ACTIONS.find(a => a.id === confirmingAction)?.label.toLowerCase()}
          <span className="ml-auto text-[10px] text-[#94a3b8]">Auto-cancels in 3s</span>
        </div>
      )}
    </div>
  );
}