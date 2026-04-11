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
      host: BUNNY_STORAGE_HOST, 
      zone: BUNNY_STORAGE_ZONE, 
      hasApiKey: !!BUNNY_STORAGE_API_KEY, 
      cdnUrl: BUNNY_CDN_URL,
      fileName: file.name,
      fileSize: file.size
    });
    
    if (!BUNNY_STORAGE_HOST || !BUNNY_STORAGE_ZONE || !BUNNY_STORAGE_API_KEY) {
      console.error("Bunny Storage not configured - missing config");
      return { success: false, error: "Bunny Storage not configured" };
    }

    try {
      const tenantId = getTenantId(user);
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const filename = `${timestamp}-${sanitizedName}`;
      // Use the storage API URL format that Bunny expects
      const path = `${tenantId}/${folder}/${filename}`;
      const uploadUrl = `https://${BUNNY_STORAGE_HOST}/${BUNNY_STORAGE_ZONE}/${path}`;
      
      console.log("Uploading to:", uploadUrl);
      console.log("Using API Key:", BUNNY_STORAGE_API_KEY?.substring(0, 8) + "...");
      console.log("Zone:", BUNNY_STORAGE_ZONE);
      
      const buffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(buffer);

      const response = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
          "AccessKey": BUNNY_STORAGE_API_KEY!,
        },
        body: uint8Array,
      });

      console.log("Upload response:", response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Upload failed:", errorText);
        
        // Try with Authorization header if AccessKey failed
        if (response.status === 401) {
          console.log("Trying with Authorization header...");
          const altResponse = await fetch(uploadUrl, {
            method: "PUT",
            headers: {
              "Content-Type": file.type,
              "Authorization": BUNNY_STORAGE_API_KEY!,
            },
            body: uint8Array,
          });
          console.log("Alt response:", altResponse.status, altResponse.statusText);
          if (altResponse.ok) {
            const url = `${BUNNY_CDN_URL}/${path}`;
            return { success: true, url };
          }
          const altError = await altResponse.text();
          console.error("Alt also failed:", altError);
        }
        
        return { success: false, error: `Upload failed: ${errorText}` };
      }

      const url = `${BUNNY_CDN_URL}/${path}`;
      console.log("Upload success, URL:", url);
      return { success: true, url };
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
