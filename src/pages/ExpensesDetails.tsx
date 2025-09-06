import { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Button,
  Stack,
  Card,
  CardContent,
  IconButton,
} from "@mui/material";
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import { useSearchParams } from "react-router-dom";
import { expenseService, categoryService } from "../services";
import { formatDate } from "../utils/dateUtils";
import type { Expense } from "../models";
import { CreateExpenseModal } from "../components/CreateExpenseModal";
import { EditExpenseModal } from "../components/EditExpenseModal";

export function ExpensesDetails() {
  const [searchParams] = useSearchParams();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<
    Array<{ id: number; name: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [contentVisible, setContentVisible] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(
    searchParams.get("category") || ""
  );
  const [typeFilter, setTypeFilter] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
  });

  // Load data
  const loadData = async () => {
    try {
      setLoading(true);

      // Parse selected month
      const [year, month] = selectedMonth.split("-").map(Number);

      // Get expenses for selected month
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      const allExpenses = await expenseService.getExpensesForDateRange(
        startDate,
        endDate
      );
      setExpenses(allExpenses);

      // Get categories
      const allCategories = await categoryService.getAllCategories({
        isActive: true,
        show: true,
      });
      setCategories(
        allCategories.map((cat) => ({ id: cat.id, name: cat.name }))
      );
    } catch (error) {
      console.error("Error loading expenses:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedMonth]);

  // Animate content when loading is complete
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        setContentVisible(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  // Filter expenses
  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch = expense.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      !categoryFilter || expense.categoryId.toString() === categoryFilter;
    const matchesType = !typeFilter || expense.type === typeFilter;

    return matchesSearch && matchesCategory && matchesType;
  });

  // Get category name by ID
  const getCategoryName = (categoryId: number) => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category?.name || "Inconnue";
  };

  // Format date - using utility function from dateUtils

  // Handle expense deletion
  const handleDeleteExpense = async (
    expenseId: number,
    expenseTitle: string
  ) => {
    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir supprimer la dépense "${expenseTitle}" ?`
    );

    if (confirmed) {
      try {
        await expenseService.deleteExpense(expenseId);
        // Refresh the expenses list
        await loadData();
      } catch (error) {
        console.error("Error deleting expense:", error);
        alert("Erreur lors de la suppression de la dépense");
      }
    }
  };

  // Handle expense editing
  const handleEditExpense = (expense: Expense) => {
    setExpenseToEdit(expense);
    setEditModalOpen(true);
  };

  // Generate available months (last 12 months)
  const generateAvailableMonths = () => {
    const months = [];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    for (let i = 0; i < 12; i++) {
      const date = new Date(currentYear, currentMonth - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const value = `${year}-${String(month).padStart(2, "0")}`;
      const label = date.toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "long",
      });
      months.push({ value, label });
    }
    return months;
  };

  const availableMonths = generateAvailableMonths();

  // Calculate totals
  const totalExpenses = filteredExpenses
    .filter((exp) => exp.type === "expense")
    .reduce((sum, exp) => sum + exp.amount, 0);

  const totalIncome = filteredExpenses
    .filter((exp) => exp.type === "income")
    .reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <Container
      maxWidth="lg"
      sx={{
        mt: 3, // Add top margin for better spacing
        mb: 8, // Add bottom margin for bottom navigation
        opacity: contentVisible ? 1 : 0,
        transform: contentVisible ? "translateY(0)" : "translateY(30px)",
        transition: "opacity 0.6s ease-out, transform 0.6s ease-out",
      }}
    >
      {/* Summary Cards */}
      <Box
        sx={{
          display: "flex",
          gap: 3,
          mb: 3,
          flexDirection: { xs: "column", md: "row" },
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Dépenses
              </Typography>
              <Typography variant="h4" color="error.main">
                {totalExpenses.toLocaleString("fr-FR", {
                  style: "currency",
                  currency: "EUR",
                })}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: 1 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Revenus
              </Typography>
              <Typography variant="h4" color="success.main">
                {totalIncome.toLocaleString("fr-FR", {
                  style: "currency",
                  currency: "EUR",
                })}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: 1 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Solde Net
              </Typography>
              <Typography
                variant="h4"
                color={
                  totalIncome - totalExpenses >= 0
                    ? "success.main"
                    : "error.main"
                }
              >
                {(totalIncome - totalExpenses).toLocaleString("fr-FR", {
                  style: "currency",
                  currency: "EUR",
                })}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography
          variant="h6"
          gutterBottom
          sx={{ display: "flex", alignItems: "center", mb: 2 }}
        >
          <FilterListIcon sx={{ mr: 1 }} />
          Filtres
        </Typography>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField
            label="Rechercher"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flex: 1 }}
            InputProps={{
              startAdornment: (
                <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />
              ),
            }}
          />
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Mois</InputLabel>
            <Select
              value={selectedMonth}
              label="Mois"
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              {availableMonths.map((month) => (
                <MenuItem key={month.value} value={month.value}>
                  {month.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Catégorie</InputLabel>
            <Select
              value={categoryFilter}
              label="Catégorie"
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <MenuItem value="">Toutes</MenuItem>
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={typeFilter}
              label="Type"
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <MenuItem value="">Tous</MenuItem>
              <MenuItem value="expense">Dépense</MenuItem>
              <MenuItem value="income">Revenu</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setModalOpen(true)}
          >
            Ajouter
          </Button>
        </Stack>
      </Paper>

      {/* Expenses Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell align="center">Actions</TableCell>
                <TableCell align="right">Montant</TableCell>
                <TableCell>Titre</TableCell>
                <TableCell align="right">Montant</TableCell>
                <TableCell>Catégorie</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Type</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography>Chargement...</Typography>
                  </TableCell>
                </TableRow>
              ) : filteredExpenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography>Aucune dépense trouvée</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredExpenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell align="center">
                      <Box
                        sx={{
                          display: "flex",
                          gap: 1,
                          justifyContent: "center",
                        }}
                      >
                        <IconButton
                          color="primary"
                          size="small"
                          onClick={() => handleEditExpense(expense)}
                          sx={{ minWidth: "auto", px: 1 }}
                        >
                          <EditIcon />
                        </IconButton>
                        <Button
                          color="error"
                          size="small"
                          onClick={() =>
                            handleDeleteExpense(expense.id, expense.title)
                          }
                          sx={{ minWidth: "auto", px: 1 }}
                        >
                          <DeleteIcon />
                        </Button>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: "medium",
                          color:
                            expense.type === "expense"
                              ? "error.main"
                              : "success.main",
                        }}
                      >
                        {expense.amount.toLocaleString("fr-FR", {
                          style: "currency",
                          currency: "EUR",
                        })}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: "medium" }}>
                        {expense.title}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getCategoryName(expense.categoryId)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{formatDate(expense.date)}</TableCell>

                    <TableCell>
                      <Chip
                        label={
                          expense.type === "expense" ? "Dépense" : "Revenu"
                        }
                        color={expense.type === "expense" ? "error" : "success"}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Create Expense Modal */}
      <CreateExpenseModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        categories={categories}
        onSuccess={() => {
          setModalOpen(false);
          loadData();
        }}
      />

      {/* Edit Expense Modal */}
      <EditExpenseModal
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setExpenseToEdit(null);
        }}
        categories={categories}
        onSuccess={() => {
          setEditModalOpen(false);
          setExpenseToEdit(null);
          loadData();
        }}
        expense={expenseToEdit}
      />
    </Container>
  );
}
