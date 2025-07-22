import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  CircularProgress,
} from "@mui/material";
import { recurringExpenseService } from "../services/recurringExpenseService";
import type { Expense } from "../models/Expense";

interface RecurringExpenseModalProps {
  open: boolean;
  onClose: () => void;
  onExpensesCreated: () => void;
}

export function RecurringExpenseModal({
  open,
  onClose,
  onExpensesCreated,
}: RecurringExpenseModalProps) {
  const [recurringExpenses, setRecurringExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (open) {
      loadRecurringExpenses();
    }
  }, [open]);

  const loadRecurringExpenses = async () => {
    try {
      setLoading(true);
      const expenses = await recurringExpenseService.getLastMonthRecurringExpenses();
      setRecurringExpenses(expenses);
    } catch (error) {
      console.error("Error loading recurring expenses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExpenses = async () => {
    try {
      setCreating(true);
      await recurringExpenseService.createRecurringExpensesForCurrentMonth();
      recurringExpenseService.markModalAsShown();
      onExpensesCreated();
      onClose();
    } catch (error) {
      console.error("Error creating recurring expenses:", error);
      alert("Erreur lors de la création des dépenses récurrentes");
    } finally {
      setCreating(false);
    }
  };

  const handleSkip = () => {
    recurringExpenseService.markModalAsShown();
    onClose();
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
    });
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString("fr-FR", {
      style: "currency",
      currency: "EUR",
    });
  };

  return (
    <Dialog open={open} onClose={handleSkip} maxWidth="sm" fullWidth>
      <DialogTitle>
        Dépenses récurrentes détectées
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" paragraph>
          Nous avons détecté {recurringExpenses.length} dépense(s) récurrente(s) du mois dernier. 
          Voulez-vous les recréer pour ce mois-ci ?
        </Typography>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
            <CircularProgress />
          </Box>
        ) : (
          <List sx={{ maxHeight: 300, overflow: "auto" }}>
            {recurringExpenses.map((expense) => (
              <ListItem key={expense.id} divider>
                <ListItemText
                  primary={expense.title}
                  secondary={`${formatDate(expense.date)} • ${expense.categoryName || "Catégorie inconnue"}`}
                />
                <ListItemSecondaryAction>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Chip
                      label={expense.type === "expense" ? "Dépense" : "Revenu"}
                      color={expense.type === "expense" ? "error" : "success"}
                      size="small"
                    />
                    <Typography variant="body2" sx={{ fontWeight: "medium" }}>
                      {formatAmount(expense.amount)}
                    </Typography>
                  </Box>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleSkip} disabled={creating}>
          Ignorer
        </Button>
        <Button
          onClick={handleCreateExpenses}
          variant="contained"
          disabled={creating || loading}
          startIcon={creating ? <CircularProgress size={16} /> : null}
        >
          {creating ? "Création..." : "Créer les dépenses"}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 