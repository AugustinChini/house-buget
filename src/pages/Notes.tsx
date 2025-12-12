import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Stack,
  List,
  ListItem,
  ListItemText,
  LinearProgress,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  AttachFile as AttachFileIcon,
  Download as DownloadIcon,
} from "@mui/icons-material";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import type { Note, NoteAttachment } from "../models/Note";
import { noteService } from "../services/notesService";
import { uploadFile } from "../services/uploadService";
import { RichTextEditor } from "../components/RichTextEditor";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const extractPlainText = (html: string) =>
  html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const getNotePreview = (html: string, maxLength = 80) => {
  const text = extractPlainText(html);
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}…`;
};

const formatBytes = (size: number | undefined) => {
  if (!size) return "0 o";
  const units = ["o", "Ko", "Mo", "Go"];
  const index = Math.floor(Math.log(size) / Math.log(1024));
  const value = size / Math.pow(1024, index);
  const decimals = index === 0 ? 0 : 1;
  return `${value.toFixed(decimals)} ${units[index]}`;
};

const getAttachmentDownloadHref = (attachment: NoteAttachment) => {
  if (attachment.dataUrl) return attachment.dataUrl;
  if (attachment.url) {
    if (attachment.url.startsWith("http")) return attachment.url;
    return `${API_BASE_URL}${attachment.url}`;
  }
  return undefined;
};

export function Notes() {
  const [id, setId] = useState<number | null>(null);
  const [value, setValue] = useState("");
  const [attachments, setAttachments] = useState<NoteAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const selectedNote = useMemo(
    () => (id === null ? null : filteredNotes.find((n) => n.id === id) || null),
    [id, filteredNotes]
  );

  useEffect(() => {
    setLoading(true);
    noteService
      .getAllNotes()
      .then((notes) => {
        setFilteredNotes(notes);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedNote) {
      setValue("");
      setAttachments([]);
      return;
    }
    setValue(selectedNote.content || "");
    setAttachments(selectedNote.attachments || []);
  }, [selectedNote]);

  const resetEditor = () => {
    setId(null);
    setValue("");
    setAttachments([]);
  };

  const handleFilesSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    // Reset input immediately to allow selecting same files again
    event.target.value = "";

    const fileArray = Array.from(files);

    // Create placeholder attachments with upload progress
    const placeholders: NoteAttachment[] = fileArray.map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      type: file.type,
      isUploading: true,
      uploadProgress: 0,
    }));

    setAttachments((prev) => [...prev, ...placeholders]);

    // Upload files one by one
    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      const placeholderId = placeholders[i].id;

      try {
        const result = await uploadFile(file, {
          onProgress: (progress) => {
            setAttachments((prev) =>
              prev.map((att) =>
                att.id === placeholderId
                  ? { ...att, uploadProgress: progress.percent }
                  : att
              )
            );
          },
        });

        // Replace placeholder with uploaded attachment
        setAttachments((prev) =>
          prev.map((att) =>
            att.id === placeholderId
              ? {
                  id: result.id,
                  name: result.name,
                  size: result.size,
                  type: result.type,
                  url: result.url,
                  storagePath: result.storagePath,
                  isTemp: result.isTemp,
                  isUploading: false,
                  uploadProgress: 100,
                }
              : att
          )
        );
      } catch (error) {
        console.error(`Erreur lors de l'upload de ${file.name}:`, error);
        // Remove failed placeholder
        setAttachments((prev) =>
          prev.filter((att) => att.id !== placeholderId)
        );
      }
    }
  };

  const handleRemoveAttachment = (attachmentId: string) => {
    setAttachments((prev) =>
      prev.filter((attachment) => attachment.id !== attachmentId)
    );
  };

  const onSave = async () => {
    setIsSaving(true);
    try {
      const payload = { content: value, attachments };
      const savedNote =
        id === null
          ? await noteService.createNote(payload)
          : await noteService.updateNote(id, payload);

      const newNotes = await noteService.getAllNotes();
      setFilteredNotes(newNotes);

      if (savedNote) {
        setId(savedNote.id);
        setValue(savedNote.content || "");
        setAttachments(savedNote.attachments || []);
      } else {
        resetEditor();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteNote = async (id: number) => {
    await noteService.deleteNote(id);
    const newList = await noteService.getAllNotes();
    setFilteredNotes(newList);
    if (id === selectedNote?.id) {
      resetEditor();
    }
  };

  const handleSelectNote = (noteId: number) => {
    setId(noteId);
  };

  const handleAttachmentButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      {/* Main Content */}
      <Container
        maxWidth="lg"
        sx={{
          mt: 3, // Add top margin for better spacing
          mb: 8, // Add bottom margin for bottom navigation
          transition: "opacity 0.6s ease-out, transform 0.6s ease-out",
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Paper sx={{ p: 3, textAlign: "center" }}>
            <Box sx={{ mt: 2, textAlign: "left" }}>
              <RichTextEditor
                value={value}
                onChange={setValue}
                placeholder="Commencez à écrire votre note..."
                minHeight={220}
              />
            </Box>

            <Box
              sx={{
                mt: 3,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
                p: 2,
                textAlign: "left",
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                spacing={2}
              >
                <Typography variant="subtitle1">Pièces jointes</Typography>
                <IconButton size="large" onClick={handleAttachmentButtonClick}>
                  <AttachFileIcon />
                </IconButton>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  hidden
                  onChange={handleFilesSelected}
                />
              </Stack>

              {attachments.length === 0 ? (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1 }}
                >
                  Aucune pièce jointe
                </Typography>
              ) : (
                <List dense sx={{ mt: 1 }}>
                  {attachments.map((attachment) => (
                    <ListItem
                      key={attachment.id}
                      disablePadding
                      sx={{
                        py: 0.5,
                        pl: 0,
                        flexDirection: "column",
                        alignItems: "stretch",
                      }}
                      secondaryAction={
                        !attachment.isUploading && (
                          <Stack direction="row" spacing={1}>
                            {(() => {
                              const downloadHref =
                                getAttachmentDownloadHref(attachment);
                              return downloadHref ? (
                                <IconButton
                                  component="a"
                                  href={downloadHref}
                                  download={attachment.name}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  size="small"
                                >
                                  <DownloadIcon fontSize="small" />
                                </IconButton>
                              ) : (
                                <IconButton size="small" disabled>
                                  <DownloadIcon fontSize="small" />
                                </IconButton>
                              );
                            })()}
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() =>
                                handleRemoveAttachment(attachment.id)
                              }
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Stack>
                        )
                      }
                    >
                      <ListItemText
                        primaryTypographyProps={{ variant: "body2" }}
                        secondaryTypographyProps={{ variant: "caption" }}
                        primary={attachment.name}
                        secondary={
                          attachment.isUploading
                            ? `Téléchargement... ${
                                attachment.uploadProgress || 0
                              }%`
                            : `${attachment.type || "Fichier"} · ${formatBytes(
                                attachment.size
                              )}`
                        }
                      />
                      {attachment.isUploading && (
                        <LinearProgress
                          variant="determinate"
                          value={attachment.uploadProgress || 0}
                          sx={{ mt: 0.5, mr: 2 }}
                        />
                      )}
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>

            <Box
              sx={{
                display: "flex",
                gap: 2,
                justifyContent: "flex-end",
                marginTop: 2,
              }}
            >
              <Button
                variant="outlined"
                onClick={resetEditor}
                disabled={isSaving}
              >
                Annuler
              </Button>
              <Button
                onClick={onSave}
                variant="contained"
                disabled={
                  isSaving || attachments.some((att) => att.isUploading)
                }
              >
                Enregistrer
              </Button>
            </Box>
          </Paper>

          {/* Note Table */}
          <Paper sx={{ mt: 1 }}>
            <TableContainer>
              <Table id={`${id || "none"}`}>
                <TableHead>
                  <TableRow>
                    <TableCell>Contenu</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography>Chargement...</Typography>
                      </TableCell>
                    </TableRow>
                  ) : filteredNotes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography>Aucune note trouvée</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredNotes.map((note) => (
                      <TableRow key={note.id}>
                        <TableCell onClick={() => handleSelectNote(note.id)}>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: "medium" }}
                          >
                            {getNotePreview(note.content)}
                          </Typography>
                          {note.attachments && note.attachments.length > 0 && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: "block" }}
                            >
                              {note.attachments.length} pièce
                              {note.attachments.length > 1 ? "s" : ""} jointe
                              {note.attachments.length > 1 ? "s" : ""}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Box
                            sx={{
                              display: "flex",
                              gap: 1,
                              justifyContent: "center",
                            }}
                          >
                            <IconButton
                              color="error"
                              size="small"
                              onClick={() => handleDeleteNote(note.id)}
                              sx={{ minWidth: "auto", px: 1 }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      </Container>
    </>
  );
}
