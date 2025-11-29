const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const { randomUUID } = require("crypto");

const uploadsRoot = path.join(__dirname, "..", "uploads");
const notesRoot = path.join(uploadsRoot, "notes");

if (!fs.existsSync(notesRoot)) {
  fs.mkdirSync(notesRoot, { recursive: true });
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

const syncNoteAttachments = async (noteId, incoming = [], existing = []) => {
  const existingMap = new Map(
    existing.filter((att) => att?.id).map((att) => [att.id, att])
  );

  const nextAttachments = [];

  for (const attachment of incoming) {
    const existingAttachment = attachment.id
      ? existingMap.get(attachment.id)
      : undefined;

    if (attachment.dataUrl) {
      if (existingAttachment?.storagePath) {
        await deleteAttachmentFile(existingAttachment.storagePath);
      }
      const stored = await saveAttachmentFile(noteId, attachment);
      nextAttachments.push(stored);
    } else if (existingAttachment) {
      nextAttachments.push(existingAttachment);
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
