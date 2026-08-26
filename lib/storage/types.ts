export interface FileUploadResult {
  key: string;
  url: string;
  size: number;
  mimeType: string;
}

export interface StorageService {
  uploadFile(fileBuffer: Buffer, fileName: string, mimeType: string): Promise<FileUploadResult>;
  getDownloadUrl(key: string, expiresInSeconds?: number): Promise<string>;
  deleteFile(key: string): Promise<boolean>;
}
