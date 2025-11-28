const express = require("express");
const { runQuery, getQuery, allQuery } = require("../database");

const router = express.Router();

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

// PUT /api/expenses/:id - Update expense
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    // Check if expense exists
    const existingNote = await getQuery("SELECT * FROM notes WHERE id = ?", [
      id,
    ]);
    if (!existingNote) {
      return res.status(404).json({ error: "Note not found" });
    }

    // Build update query dynamically
    const updates = [];
    const params = [];

    if (content !== undefined) {
      updates.push("content = ?");
      params.push(content);
    }

    updates.push("updatedAt = CURRENT_TIMESTAMP");
    params.push(id);

    const sql = `UPDATE notes SET ${updates.join(", ")} WHERE id = ?`;
    await runQuery(sql, params);

    // Get the updated note
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

    const sql = `
      INSERT INTO notes (content, createdAt, updatedAt)
      VALUES (?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
    `;

    const result = await runQuery(sql, [content]);

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

    await runQuery("DELETE FROM notes WHERE id = ?", [id]);

    res.json({ message: "Note deleted successfully" });
  } catch (error) {
    console.error("Error deleting note:", error);
    res.status(500).json({ error: "Failed to delete note" });
  }
});

module.exports = router;
