import {
  Box,
  Container,
  Paper,
  TextField,
  Typography,
  Button,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
} from "@mui/material";
import { Delete as DeleteIcon } from "@mui/icons-material";
import { useEffect, useState } from "react";
import type { Note } from "../models/Note";
import { noteService } from "../services/notesService";

export function Notes() {
  const [id, setId] = useState<number | null>(null);
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);

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
    setValue(() => {
      if (id === null) return "";
      const selectedNote = filteredNotes.find((n) => n.id === id);
      return selectedNote?.content || "";
    });
  }, [id, filteredNotes]);

  const onSave = async () => {
    if (id === null) {
      await noteService.createNote(value);
    } else {
      await noteService.updateNote(id, value);
    }
    const newNotes = await noteService.getAllNotes();
    setFilteredNotes(newNotes);
  };

  const handleDeleteNote = async (id: number) => {
    await noteService.deleteNote(id);
    const newList = await noteService.getAllNotes();
    setFilteredNotes(newList);
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
            <Typography variant="h6">Créer une nouvelle note</Typography>
            <TextField
              multiline
              value={value}
              onChange={(v) => setValue(v?.target?.value || "")}
              sx={{
                width: "100%",
              }}
            ></TextField>
            <Box
              sx={{
                display: "flex",
                gap: 2,
                justifyContent: "flex-end",
                marginTop: 2,
              }}
            >
              <Button variant="outlined" onClick={() => setId(null)}>
                Annuler
              </Button>
              <Button onClick={onSave} variant="contained">
                Enregistrer
              </Button>
            </Box>
          </Paper>

          {/* Note Table */}
          <Paper>
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
                        <TableCell onClick={() => setId(note.id)}>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: "medium" }}
                          >
                            {note.content.length > 20
                              ? `${note.content.substring(0, 20)}...`
                              : note.content}
                          </Typography>
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
