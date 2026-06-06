"use client";

import { useCallback } from "react";
import { Order, BusinessProfile } from "@/lib/db";
import { formatCurrency } from "@/lib/currency";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PrintInvoiceModalProps {
  order: Order | null;
  businessProfile: BusinessProfile | null;
  isOpen: boolean;
  onClose: () => void;
  formatDate: (date: any) => string;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function PrintInvoiceModal({
  order,
  businessProfile,
  isOpen,
  onClose,
  formatDate,
}: PrintInvoiceModalProps) {

  const handlePrint = useCallback(() => {
    const printWindow = window.open("", "_blank");
    if (!printWindow || !order) return;

    const businessName = businessProfile?.businessName || "Business";
    const businessAddress = businessProfile?.address || "";
    const businessCity = businessProfile?.city || "";
    const businessPhone = businessProfile?.phone || businessProfile?.whatsappNumber || "";
    const businessEmail = businessProfile?.email || "";
    const logoUrl = businessProfile?.logoUrl || "";
    const orderNumber = order.orderNumber || order.id.substring(0, 8);

    const html = `<!DOCTYPE html>
<html>
<head>
  <title>Invoice #${orderNumber}</title>
  <style>
    @page { margin: 15mm; }
    * { box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 0;
      margin: 0;
      color: #1e293b;
      font-size: 12px;
      line-height: 1.5;
    }
    .invoice-container {
      max-width: 210mm;
      margin: 0 auto;
      padding: 30px 40px;
    }
    .back-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      background: #25D366;
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
      margin-bottom: 24px;
      transition: background 0.2s;
    }
    .back-btn:hover { background: #128C7E; }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 24px;
      border-bottom: 3px solid #25D366;
      margin-bottom: 24px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .brand-logo {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      object-fit: cover;
      background: #f0fdf4;
    }
    .brand-placeholder {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      background: linear-gradient(135deg, #25D366, #128C7E);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 22px;
      font-weight: 900;
    }
    .brand-name {
      font-size: 20px;
      font-weight: 900;
      color: #1e293b;
      letter-spacing: -0.5px;
    }
    .brand-details {
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
    }
    .invoice-title {
      text-align: right;
    }
    .invoice-title h1 {
      font-size: 28px;
      font-weight: 900;
      color: #25D366;
      letter-spacing: 2px;
      margin: 0;
      text-transform: uppercase;
    }
    .invoice-title p {
      margin: 4px 0 0;
      font-size: 13px;
      color: #64748b;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 28px;
    }
    .meta-card {
      background: #f8fafc;
      border-radius: 12px;
      padding: 16px 20px;
    }
    .meta-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #94a3b8;
      margin-bottom: 8px;
    }
    .meta-value {
      font-weight: 700;
      font-size: 14px;
      color: #1e293b;
    }
    .meta-sub {
      font-size: 12px;
      color: #64748b;
      margin-top: 2px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    thead th {
      background: #f1f5f9;
      padding: 10px 14px;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #64748b;
      text-align: left;
      border-bottom: 2px solid #e2e8f0;
    }
    thead th:last-child { text-align: right; }
    thead th:nth-child(3) { text-align: center; }
    thead th:nth-child(2) { text-align: right; }
    tbody td {
      padding: 12px 14px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 13px;
    }
    tbody td:last-child {
      text-align: right;
      font-weight: 800;
    }
    tbody td:nth-child(3) { text-align: center; }
    tbody td:nth-child(2) { text-align: right; }
    .totals {
      margin-left: auto;
      width: 300px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 13px;
    }
    .totals-label { color: #64748b; }
    .totals-value { font-weight: 700; }
    .totals-divider {
      border-top: 2px solid #e2e8f0;
      margin: 6px 0;
    }
    .grand-total .totals-label {
      font-size: 16px;
      font-weight: 900;
      color: #1e293b;
    }
    .grand-total .totals-value {
      font-size: 22px;
      font-weight: 900;
      color: #25D366;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
    }
    .footer p {
      color: #94a3b8;
      font-size: 11px;
      margin: 4px 0;
    }
    .payment-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 10px;
      border-radius: 999px;
      font-size: 10px;
      font-weight: 700;
    }
    .payment-paid { background: #dcfce7; color: #16a34a; }
    .payment-unpaid { background: #fef2f2; color: #dc2626; }
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 10px;
      border-radius: 999px;
      font-size: 10px;
      font-weight: 700;
    }
    @media print {
      .back-btn { display: none !important; }
      body { padding: 0; }
      .invoice-container { padding: 0; }
    }
  </style>
</head>
<body>
  <button class="back-btn" onclick="window.close()">
    ← Back to Orders
  </button>
  
  <div class="invoice-container">
    <!-- Brand Header -->
    <div class="header">
      <div class="brand">
        ${logoUrl
          ? `<img src="${logoUrl}" alt="${businessName}" class="brand-logo" />`
          : `<div class="brand-placeholder">${businessName.charAt(0).toUpperCase()}</div>`
        }
        <div>
          <div class="brand-name">${businessName}</div>
          ${businessAddress ? `<div class="brand-details">${businessAddress}</div>` : ""}
          ${businessCity ? `<div class="brand-details">${businessCity}</div>` : ""}
          ${businessPhone ? `<div class="brand-details">📞 ${businessPhone}</div>` : ""}
          ${businessEmail ? `<div class="brand-details">✉ ${businessEmail}</div>` : ""}
        </div>
      </div>
      <div class="invoice-title">
        <h1>INVOICE</h1>
        <p>#${orderNumber}</p>
        <p style="font-size:11px;color:#94a3b8;">${formatDate(order.createdAt)}</p>
      </div>
    </div>

    <!-- Meta Cards -->
    <div class="meta-grid">
      <div class="meta-card">
        <div class="meta-label">Billed To</div>
        <div class="meta-value">${order.customerName || "Customer"}</div>
        <div class="meta-sub">📞 ${order.customerPhone || "N/A"}</div>
        ${order.customerEmail ? `<div class="meta-sub">✉ ${order.customerEmail}</div>` : ""}
        <div style="margin-top:8px;">
          <span class="payment-badge ${order.paymentStatus === "paid" ? "payment-paid" : "payment-unpaid"}">
            ${order.paymentStatus === "paid" ? "✓ Paid" : "Unpaid"}
          </span>
          <span class="status-badge" style="background:#f1f5f9;color:#475569;margin-left:4px;">
            ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </span>
        </div>
      </div>
      <div class="meta-card">
        <div class="meta-label">Delivery</div>
        <div class="meta-value">${order.deliveryMethod || "Delivery"}</div>
        <div class="meta-sub">
          ${order.deliveryAddress || order.customerAddress || "N/A"}
        </div>
        ${order.orderNotes ? `<div class="meta-sub" style="margin-top:4px;">📝 ${order.orderNotes}</div>` : ""}
      </div>
    </div>

    <!-- Products Table -->
    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th style="text-align:right;">Price</th>
          <th style="text-align:center;">Qty</th>
          <th style="text-align:right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${(order.products && order.products.length > 0)
          ? order.products.map(p => `
            <tr>
              <td><span style="font-weight:700;">${p.name}</span></td>
              <td style="text-align:right;">${formatCurrency(p.price)}</td>
              <td style="text-align:center;">${p.quantity}</td>
              <td style="text-align:right;font-weight:800;">${formatCurrency(p.price * p.quantity)}</td>
            </tr>
          `).join("")
          : `
            <tr>
              <td colspan="4" style="text-align:center;color:#94a3b8;padding:24px;">
                ${order.productName ? order.productName : "No items listed"}
              </td>
            </tr>
          `
        }
      </tbody>
    </table>

    <!-- Totals -->
    <div class="totals">
      <div class="totals-row">
        <span class="totals-label">Subtotal</span>
        <span class="totals-value">${formatCurrency(order.subtotal || 0)}</span>
      </div>
      ${(order.shipping || 0) > 0 ? `
      <div class="totals-row">
        <span class="totals-label">Shipping</span>
        <span class="totals-value">${formatCurrency(order.shipping || 0)}</span>
      </div>
      ` : ""}
      ${(order.tax || 0) > 0 ? `
      <div class="totals-row">
        <span class="totals-label">Tax</span>
        <span class="totals-value">${formatCurrency(order.tax || 0)}</span>
      </div>
      ` : ""}
      ${(order.discount || 0) > 0 ? `
      <div class="totals-row">
        <span class="totals-label">Discount</span>
        <span class="totals-value" style="color:#16a34a;">-${formatCurrency(order.discount)}</span>
      </div>
      ` : ""}
      <div class="totals-divider"></div>
      <div class="totals-row grand-total">
        <span class="totals-label">Total</span>
        <span class="totals-value">${formatCurrency(order.total || 0)}</span>
      </div>
      ${order.paymentMethod ? `
      <div class="totals-row" style="margin-top:8px;padding-top:8px;border-top:1px solid #e2e8f0;">
        <span class="totals-label">Payment Method</span>
        <span class="totals-value" style="font-size:11px;">${order.paymentMethod}${order.paymentDetails ? ` • ${order.paymentDetails}` : ""}</span>
      </div>
      ` : ""}
      ${order.notes ? `
      <div class="totals-row" style="margin-top:4px;">
        <span class="totals-label" style="align-self:flex-start;">Notes</span>
        <span class="totals-value" style="font-weight:400;font-size:11px;text-align:right;max-width:180px;">${order.notes}</span>
      </div>
      ` : ""}
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>Thank you for your business!</p>
      <p>This is a computer-generated invoice.</p>
      <p style="margin-top:8px;font-size:10px;color:#cbd5e1;">Invoice #${orderNumber} • ${formatDate(order.createdAt)}</p>
    </div>
  </div>
</body>
</html>`;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);
  }, [order, businessProfile, formatDate]);

  if (!isOpen || !order) return null;

  const businessName = businessProfile?.businessName || "Business";
  const orderNumber = order.orderNumber || order.id.substring(0, 8);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-[3000] animate-fadeIn" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-[3000] flex items-center justify-center p-3 sm:p-4 pointer-events-none overflow-y-auto">
        <div
          className="bg-surface rounded-2xl w-full max-w-[700px] max-h-[90vh] overflow-hidden shadow-2xl flex flex-col pointer-events-auto animate-slideUp my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex-shrink-0 px-5 py-3 border-b border-outline-variant bg-gradient-to-r from-[rgba(37,211,102,0.06)] to-[rgba(18,140,126,0.04)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center text-white text-base shadow-lg">
                <i className="fas fa-file-invoice" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-on-surface">Invoice Preview</h2>
                <p className="text-[10px] text-on-surface-variant font-medium">#{orderNumber}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-bold text-xs shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 flex items-center gap-2"
              >
                <i className="fas fa-print text-xs" />
                Print
              </button>
              <button
                onClick={onClose}
                className="w-9 h-9 flex items-center justify-center text-on-surface-variant hover:bg-red-50 hover:text-red-500 rounded-xl transition-all active:scale-95"
                aria-label="Close"
              >
                <i className="fas fa-times" />
              </button>
            </div>
          </div>

          {/* Body — scrollable invoice preview */}
          <div className="flex-1 overflow-y-auto p-5 scrollbar-thin bg-[#f8fafc]">
            <div
              className="bg-surface rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden"
              style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif", color: '#1e293b', fontSize: '12px' }}
            >
              {/* Brand Header */}
              <div className="flex justify-between items-start p-5 pb-3 border-b-2 border-[#25D366]">
                <div className="flex items-center gap-3">
                  {businessProfile?.logoUrl ? (
                    <img src={businessProfile.logoUrl} alt={businessName} className="w-11 h-11 rounded-lg object-cover" />
                  ) : (
                    <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center text-white font-black text-lg">
                      {businessName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="font-black text-sm text-[#1e293b]">{businessName}</div>
                    {businessProfile?.address && <div className="text-[10px] text-gray-500">{businessProfile.address}</div>}
                    {businessProfile?.city && <div className="text-[10px] text-gray-500">{businessProfile.city}</div>}
                    {(businessProfile?.phone || businessProfile?.whatsappNumber) && (
                      <div className="text-[10px] text-gray-500">📞 {businessProfile.phone || businessProfile.whatsappNumber}</div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-[#25D366] tracking-widest">INVOICE</div>
                  <div className="text-[11px] font-bold text-gray-500 mt-0.5">#{orderNumber}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{formatDate(order.createdAt)}</div>
                </div>
              </div>

              {/* Billed To / Delivery */}
              <div className="grid grid-cols-2 gap-3 p-5">
                <div className="bg-[#f8fafc] rounded-xl p-3">
                  <div className="text-[9px] font-black uppercase tracking-wider text-gray-400 mb-2">Billed To</div>
                  <div className="font-black text-xs">{order.customerName || "Customer"}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">📞 {order.customerPhone || "N/A"}</div>
                  {order.customerEmail && <div className="text-[10px] text-gray-500">✉ {order.customerEmail}</div>}
                  <div className="flex gap-1 mt-2">
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold ${order.paymentStatus === "paid" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {order.paymentStatus === "paid" ? "✓ Paid" : "Unpaid"}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[8px] font-bold">
                      {order.status}
                    </span>
                  </div>
                </div>
                <div className="bg-[#f8fafc] rounded-xl p-3">
                  <div className="text-[9px] font-black uppercase tracking-wider text-gray-400 mb-2">Delivery</div>
                  <div className="font-black text-xs">{order.deliveryMethod || "Delivery"}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">
                    {order.deliveryAddress || order.customerAddress || "N/A"}
                  </div>
                  {order.orderNotes && <div className="text-[10px] text-gray-500 mt-1">📝 {order.orderNotes}</div>}
                </div>
              </div>

              {/* Products Table */}
              <div className="px-5">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[#f1f5f9]">
                      <th className="text-left px-3 py-2 text-[9px] font-black uppercase tracking-wider text-gray-500">Item</th>
                      <th className="text-right px-3 py-2 text-[9px] font-black uppercase tracking-wider text-gray-500">Price</th>
                      <th className="text-center px-3 py-2 text-[9px] font-black uppercase tracking-wider text-gray-500">Qty</th>
                      <th className="text-right px-3 py-2 text-[9px] font-black uppercase tracking-wider text-gray-500">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.products && order.products.length > 0
                      ? order.products.map((p, idx) => (
                          <tr key={idx} className="border-b border-gray-100">
                            <td className="px-3 py-2.5 font-bold text-xs">{p.name}</td>
                            <td className="px-3 py-2.5 text-right text-xs">{formatCurrency(p.price)}</td>
                            <td className="px-3 py-2.5 text-center text-xs">{p.quantity}</td>
                            <td className="px-3 py-2.5 text-right font-black text-xs">{formatCurrency(p.price * p.quantity)}</td>
                          </tr>
                        ))
                      : (
                        <tr>
                          <td colSpan={4} className="text-center px-3 py-6 text-xs text-gray-400">
                            {order.productName || "No items listed"}
                          </td>
                        </tr>
                      )
                    }
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end px-5 py-4">
                <div className="w-[250px] space-y-1.5">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Subtotal</span>
                    <span className="font-bold text-gray-700">{formatCurrency(order.subtotal || 0)}</span>
                  </div>
                  {(order.shipping || 0) > 0 && (
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Shipping</span>
                      <span className="font-bold text-gray-700">{formatCurrency(order.shipping || 0)}</span>
                    </div>
                  )}
                  {(order.tax || 0) > 0 && (
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Tax</span>
                      <span className="font-bold text-gray-700">{formatCurrency(order.tax || 0)}</span>
                    </div>
                  )}
                  {(order.discount || 0) > 0 && (
                    <div className="flex justify-between text-xs text-green-600">
                      <span>Discount</span>
                      <span className="font-bold">-{formatCurrency(order.discount)}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-1.5 flex justify-between">
                    <span className="font-black text-sm text-gray-800">Total</span>
                    <span className="font-black text-lg text-[#25D366]">{formatCurrency(order.total || 0)}</span>
                  </div>
                  {order.paymentMethod && (
                    <div className="border-t border-gray-100 pt-1.5 flex justify-between">
                      <span className="text-[10px] text-gray-400">Payment</span>
                      <span className="text-[10px] font-bold text-gray-600">{order.paymentMethod}{order.paymentDetails ? ` • ${order.paymentDetails}` : ""}</span>
                    </div>
                  )}
                  {order.notes && (
                    <div className="pt-1.5 flex justify-between">
                      <span className="text-[10px] text-gray-400">Notes</span>
                      <span className="text-[10px] text-gray-600 text-right max-w-[160px]">{order.notes}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-gray-100 px-5 py-4 text-center">
                <p className="text-[10px] text-gray-400">Thank you for your business!</p>
                <p className="text-[9px] text-gray-300 mt-0.5">Invoice #{orderNumber} • {formatDate(order.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 px-4 py-3 border-t border-outline-variant bg-surface flex items-center justify-between">
            <span className="text-[10px] text-on-surface-variant">
              <i className="fas fa-info-circle mr-1" />
              Preview as it will appear when printed
            </span>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 border-2 border-outline-variant rounded-xl text-[10px] font-black uppercase tracking-widest text-on-surface-variant hover:bg-surface-variant transition-all"
              >
                Close
              </button>
              <button
                onClick={handlePrint}
                className="px-5 py-2 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 flex items-center gap-2"
              >
                <i className="fas fa-print text-xs" />
                Print Invoice
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
