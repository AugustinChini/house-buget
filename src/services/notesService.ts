import { apiService } from "./apiService";
import { ensureDate } from "../utils/dateUtils";
import type { Note } from "../models/Note";

class NoteService {
  // Get all notes
  async getAllNotes(): Promise<Note[]> {
    const notes = await apiService.getAllNotes();
    return notes.map((note: Note) => ({
      ...note,
      createdAt: ensureDate(note.createdAt),
      updatedAt: ensureDate(note.updatedAt),
    }));
  }

  // Create new note
  async createNote(noteData: string): Promise<Note> {
    const note = await apiService.createNote({ content: noteData });
    return {
      ...note,
      createdAt: ensureDate(note.createdAt),
      updatedAt: ensureDate(note.updatedAt),
    };
  }

  // Update note
  async updateNote(id: number, updateData: string): Promise<Note | null> {
    const note = await apiService.updateNote(id, { content: updateData });
    if (!note) return null;

    return {
      ...note,
      createdAt: ensureDate(note.createdAt),
      updatedAt: ensureDate(note.updatedAt),
    };
  }

  // Delete note (hard delete)
  async deleteNote(id: number): Promise<boolean> {
    return await apiService.deleteNote(id);
  }
}

export const noteService = new NoteService();
