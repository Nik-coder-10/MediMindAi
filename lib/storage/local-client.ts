import fs from "fs/promises";
import path from "path";
import { StorageService, FileUploadResult } from "./types";

export class LocalStorageService implements StorageService {
  private baseDir: string;

  constructor() {
    this.baseDir = path.join(process.cwd(), "public", "uploads");
  }

  private async ensureDir() {
    try {
      await fs.mkdir(this.baseDir, { recursive: true });
    } catch {
      // Ignore if exists
    }
  }

  async uploadFile(fileBuffer: Buffer, fileName: string, mimeType: string): Promise<FileUploadResult> {
    await this.ensureDir();
    const sanitizedName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const filePath = path.join(this.baseDir, sanitizedName);

    await fs.writeFile(filePath, fileBuffer);

    return {
      key: sanitizedName,
      url: `/uploads/${sanitizedName}`,
      size: fileBuffer.length,
      mimeType,
    };
  }

  async getDownloadUrl(key: string): Promise<string> {
    return `/uploads/${key}`;
  }

  async deleteFile(key: string): Promise<boolean> {
    try {
      const filePath = path.join(this.baseDir, key);
      await fs.unlink(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

export const localStorageService = new LocalStorageService();
