import { apiService } from "./apiService";
import { ensureDate } from "../utils/dateUtils";
import type { Note, NoteAttachment } from "../models/Note";

const NOTE_CONTENT_VERSION = 2 as const;

type SerializedNotePayload = {
  version: typeof NOTE_CONTENT_VERSION;
  html: string;
  attachments: NoteAttachment[];
};

type NoteEditorPayload = {
  content: string;
  attachments?: NoteAttachment[];
};

const looksLikeHtml = (value: string) => /<\/?[a-z][\s\S]*>/i.test(value);

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const plainTextToHtml = (value: string) =>
  `<p>${escapeHtml(value).replace(/\n/g, "<br/>")}</p>`;

const sanitizeAttachments = (attachments: NoteAttachment[] = []) =>
  attachments.map((attachment, index) => {
    const id =
      attachment.id ||
      `${Date.now()}-${index}-${attachment.name || "attachment"}`;

    const sanitized: NoteAttachment = {
      id,
      name: attachment.name,
      size: attachment.size ?? 0,
      type: attachment.type,
    };

    if (attachment.dataUrl) {
      sanitized.dataUrl = attachment.dataUrl;
    }

    if (attachment.url) {
      sanitized.url = attachment.url;
    }

    if (attachment.storagePath) {
      sanitized.storagePath = attachment.storagePath;
    }

    if (attachment.isTemp) {
      sanitized.isTemp = attachment.isTemp;
    }

    return sanitized;
  });

const serializeRichContent = (
  html: string,
  attachments: NoteAttachment[] = []
) =>
  JSON.stringify({
    version: NOTE_CONTENT_VERSION,
    html,
    attachments: sanitizeAttachments(attachments),
  } satisfies SerializedNotePayload);

const deserializeRichContent = (rawContent?: string | null) => {
  if (!rawContent) {
    return { html: "", attachments: [], isRich: false };
  }

  try {
    const parsed = JSON.parse(rawContent) as SerializedNotePayload;
    if (
      parsed &&
      parsed.version === NOTE_CONTENT_VERSION &&
      typeof parsed.html === "string" &&
      Array.isArray(parsed.attachments)
    ) {
      return {
        html: parsed.html,
        attachments: sanitizeAttachments(parsed.attachments),
        isRich: true,
      };
    }
  } catch {
    // Not a serialized rich-text payload, fallback below
  }

  if (looksLikeHtml(rawContent)) {
    return { html: rawContent, attachments: [], isRich: false };
  }

  return { html: plainTextToHtml(rawContent), attachments: [], isRich: false };
};

const normalizeNote = (note: Note): Note => {
  const { html, attachments, isRich } = deserializeRichContent(note.content);
  return {
    ...note,
    content: html,
    attachments,
    isRichContent: isRich,
    createdAt: ensureDate(note.createdAt),
    updatedAt: ensureDate(note.updatedAt),
  };
};

class NoteService {
  // Get all notes
  async getAllNotes(): Promise<Note[]> {
    const notes = await apiService.getAllNotes();
    return notes.map((note: Note) => normalizeNote(note));
  }

  // Create new note
  async createNote(noteData: NoteEditorPayload): Promise<Note> {
    const note = await apiService.createNote({
      content: serializeRichContent(noteData.content, noteData.attachments),
    });
    return normalizeNote(note);
  }

  // Update note
  async updateNote(
    id: number,
    updateData: NoteEditorPayload
  ): Promise<Note | null> {
    const note = await apiService.updateNote(id, {
      content: serializeRichContent(updateData.content, updateData.attachments),
    });
    if (!note) return null;
    return normalizeNote(note);
  }

  // Delete note (hard delete)
  async deleteNote(id: number): Promise<boolean> {
    return await apiService.deleteNote(id);
  }
}

export const noteService = new NoteService();
