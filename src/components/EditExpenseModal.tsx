import { useState, useEffect } from "react";
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
} from "@mui/material";
import { expenseService } from "../services";
import type { Expense } from "../models";

interface EditExpenseModalProps {
  open: boolean;
  onClose: () => void;
  categories: Array<{ id: number; name: string }>;
  onSuccess: () => void;
  expense: Expense | null;
}

// Edit Expense Form Component
interface EditExpenseFormProps {
  categories: Array<{ id: number; name: string }>;
  onClose: () => void;
  onSuccess: () => void;
  expense: Expense;
}

function EditExpenseForm({
  categories,
  onClose,
  onSuccess,
  expense,
}: EditExpenseFormProps) {
  const [formData, setFormData] = useState({
    title: expense.title,
    amount: expense.amount.toString(),
    categoryId: expense.categoryId.toString(),
    type: expense.type as "expense" | "income",
    description: expense.description || "",
    date: expense.date.toISOString().split("T")[0], // Format for date input
  });

  // Update form data when expense changes
  useEffect(() => {
    setFormData({
      title: expense.title,
      amount: expense.amount.toString(),
      categoryId: expense.categoryId.toString(),
      type: expense.type,
      description: expense.description || "",
      date: expense.date.toISOString().split("T")[0],
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.amount || !formData.categoryId) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }

    try {
      await expenseService.updateExpense(expense.id, {
        title: formData.title,
        amount: parseFloat(formData.amount),
        categoryId: parseInt(formData.categoryId),
        date: new Date(formData.date),
        type: formData.type,
        description: formData.description || undefined,
      });

      onSuccess();
    } catch (error) {
      console.error("Erreur lors de la modification:", error);
      alert("Erreur lors de la modification de la dépense");
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

        <TextField
          label="Date"
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          required
          fullWidth
          InputLabelProps={{ shrink: true }}
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

        <TextField
          label="Description (optionnel)"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          fullWidth
          multiline
          rows={3}
        />

        <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
          <Button variant="outlined" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" variant="contained">
            Modifier
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}

export function EditExpenseModal({
  open,
  onClose,
  categories,
  onSuccess,
  expense,
}: EditExpenseModalProps) {
  if (!expense) return null;

  return (
    <Modal open={open} onClose={onClose} aria-labelledby="edit-expense-modal">
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
          Modifier la dépense
        </Typography>
        <EditExpenseForm
          categories={categories}
          onClose={onClose}
          onSuccess={onSuccess}
          expense={expense}
        />
      </Box>
    </Modal>
  );
}
