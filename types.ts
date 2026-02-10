// Global types for the QR-Doc Automator application
export interface ScannedFile {
  id: string;
  file: File;
  previewUrl: string;
  qrData: string | null;
  status: 'pending' | 'processing' | 'success' | 'failed';
  timestamp: number;
}

export interface DocumentGroup {
  qrId: string;
  files: ScannedFile[];
}

export type AppStatus = 'idle' | 'scanning' | 'ready';
