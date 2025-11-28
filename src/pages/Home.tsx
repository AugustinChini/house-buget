import { useState, useEffect } from "react";
import {
  Typography,
  Container,
  Box,
  Card,
  CardContent,
  Paper,
  IconButton,
  LinearProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { categoryService, expenseService } from "../services";
import type { CategoryWithSpending } from "../models";
import { CreateExpenseModal } from "../components/CreateExpenseModal";

export function Home() {
  const navigate = useNavigate();
  const [totalBalance, setTotalBalance] = useState(0);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const [categoriesWithSpending, setCategoriesWithSpending] = useState<
    CategoryWithSpending[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [contentVisible, setContentVisible] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(
    undefined
  );

  // Load data function
  const loadData = async () => {
    try {
      setLoading(true);
      // Parse selected month
      const [year, month] = selectedMonth.split("-").map(Number);

      // Get monthly summary for selected month
      const monthlySummary = await expenseService.getMonthlyExpenseSummary(
        year,
        month
      );

      // Get categories with spending for selected month
      const categories = await categoryService.getCategoriesWithSpending(
        monthlySummary.expenses
      );

      // Update state
      setMonthlyIncome(monthlySummary.totalIncome);
      setMonthlyExpenses(monthlySummary.totalExpenses);
      setTotalBalance(monthlySummary.netAmount);
      setCategoriesWithSpending(categories);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount and when selected month changes
  useEffect(() => {
    loadData();
  }, [selectedMonth]);

  // Listen for expense added event to refresh data
  useEffect(() => {
    const handleExpenseAdded = () => {
      loadData();
    };

    window.addEventListener("expenseAdded", handleExpenseAdded);
    return () => {
      window.removeEventListener("expenseAdded", handleExpenseAdded);
    };
  }, []);

  // Animate content when loading is complete
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        setContentVisible(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  const getProgressColor = (spent: number, budget: number) => {
    const percentage = (spent / budget) * 100;
    if (percentage > 100) return "#f44336"; // Red for over budget
    if (percentage > 80) return "#ff9800"; // Orange for close to budget
    return "#4caf50"; // Green for under budget
  };

  const getStatusText = (spent: number, budget: number) => {
    const difference = budget - spent;
    if (difference < 0) {
      return {
        text: "Dépassé",
        amount: Math.abs(difference),
        color: "#f44336",
      };
    } else {
      return { text: "Économisé", amount: difference, color: "#4caf50" };
    }
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

  return (
    <>
      {/* Main Content */}
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
        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "400px",
            }}
          >
            <Typography variant="h6" color="text.secondary">
              Chargement des données...
            </Typography>
          </Box>
        ) : (
          <>
            {/* Balance Overview */}
            <Card
              sx={{
                mb: 3,
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
              }}
            >
              <CardContent>
                <Typography variant="h4" gutterBottom align="center">
                  Solde Total
                </Typography>
                <Typography
                  variant="h3"
                  align="center"
                  sx={{ fontWeight: "bold" }}
                >
                  {totalBalance.toLocaleString("fr-FR", {
                    style: "currency",
                    currency: "EUR",
                  })}
                </Typography>
              </CardContent>
            </Card>

            {/* Income and Expenses */}
            <Box
              sx={{
                display: "flex",
                gap: 3,
                mb: 3,
                flexDirection: { xs: "column", md: "row" },
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Paper sx={{ p: 3, textAlign: "center" }}>
                  <TrendingUpIcon
                    color="success"
                    sx={{ fontSize: 40, mb: 1 }}
                  />
                  <Typography variant="h6" color="success.main" gutterBottom>
                    Revenus du mois
                  </Typography>
                  <Typography
                    variant="h4"
                    color="success.main"
                    sx={{ fontWeight: "bold" }}
                  >
                    {monthlyIncome.toLocaleString("fr-FR", {
                      style: "currency",
                      currency: "EUR",
                    })}
                  </Typography>
                </Paper>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Paper sx={{ p: 3, textAlign: "center" }}>
                  <TrendingDownIcon
                    color="error"
                    sx={{ fontSize: 40, mb: 1 }}
                  />
                  <Typography variant="h6" color="error.main" gutterBottom>
                    Dépenses du mois
                  </Typography>
                  <Typography
                    variant="h4"
                    color="error.main"
                    sx={{ fontWeight: "bold" }}
                  >
                    {monthlyExpenses.toLocaleString("fr-FR", {
                      style: "currency",
                      currency: "EUR",
                    })}
                  </Typography>
                </Paper>
              </Box>
            </Box>

            {/* Budget Categories */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 3,
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Dépenses par catégorie
                </Typography>
                <FormControl sx={{ minWidth: 150 }}>
                  <InputLabel>Mois</InputLabel>
                  <Select
                    value={selectedMonth}
                    label="Mois"
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    size="small"
                  >
                    {availableMonths.map((month) => (
                      <MenuItem key={month.value} value={month.value}>
                        {month.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {categoriesWithSpending.map((category) => {
                  const progressColor = getProgressColor(
                    category.spent,
                    category.budget
                  );
                  const status = getStatusText(category.spent, category.budget);
                  const progressValue = Math.min(
                    (category.spent / category.budget) * 100,
                    100
                  );

                  return (
                    <Card
                      key={category.id}
                      sx={{
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        borderRadius: 2,
                        position: "relative",
                      }}
                    >
                      <CardContent sx={{ p: 2.5 }}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            mb: 1,
                          }}
                        >
                          <Typography
                            variant="h6"
                            sx={{ fontWeight: "bold", color: "#333" }}
                          >
                            {category.name}
                          </Typography>
                          <IconButton
                            size="small"
                            sx={{ p: 0.5 }}
                            onClick={() => {
                              setSelectedCategoryId(category.id);
                              setModalOpen(true);
                            }}
                          >
                            <AddIcon fontSize="small" />
                          </IconButton>
                        </Box>

                        <Typography
                          variant="h5"
                          align="center"
                          sx={{
                            fontWeight: "bold",
                            color: "#333",
                            mb: 2,
                          }}
                        >
                          {category.budget.toLocaleString("fr-FR", {
                            style: "currency",
                            currency: "EUR",
                          })}
                        </Typography>

                        <LinearProgress
                          variant="determinate"
                          value={progressValue}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: "#e0e0e0",
                            "& .MuiLinearProgress-bar": {
                              backgroundColor: progressColor,
                              borderRadius: 4,
                            },
                          }}
                        />

                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            mt: 2,
                          }}
                        >
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Dépensé
                            </Typography>
                            <Typography
                              variant="body1"
                              sx={{ fontWeight: "medium", color: "#333" }}
                            >
                              {category.spent.toLocaleString("fr-FR", {
                                style: "currency",
                                currency: "EUR",
                              })}
                            </Typography>
                          </Box>
                          <Box sx={{ textAlign: "right" }}>
                            <Typography variant="body2" color="text.secondary">
                              {status.text}
                            </Typography>
                            <Typography
                              variant="body1"
                              sx={{
                                fontWeight: "medium",
                                color: status.color,
                              }}
                            >
                              {status.amount.toLocaleString("fr-FR", {
                                style: "currency",
                                currency: "EUR",
                              })}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>
            </Paper>
          </>
        )}
        {/* Create Expense Modal */}
        <CreateExpenseModal
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedCategoryId(undefined);
          }}
          categories={categoriesWithSpending}
          initialCategoryId={selectedCategoryId}
          onSuccess={() => {
            setModalOpen(false);
            setSelectedCategoryId(undefined);
            loadData();
            // Trigger global refresh event if needed
            window.dispatchEvent(new CustomEvent("expenseAdded"));
          }}
        />
      </Container>
    </>
  );
}
