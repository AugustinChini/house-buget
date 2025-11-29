export interface NoteAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl?: string;
  url?: string;
}

export interface Note {
  id: number;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  attachments?: NoteAttachment[];
  isRichContent?: boolean;
}
