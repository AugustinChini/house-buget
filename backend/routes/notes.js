const express = require("express");
const { runQuery, getQuery, allQuery } = require("../database");
const {
  syncNoteAttachments,
  deleteNoteAttachments,
} = require("../utils/attachmentStorage");

const router = express.Router();
const NOTE_CONTENT_VERSION = 2;

const parseContent = (rawContent) => {
  if (!rawContent) {
    return { version: NOTE_CONTENT_VERSION, html: "", attachments: [] };
  }

  try {
    const parsed = JSON.parse(rawContent);
    return {
      version:
        typeof parsed.version === "number"
          ? parsed.version
          : NOTE_CONTENT_VERSION,
      html: typeof parsed.html === "string" ? parsed.html : "",
      attachments: Array.isArray(parsed.attachments) ? parsed.attachments : [],
    };
  } catch {
    return { version: NOTE_CONTENT_VERSION, html: rawContent, attachments: [] };
  }
};

const serializeContent = (content) =>
  JSON.stringify({
    version: content.version || NOTE_CONTENT_VERSION,
    html: content.html || "",
    attachments: content.attachments || [],
  });

// GET /api/notes - Get all notes
router.get("/", async (req, res) => {
  try {
    let sql = `
      SELECT 
        id, content, createdAt, updatedAt
      FROM notes
    `;

    const notes = await allQuery(sql, []);

    res.json(notes);
  } catch (error) {
    console.error("Error getting notes:", error);
    res.status(500).json({ error: "Failed to get notes" });
  }
});

// PUT /api/notes/:id - Update note
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    // Check if note exists
    const existingNote = await getQuery("SELECT * FROM notes WHERE id = ?", [
      id,
    ]);
    if (!existingNote) {
      return res.status(404).json({ error: "Note not found" });
    }

    const existingContent = parseContent(existingNote.content);
    const nextContent = parseContent(content ?? existingNote.content);
    const syncedAttachments = await syncNoteAttachments(
      id,
      nextContent.attachments || [],
      existingContent.attachments || []
    );
    nextContent.attachments = syncedAttachments;

    const sql = `UPDATE notes SET content = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`;
    await runQuery(sql, [serializeContent(nextContent), id]);

    const updatedNote = await getQuery(
      `SELECT 
        *
       FROM notes e
       WHERE e.id = ?`,
      [id]
    );

    const formattedNote = {
      ...updatedNote,
      createdAt: new Date(updatedNote.createdAt),
      updatedAt: new Date(updatedNote.updatedAt),
    };

    res.json(formattedNote);
  } catch (error) {
    console.error("Error updating expense:", error);
    res.status(500).json({ error: "Failed to update expense" });
  }
});

// POST /api/notes - Create new note
router.post("/", async (req, res) => {
  try {
    const { content } = req.body;
    const parsedContent = parseContent(content);

    const sql = `
      INSERT INTO notes (content, createdAt, updatedAt)
      VALUES (?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
    `;

    const initialContent = serializeContent({
      ...parsedContent,
      attachments: [],
    });

    const result = await runQuery(sql, [initialContent]);
    const syncedAttachments = await syncNoteAttachments(
      result.id,
      parsedContent.attachments || [],
      []
    );

    if (syncedAttachments.length > 0) {
      const updatedContent = serializeContent({
        ...parsedContent,
        attachments: syncedAttachments,
      });
      await runQuery(
        "UPDATE notes SET content = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?",
        [updatedContent, result.id]
      );
    }

    // Get the created note
    const newNote = await getQuery("SELECT * FROM notes WHERE id = ?", [
      result.id,
    ]);

    const formattedNote = {
      ...newNote,
      createdAt: new Date(newNote.createdAt),
      updatedAt: new Date(newNote.updatedAt),
    };

    res.status(201).json(formattedNote);
  } catch (error) {
    console.error("Error creating note:", error);
    res.status(500).json({ error: "Failed to create note" });
  }
});

// DELETE /api/notes/:id - Delete note
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Check if note exists
    const existingNote = await getQuery("SELECT * FROM notes WHERE id = ?", [
      id,
    ]);
    if (!existingNote) {
      return res.status(404).json({ error: "Note not found" });
    }

    const content = parseContent(existingNote.content);
    await deleteNoteAttachments(content.attachments || []);

    await runQuery("DELETE FROM notes WHERE id = ?", [id]);

    res.json({ message: "Note deleted successfully" });
  } catch (error) {
    console.error("Error deleting note:", error);
    res.status(500).json({ error: "Failed to delete note" });
  }
});

module.exports = router;
