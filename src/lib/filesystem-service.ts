"use client";

import { useState, useEffect } from "react";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";

export interface CacheOptions {
  directory?: Directory;
  encoding?: Encoding;
}

export class FilesystemService {
  private static CACHE_DIR = "image-cache";

  /**
   * Write file to filesystem
   */
  static async writeFile({
    path,
    data,
    directory = Directory.Data,
    encoding = Encoding.UTF8,
  }: {
    path: string;
    data: string;
    directory?: Directory;
    encoding?: Encoding;
  }): Promise<void> {
    try {
      await Filesystem.writeFile({
        path,
        data,
        directory,
        encoding,
      });
      console.log(`[Filesystem] Written: ${path}`);
    } catch (error) {
      console.error(`[Filesystem] Error writing ${path}:`, error);
      throw error;
    }
  }

  /**
   * Read file from filesystem
   */
  static async readFile({
    path,
    directory = Directory.Data,
    encoding = Encoding.UTF8,
  }: {
    path: string;
    directory?: Directory;
    encoding?: Encoding;
  }): Promise<string> {
    try {
      const result = await Filesystem.readFile({
        path,
        directory,
        encoding,
      });
      return result.data as string;
    } catch (error) {
      console.error(`[Filesystem] Error reading ${path}:`, error);
      throw error;
    }
  }

  /**
   * Delete file from filesystem
   */
  static async deleteFile({
    path,
    directory = Directory.Data,
  }: {
    path: string;
    directory?: Directory;
  }): Promise<void> {
    try {
      await Filesystem.deleteFile({
        path,
        directory,
      });
      console.log(`[Filesystem] Deleted: ${path}`);
    } catch (error) {
      console.error(`[Filesystem] Error deleting ${path}:`, error);
      throw error;
    }
  }

  /**
   * Check if file exists
   */
  static async fileExists({
    path,
    directory = Directory.Data,
  }: {
    path: string;
    directory?: Directory;
  }): Promise<boolean> {
    try {
      await Filesystem.stat({
        path,
        directory,
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Create directory
   */
  static async createDirectory({
    path,
    directory = Directory.Data,
    recursive = true,
  }: {
    path: string;
    directory?: Directory;
    recursive?: boolean;
  }): Promise<void> {
    try {
      await Filesystem.mkdir({
        path,
        directory,
        recursive,
      });
      console.log(`[Filesystem] Created directory: ${path}`);
    } catch (error) {
      console.error(`[Filesystem] Error creating directory ${path}:`, error);
      throw error;
    }
  }

  /**
   * List files in directory
   */
  static async readDir({
    path,
    directory = Directory.Data,
  }: {
    path: string;
    directory?: Directory;
  }): Promise<{ files: string[] }> {
    try {
      const result = await Filesystem.readdir({
        path,
        directory,
      });
      return {
        files: result.files.map((file) => file.name),
      };
    } catch (error) {
      console.error(`[Filesystem] Error reading directory ${path}:`, error);
      return { files: [] };
    }
  }

  /**
   * Cache image locally for offline access
   */
  static async cacheImage({
    url,
    filename,
  }: {
    url: string;
    filename: string;
  }): Promise<string | null> {
    try {
      // Ensure cache directory exists
      await this.createDirectory({
        path: this.CACHE_DIR,
        directory: Directory.Data,
      });

      // Fetch image
      const response = await fetch(url);
      const blob = await response.blob();

      // Convert blob to base64
      const base64 = await this.blobToBase64(blob);

      // Save to filesystem
      const path = `${this.CACHE_DIR}/${filename}`;
      await this.writeFile({
        path,
        data: base64.split(",")[1], // Remove data:image/...;base64, prefix
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });

      console.log(`[Filesystem] Cached image: ${filename}`);
      return path;
    } catch (error) {
      console.error(`[Filesystem] Error caching image ${filename}:`, error);
      return null;
    }
  }

  /**
   * Get cached image URI
   */
  static async getCachedImageUri(filename: string): Promise<string | null> {
    try {
      const path = `${this.CACHE_DIR}/${filename}`;
      const exists = await this.fileExists({
        path,
        directory: Directory.Data,
      });

      if (!exists) {
        return null;
      }

      const result = await Filesystem.getUri({
        path,
        directory: Directory.Data,
      });

      return result.uri;
    } catch (error) {
      console.error(`[Filesystem] Error getting cached image ${filename}:`, error);
      return null;
    }
  }

  /**
   * Clear image cache
   */
  static async clearCache(): Promise<void> {
    try {
      const path = this.CACHE_DIR;
      
      // Check if directory exists
      const exists = await this.fileExists({
        path,
        directory: Directory.Data,
      });

      if (exists) {
        // Recursively delete directory
        await Filesystem.rmdir({
          path,
          directory: Directory.Data,
          recursive: true,
        });
        console.log("[Filesystem] Cache cleared");
      }
    } catch (error) {
      console.error("[Filesystem] Error clearing cache:", error);
      throw error;
    }
  }

  /**
   * Get cache size (number of files)
   */
  static async getCacheSize(): Promise<number> {
    try {
      const result = await this.readDir({
        path: this.CACHE_DIR,
        directory: Directory.Data,
      });
      return result.files.length;
    } catch {
      return 0;
    }
  }

  /**
   * Helper: Convert blob to base64
   */
  private static blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

/**
 * React hook for cache management
 */
export function useImageCache() {
  const [cacheSize, setCacheSize] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCacheSize();
  }, []);

  const loadCacheSize = async () => {
    const size = await FilesystemService.getCacheSize();
    setCacheSize(size);
  };

  const cacheImage = async (url: string, filename: string) => {
    setLoading(true);
    const path = await FilesystemService.cacheImage({ url, filename });
    await loadCacheSize();
    setLoading(false);
    return path;
  };

  const getCachedImage = async (filename: string) => {
    return await FilesystemService.getCachedImageUri(filename);
  };

  const clearCache = async () => {
    setLoading(true);
    await FilesystemService.clearCache();
    await loadCacheSize();
    setLoading(false);
  };

  return {
    cacheSize,
    loading,
    cacheImage,
    getCachedImage,
    clearCache,
    refresh: loadCacheSize,
  };
}

