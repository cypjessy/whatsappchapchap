import { User } from "firebase/auth";

// Use environment variables or fallback to hardcoded values
const BUNNY_STORAGE_HOST = process.env.NEXT_PUBLIC_BUNNY_STORAGE_HOST || "jh.storage.bunnycdn.com";
const BUNNY_STORAGE_ZONE = process.env.NEXT_PUBLIC_BUNNY_STORAGE_ZONE || "histoview";
const BUNNY_STORAGE_API_KEY = process.env.BUNNY_API_KEY || "213c0699-7662-4802-8017bd573513-a997-4abe";
const BUNNY_CDN_URL = process.env.NEXT_PUBLIC_BUNNY_CDN_URL || "https://histoview.b-cdn.net";

console.log("STORAGE: Using config:", {
  host: BUNNY_STORAGE_HOST,
  zone: BUNNY_STORAGE_ZONE,
  keySet: !!BUNNY_STORAGE_API_KEY,
  cdn: BUNNY_CDN_URL,
});

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export interface StorageService {
  uploadFile: (user: User, file: File, folder?: string) => Promise<UploadResult>;
  deleteFile: (user: User, fileUrl: string) => Promise<boolean>;
  getFileUrl: (user: User, filename: string, folder?: string) => string;
}

function getTenantId(user: User): string {
  return `tenant_${user.uid}`;
}

export const bunnyStorage = {
  async uploadFile(user: User, file: File, folder: string = "products"): Promise<UploadResult> {
    console.log("Bunny Storage uploadFile called:", { 
      fileName: file.name,
      fileSize: file.size,
      folder
    });
    
    try {
      // Get auth token
      const token = await user.getIdToken();
      
      // Create FormData for API upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);
      
      console.log("Uploading via API route with Sharp compression...");
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        console.error("Upload failed:", data.error);
        return { success: false, error: data.error || 'Upload failed' };
      }
      
      console.log("Upload success, URL:", data.url);
      return { success: true, url: data.url };
    } catch (error) {
      console.error("Bunny Storage upload error:", error);
      return { success: false, error: error instanceof Error ? error.message : "Upload failed" };
    }
  },

  async deleteFile(user: User, fileUrl: string): Promise<boolean> {
    if (!BUNNY_STORAGE_HOST || !BUNNY_STORAGE_ZONE || !BUNNY_STORAGE_API_KEY) {
      return false;
    }

    try {
      const urlParts = fileUrl.split(`/${BUNNY_STORAGE_ZONE}/`);
      if (urlParts.length < 2) return false;
      
      const path = urlParts[urlParts.length - 1];

      const response = await fetch(`https://${BUNNY_STORAGE_HOST}/${BUNNY_STORAGE_ZONE}/${path}`, {
        method: "DELETE",
        headers: {
          "AccessKey": BUNNY_STORAGE_API_KEY!,
        },
      });

      return response.ok;
    } catch (error) {
      console.error("Bunny Storage delete error:", error);
      return false;
    }
  },

  getFileUrl(user: User, filename: string, folder: string = "products"): string {
    if (!BUNNY_CDN_URL || !BUNNY_STORAGE_ZONE) {
      return "";
    }
    const tenantId = getTenantId(user);
    return `${BUNNY_CDN_URL}/${tenantId}/${folder}/${filename}`;
  },
};
