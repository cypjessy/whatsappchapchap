/**
 * App Version Configuration
 * 
 * IMPORTANT: Update these values EVERY TIME you build a new APK.
 * Must match android/app/build.gradle versionCode and versionName.
 * 
 * versionCode: Increment by 1 for each release (Android requires monotonically increasing)
 * versionName: Human-readable version string
 */

export const APP_VERSION_CODE = 29; // Must match android/app/build.gradle → versionCode
export const APP_VERSION_NAME = "1.0.28"; // Must match android/app/build.gradle → versionName
export const APP_PACKAGE_NAME = "com.whatsappchapchap.app";

/**
 * Firestore path for the app version configuration document.
 * This document is checked at app startup to see if a force update is needed.
 * 
 * Document structure in Firestore:
 * {
 *   minimumVersionCode: number,    // Minimum versionCode required
 *   minimumVersionName: string,    // Display version (e.g. "1.0.1")
 *   latestVersionCode: number,     // Latest available versionCode
 *   latestVersionName: string,     // Latest display version
 *   updateUrl: string,             // URL to download the APK
 *   forceUpdateMessage: string,    // Custom message to show users
 *   updatedAt: timestamp
 * }
 */
export const APP_VERSION_FIRESTORE_PATH = "appVersions/android";
