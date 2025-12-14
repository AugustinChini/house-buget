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
  CircularProgress,
} from "@mui/material";
import { apiService } from "../services/apiService";

interface PinCodeModalProps {
  open: boolean;
  onSuccess: () => void;
}

export function PinCodeModal({ open, onSuccess }: PinCodeModalProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 4);
    setPin(value);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4) {
      setError("Veuillez entrer 4 chiffres");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await apiService.login(pin);
      setPin("");
      onSuccess();
    } catch (err) {
      if (err instanceof Error) {
        if (
          err.message.includes("Invalid PIN") ||
          err.message.includes("Unauthorized")
        ) {
          setError("Code incorrect");
        } else if (err.message.includes("Server configuration")) {
          setError("Erreur de configuration serveur");
        } else {
          setError("Erreur de connexion au serveur");
        }
      } else {
        setError("Erreur inconnue");
      }
    } finally {
      setLoading(false);
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
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              minWidth: 250,
            }}
          >
            <TextField
              label="Code à 4 chiffres"
              value={pin}
              onChange={handleChange}
              inputProps={{
                maxLength: 4,
                inputMode: "numeric",
                pattern: "\\d*",
                autoFocus: true,
              }}
              type="password"
              fullWidth
              autoFocus
              disabled={loading}
            />
            {error && <Typography color="error">{error}</Typography>}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={pin.length !== 4 || loading}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Valider"
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
