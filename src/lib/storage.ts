import { User } from "firebase/auth";
import { buildApiUrl } from '@/lib/api-config';

const BUNNY_CDN_URL = process.env.NEXT_PUBLIC_BUNNY_CDN_URL || "https://histoview.b-cdn.net";

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

// Client-side image compression using canvas
function compressImage(file: File, maxWidth: number, quality: number): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      
      // Calculate new dimensions maintaining aspect ratio
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(img.src);
          if (blob) {
            const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, '') + '.webp', {
              type: 'image/webp',
            });
            resolve(compressedFile);
          } else {
            resolve(file); // Fallback to original if compression fails
          }
        },
        'image/webp',
        quality
      );
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      resolve(file); // Fallback to original on error
    };
  });
}

export const bunnyStorage = {
  async uploadFile(user: User, file: File, folder: string = "products"): Promise<UploadResult> {
    console.log("Bunny Storage uploadFile called:", { 
      fileName: file.name,
      fileSize: file.size,
      folder
    });
    
    try {
      //  CLIENT-SIDE COMPRESSION: Compress before upload to speed up server processing
      const compressedFile = await compressImage(file, 800, 0.7);
      console.log("Client-side compression:", {
        originalSize: file.size,
        compressedSize: compressedFile.size,
        reduction: `${Math.round((1 - compressedFile.size / file.size) * 100)}%`
      });
      
      // Get auth token - FORCE REFRESH to prevent stale token issues on Android
      const token = await user.getIdToken(true);
      
      // Create FormData for API upload
      const formData = new FormData();
      formData.append('file', compressedFile);
      formData.append('folder', folder);
      
      console.log("Uploading via API route with Sharp compression...");
      
      const response = await fetch(buildApiUrl('/api/upload'), {
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

  // ✅ Now goes through API route — API key stays server-side only
  async deleteFile(user: User, fileUrl: string): Promise<boolean> {
    try {
      // Force token refresh to prevent stale token issues on Android
      const token = await user.getIdToken(true);

      const response = await fetch(buildApiUrl(`/api/upload?url=${encodeURIComponent(fileUrl)}`), {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      return response.ok;
    } catch (error) {
      console.error("Delete error:", error);
      return false;
    }
  },

  getFileUrl(user: User, filename: string, folder: string = "products"): string {
    if (!BUNNY_CDN_URL) return "";
    const tenantId = getTenantId(user);
    return `${BUNNY_CDN_URL}/${tenantId}/${folder}/${filename}`;
  },
};
