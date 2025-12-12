const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const { randomUUID } = require("crypto");

const uploadsRoot = path.join(__dirname, "..", "uploads");
const notesRoot = path.join(uploadsRoot, "notes");
const tempRoot = path.join(uploadsRoot, "temp");

if (!fs.existsSync(notesRoot)) {
  fs.mkdirSync(notesRoot, { recursive: true });
}

if (!fs.existsSync(tempRoot)) {
  fs.mkdirSync(tempRoot, { recursive: true });
}

const decodeDataUrl = (dataUrl) => {
  const matches = /^data:(.+);base64,(.+)$/.exec(dataUrl || "");
  if (!matches) {
    throw new Error("Invalid attachment data URL");
  }
  return {
    mimeType: matches[1],
    buffer: Buffer.from(matches[2], "base64"),
  };
};

const ensureNoteDir = async (noteId) => {
  const dirPath = path.join(notesRoot, String(noteId));
  await fsp.mkdir(dirPath, { recursive: true });
  return dirPath;
};

const buildRelativePath = (noteId, fileName) =>
  path.join("notes", String(noteId), fileName);

const buildUrlFromRelativePath = (relativePath) =>
  `/uploads/${relativePath.replace(/\\/g, "/")}`;

const saveAttachmentFile = async (noteId, attachment) => {
  if (!attachment.dataUrl) {
    throw new Error("Missing attachment data");
  }

  const attachmentId = attachment.id || randomUUID();
  const originalName = attachment.name || "";
  const extension = path.extname(originalName);
  const safeExtension = extension.replace(/[^a-zA-Z0-9.]/g, "");
  const fileName = `${attachmentId}${safeExtension}`;

  const dirPath = await ensureNoteDir(noteId);
  const absolutePath = path.join(dirPath, fileName);
  const relativePath = buildRelativePath(noteId, fileName);

  const { buffer } = decodeDataUrl(attachment.dataUrl);
  await fsp.writeFile(absolutePath, buffer);

  return {
    id: attachmentId,
    name: attachment.name,
    type: attachment.type,
    size: attachment.size,
    url: buildUrlFromRelativePath(relativePath),
    storagePath: relativePath,
  };
};

const deleteAttachmentFile = async (storagePath) => {
  if (!storagePath) return;
  const absolutePath = path.join(uploadsRoot, storagePath);
  try {
    await fsp.unlink(absolutePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.warn(`Unable to delete attachment: ${storagePath}`, error);
    }
  }
};

const moveFromTemp = async (noteId, attachment) => {
  if (!attachment.storagePath || !attachment.isTemp) {
    return attachment;
  }

  const tempPath = path.join(uploadsRoot, attachment.storagePath);

  // Check if temp file exists
  try {
    await fsp.access(tempPath);
  } catch {
    throw new Error(`Temp file not found: ${attachment.storagePath}`);
  }

  const dirPath = await ensureNoteDir(noteId);
  const fileName = path.basename(attachment.storagePath);
  const newRelativePath = buildRelativePath(noteId, fileName);
  const newAbsolutePath = path.join(dirPath, fileName);

  // Move file from temp to notes directory
  await fsp.rename(tempPath, newAbsolutePath);

  return {
    id: attachment.id,
    name: attachment.name,
    type: attachment.type,
    size: attachment.size,
    url: buildUrlFromRelativePath(newRelativePath),
    storagePath: newRelativePath,
  };
};

const syncNoteAttachments = async (noteId, incoming = [], existing = []) => {
  const existingMap = new Map(
    existing.filter((att) => att?.id).map((att) => [att.id, att])
  );

  const nextAttachments = [];

  for (const attachment of incoming) {
    const existingAttachment = attachment.id
      ? existingMap.get(attachment.id)
      : undefined;

    // Case 1: New file uploaded via multipart (isTemp flag)
    if (attachment.isTemp && attachment.storagePath) {
      if (existingAttachment?.storagePath) {
        await deleteAttachmentFile(existingAttachment.storagePath);
      }
      const moved = await moveFromTemp(noteId, attachment);
      nextAttachments.push(moved);
    }
    // Case 2: Legacy base64 dataUrl upload
    else if (attachment.dataUrl) {
      if (existingAttachment?.storagePath) {
        await deleteAttachmentFile(existingAttachment.storagePath);
      }
      const stored = await saveAttachmentFile(noteId, attachment);
      nextAttachments.push(stored);
    }
    // Case 3: Existing attachment (no changes)
    else if (existingAttachment) {
      nextAttachments.push(existingAttachment);
    }
    // Case 4: Already finalized attachment (has storagePath in notes/)
    else if (attachment.storagePath && !attachment.isTemp) {
      nextAttachments.push(attachment);
    }
  }

  const nextIds = new Set(nextAttachments.map((att) => att.id));
  for (const attachment of existing) {
    if (!nextIds.has(attachment.id)) {
      await deleteAttachmentFile(attachment.storagePath);
    }
  }

  return nextAttachments;
};

const deleteNoteAttachments = async (attachments = []) => {
  await Promise.all(
    attachments.map((attachment) =>
      deleteAttachmentFile(attachment.storagePath)
    )
  );
};

module.exports = {
  syncNoteAttachments,
  deleteNoteAttachments,
};
