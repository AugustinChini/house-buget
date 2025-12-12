export interface NoteAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl?: string;
  url?: string;
  storagePath?: string;
  isTemp?: boolean;
  uploadProgress?: number;
  isUploading?: boolean;
}

export interface Note {
  id: number;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  attachments?: NoteAttachment[];
  isRichContent?: boolean;
}
