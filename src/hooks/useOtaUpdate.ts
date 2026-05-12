import { useEffect } from 'react';

const CURRENT_VERSION = '1.0.0'; // bump each build
const VERSION_CHECK_URL = 'https://raw.githubusercontent.com/cypjessy/whatsappchapchap/main/version.json';

export const useOtaUpdate = () => {
  useEffect(() => {
    // Only check for updates on native platform (Capacitor)
    if (!(window as any).Capacitor?.isNativePlatform?.()) {
      return;
    }

    checkUpdate();
  }, []);

  const checkUpdate = async () => {
    try {
      const res = await fetch(VERSION_CHECK_URL);
      const { version, apkUrl, releaseNotes } = await res.json();

      if (version !== CURRENT_VERSION) {
        showUpdatePrompt(apkUrl, version, releaseNotes);
      }
    } catch (e) {
      // silently fail
      console.log('[OTA Update] Version check failed:', e);
    }
  };
};

const showUpdatePrompt = (apkUrl: string, version: string, releaseNotes?: string) => {
  // Check if user already dismissed this version
  const dismissedVersion = localStorage.getItem('ota_dismissed_version');
  if (dismissedVersion === version) {
    return;
  }

  const banner = document.createElement('div');
  banner.style.cssText = `
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.7);
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
      <div style="font-size: 48px;">🚀</div>
      <h2 style="color: #25D366; margin: 12px 0 8px; font-size: 22px; font-weight: 700;">Update Available</h2>
      <p style="color: #666; margin-bottom: 12px; font-size: 14px;">
        Version ${version} is ready to install
      </p>
      ${releaseNotes ? `<p style="color: #888; margin-bottom: 20px; font-size: 12px; background: #f5f5f5; padding: 10px; border-radius: 8px;">${releaseNotes}</p>` : ''}
      <button id="update-btn" style="
        background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
        color: white;
        border: none; border-radius: 12px;
        padding: 14px 32px; font-size: 16px;
        font-weight: 600; width: 100%;
        margin-bottom: 10px;
        cursor: pointer;
      ">Download & Install</button>
      <button id="later-btn" style="
        background: transparent; color: #999;
        border: none; font-size: 14px;
        padding: 8px;
        cursor: pointer;
      ">Later</button>
    </div>
  `;

  document.body.appendChild(banner);

  document.getElementById('update-btn')?.addEventListener('click', () => {
    // Download and install APK
    window.open(apkUrl, '_system');
    banner.remove();
  });

  document.getElementById('later-btn')?.addEventListener('click', () => {
    // Save dismissed version to localStorage
    localStorage.setItem('ota_dismissed_version', version);
    banner.remove();
  });
};
