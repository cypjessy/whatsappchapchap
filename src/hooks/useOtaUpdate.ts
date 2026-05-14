import { useState, useCallback, useEffect } from 'react';

const CURRENT_VERSION = '1.0.2'; // bump each build
const VERSION_CHECK_URL = 'https://raw.githubusercontent.com/cypjessy/whatsappchapchap/main/version.json';

interface UseOtaUpdateReturn {
  hasUpdate: boolean;
  checkForUpdate: () => Promise<void>;
}

export const useOtaUpdate = (): UseOtaUpdateReturn => {
  const [hasUpdate, setHasUpdate] = useState(false);

  const checkForUpdate = useCallback(async () => {
    try {
      // Only check on native platform
      if (!(window as any).Capacitor?.isNativePlatform?.()) {
        return;
      }

      const res = await fetch(VERSION_CHECK_URL);
      const { version, apkUrl, releaseNotes } = await res.json();

      if (version !== CURRENT_VERSION && apkUrl) {
        setHasUpdate(true);
        showUpdatePrompt(apkUrl, version, releaseNotes);
      } else {
        setHasUpdate(false);
      }
    } catch (e) {
      console.log('[OTA Update] Version check failed:', e);
      setHasUpdate(false);
    }
  }, []);

  useEffect(() => {
    checkForUpdate();
  }, [checkForUpdate]);

  return { hasUpdate, checkForUpdate };
};

const showUpdatePrompt = (apkUrl: string, version: string, releaseNotes?: string) => {
  const banner = document.createElement('div');
  banner.style.cssText = `
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.85);
    display: flex; align-items: center;
    justify-content: center;
    z-index: 99999;
  `;
  banner.innerHTML = `
    <div style="
      background: white; border-radius: 20px;
      padding: 28px; margin: 24px;
      text-align: center;
      max-width: 340px; width: 100%;
    ">
      <div style="font-size: 48px;">⚠️</div>
      <h2 style="color: #25D366; margin: 12px 0 8px; font-size: 22px; font-weight: 700;">Update Required</h2>
      <p style="color: #666; margin-bottom: 12px; font-size: 14px;">
        A new version (${version}) is available
      </p>
      ${releaseNotes ? `<p style="color: #888; margin-bottom: 20px; font-size: 12px; background: #f5f5f5; padding: 10px; border-radius: 8px;">${releaseNotes}</p>` : ''}
      <p style="color: #dc2626; font-size: 12px; font-weight: 600; margin-bottom: 20px;">
        Please update to continue using the app
      </p>
      <button id="update-btn" style="
        background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
        color: white;
        border: none; border-radius: 12px;
        padding: 14px 32px; font-size: 16px;
        font-weight: 600; width: 100%;
        cursor: pointer;
      ">Update Now</button>
    </div>
  `;

  document.body.appendChild(banner);

  document.getElementById('update-btn')?.addEventListener('click', () => {
    window.open(apkUrl, '_system');
  });
};
