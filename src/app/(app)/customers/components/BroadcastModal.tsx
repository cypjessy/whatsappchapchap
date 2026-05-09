"use client";

interface BroadcastModalProps {
  customerCount: number;
  message: string;
  onMessageChange: (message: string) => void;
  onSend: () => void;
  onClose: () => void;
  sending: boolean;
}

export default function BroadcastModal({
  customerCount,
  message,
  onMessageChange,
  onSend,
  onClose,
  sending,
}: BroadcastModalProps) {
  return (
    <div className="fixed inset-0 bg-[#0f172a]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-[#e2e8f0] flex justify-between items-center">
          <h2 className="text-xl font-extrabold flex items-center gap-2">
            <i className="fas fa-broadcast-tower text-[#25D366]"></i>Broadcast Message
          </h2>
          <button className="w-10 h-10 flex items-center justify-center text-[#64748b] hover:bg-[#ef4444] hover:text-white rounded-xl" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-[#64748b]">
            This will send a WhatsApp message to all {customerCount} customers.
          </p>
          <div>
            <label className="block font-semibold text-sm mb-2">Message</label>
            <textarea 
              value={message}
              onChange={(e) => onMessageChange(e.target.value)}
              rows={5}
              className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366] resize-none"
              placeholder="Enter your message..."
            ></textarea>
          </div>
        </div>
        <div className="p-6 border-t border-[#e2e8f0] flex justify-end gap-3">
          <button className="px-4 py-2 bg-white border-2 border-[#e2e8f0] rounded-xl font-semibold text-sm hover:border-[#64748b]" onClick={onClose}>Cancel</button>
          <button className="px-4 py-2 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-semibold text-sm hover:shadow-lg" onClick={onSend} disabled={sending}>
            {sending ? (
              <><i className="fas fa-circle-notch fa-spin mr-2"></i>Sending...</>
            ) : (
              <><i className="fas fa-paper-plane mr-2"></i>Send Broadcast</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
