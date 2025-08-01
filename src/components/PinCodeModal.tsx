import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
} from "@mui/material";

interface PinCodeModalProps {
  open: boolean;
  onSuccess: () => void;
  correctPin: string;
}

export function PinCodeModal({ open, onSuccess, correctPin }: PinCodeModalProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 4);
    setPin(value);
    setError("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4) {
      setError("Veuillez entrer 4 chiffres");
      return;
    }
    if (pin === correctPin) {
      setError("");
      onSuccess();
      setPin("");
    } else {
      setError("Code incorrect");
    }
  };

  // Empêche la fermeture par clic extérieur ou touche Echap
  const handleDialogClose = (_event: object, reason: string) => {
    if (reason === "backdropClick" || reason === "escapeKeyDown") {
      return;
    }
  };

  return (
    <Dialog open={open} onClose={handleDialogClose}>
      <DialogTitle>Entrez le code d'accès</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 250 }}>
            <TextField
              label="Code à 4 chiffres"
              value={pin}
              onChange={handleChange}
              inputProps={{ maxLength: 4, inputMode: "numeric", pattern: "\\d*", autoFocus: true }}
              type="password"
              fullWidth
              autoFocus
            />
            {error && <Typography color="error">{error}</Typography>}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button type="submit" variant="contained" fullWidth disabled={pin.length !== 4}>
            Valider
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
} 