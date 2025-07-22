import { useState } from "react";
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  FormControlLabel,
  Switch,
} from "@mui/material";
import { expenseService } from "../services";

interface CreateExpenseModalProps {
  open: boolean;
  onClose: () => void;
  categories: Array<{ id: number; name: string }>;
  onSuccess: () => void;
}

// Create Expense Form Component
interface CreateExpenseFormProps {
  categories: Array<{ id: number; name: string }>;
  onClose: () => void;
  onSuccess: () => void;
}

function CreateExpenseForm({
  categories,
  onClose,
  onSuccess,
}: CreateExpenseFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    categoryId: "",
    type: "expense" as "expense" | "income",
    isRecurring: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.amount || !formData.categoryId) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }

    try {
      await expenseService.createExpense({
        title: formData.title,
        amount: parseFloat(formData.amount),
        categoryId: parseInt(formData.categoryId),
        date: new Date(),
        type: formData.type,
        isRecurring: formData.isRecurring,
      });

      // Reset form data
      setFormData({
        title: "",
        amount: "",
        categoryId: "",
        type: "expense",
        isRecurring: false,
      });

      onSuccess();
    } catch (error) {
      console.error("Erreur lors de la création:", error);
      alert("Erreur lors de la création de la dépense");
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Stack spacing={3}>
        <TextField
          label="Titre"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
          fullWidth
        />

        <TextField
          label="Montant (€)"
          type="number"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          required
          fullWidth
          inputProps={{ step: "0.01", min: "0" }}
        />

        <FormControl fullWidth required>
          <InputLabel>Type</InputLabel>
          <Select
            value={formData.type}
            label="Type"
            onChange={(e) =>
              setFormData({
                ...formData,
                type: e.target.value as "expense" | "income",
              })
            }
          >
            <MenuItem value="expense">Dépense</MenuItem>
            <MenuItem value="income">Revenu</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth required>
          <InputLabel>Catégorie</InputLabel>
          <Select
            value={formData.categoryId}
            label="Catégorie"
            onChange={(e) =>
              setFormData({ ...formData, categoryId: e.target.value })
            }
          >
            {categories.map((category) => (
              <MenuItem key={category.id} value={category.id}>
                {category.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControlLabel
          control={
            <Switch
              checked={formData.isRecurring}
              onChange={(e) =>
                setFormData({ ...formData, isRecurring: e.target.checked })
              }
            />
          }
          label="Dépense récurrente"
        />

        <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
          <Button variant="outlined" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" variant="contained">
            Créer
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}

export function CreateExpenseModal({
  open,
  onClose,
  categories,
  onSuccess,
}: CreateExpenseModalProps) {
  return (
    <Modal open={open} onClose={onClose} aria-labelledby="create-expense-modal">
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 400,
          bgcolor: "background.paper",
          borderRadius: 2,
          boxShadow: 24,
          p: 4,
        }}
      >
        <Typography variant="h6" component="h2" gutterBottom>
          Ajouter une dépense
        </Typography>
        <CreateExpenseForm
          categories={categories}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      </Box>
    </Modal>
  );
}
