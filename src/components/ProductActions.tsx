"use client";

import React from 'react';
import { useClipboard } from '@/hooks/useClipboard';
import { useShare } from '@/hooks/useShare';
import { useToast } from '@/hooks/useToast';
import { useHaptics } from '@/hooks/useHaptics';

/**
 * Example component demonstrating Capacitor plugin usage
 * This can be used in product cards, order details, etc.
 */
export function ProductActions({ 
  productId, 
  productName, 
  mpesaCode 
}: { 
  productId: string;
  productName: string;
  mpesaCode?: string;
}) {
  const { copy } = useClipboard();
  const { share } = useShare();
  const { show: showToast } = useToast();
  const { impactLight, notificationSuccess } = useHaptics();

  const handleCopyMpesaCode = async () => {
    if (!mpesaCode) return;
    
    await impactLight();
    const success = await copy(mpesaCode);
    
    if (success) {
      await notificationSuccess();
      await showToast({
        text: 'M-Pesa code copied!',
        duration: 'short',
        position: 'bottom'
      });
    }
  };

  const handleShareProduct = async () => {
    await impactLight();
    const success = await share({
      title: `Check out ${productName}`,
      text: `Found this amazing product: ${productName}`,
      url: `${window.location.origin}/product/${productId}`
    });

    if (success) {
      await showToast({
        text: 'Shared successfully!',
        duration: 'short',
        position: 'bottom'
      });
    }
  };

  return (
    <div className="flex gap-2">
      {mpesaCode && (
        <button
          onClick={handleCopyMpesaCode}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          <i className="fas fa-copy mr-2"></i>
          Copy Code
        </button>
      )}
      
      <button
        onClick={handleShareProduct}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        <i className="fas fa-share-alt mr-2"></i>
        Share
      </button>
    </div>
  );
}
