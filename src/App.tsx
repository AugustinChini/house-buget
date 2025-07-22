import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider, createTheme, CssBaseline, Fab } from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import { useEffect, useState } from "react";
import { Home } from "./pages/Home";
import { ExpensesDetails } from "./pages/ExpensesDetails";
import { Settings } from "./pages/Settings";
import { dataInitializationService, recurringExpenseService } from "./services";
import { TransitionWrapper } from "./components/TransitionWrapper";
import { BottomNavigationBar } from "./components/BottomNavigation";
import { CreateExpenseModal } from "./components/CreateExpenseModal";
import { RecurringExpenseModal } from "./components/RecurringExpenseModal";

const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
    background: {
      default: "#f5f5f5",
    },
  },
});

function AppContent() {
  const [modalOpen, setModalOpen] = useState(false);
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);
  const [recurringModalOpen, setRecurringModalOpen] = useState(false);

  // Load categories for the modal
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const { categoryService } = await import("./services");
        const allCategories = await categoryService.getAllCategories({
          isActive: true,
        });
        setCategories(
          allCategories.map((cat) => ({ id: cat.id, name: cat.name }))
        );
      } catch (error) {
        console.error("Error loading categories:", error);
      }
    };
    loadCategories();
  }, []);

  // Check for recurring expenses on app start
  useEffect(() => {
    const checkRecurringExpenses = async () => {
      try {
        const shouldShow = await recurringExpenseService.shouldShowRecurringModal();
        if (shouldShow) {
          setRecurringModalOpen(true);
        }
      } catch (error) {
        console.error("Error checking recurring expenses:", error);
      }
    };
    
    // Wait a bit for the app to initialize before checking
    const timer = setTimeout(checkRecurringExpenses, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleModalSuccess = () => {
    setModalOpen(false);
    // Trigger a page refresh by dispatching a custom event
    window.dispatchEvent(new CustomEvent('expenseAdded'));
  };

  const handleRecurringExpensesCreated = () => {
    // Trigger a page refresh by dispatching a custom event
    window.dispatchEvent(new CustomEvent('expenseAdded'));
  };

  return (
    <>
      <TransitionWrapper>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/expenses" element={<ExpensesDetails />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </TransitionWrapper>
      
      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: "fixed",
          bottom: 80, // Account for bottom navigation (56px) + margin (24px)
          right: 16,
          zIndex: 9999, // Higher z-index to ensure it stays on top
          transform: "translateZ(0)", // Force hardware acceleration
        }}
        onClick={() => setModalOpen(true)}
      >
        <AddIcon />
      </Fab>

      {/* Create Expense Modal */}
      <CreateExpenseModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        categories={categories}
        onSuccess={handleModalSuccess}
      />

      {/* Recurring Expense Modal */}
      <RecurringExpenseModal
        open={recurringModalOpen}
        onClose={() => setRecurringModalOpen(false)}
        onExpensesCreated={handleRecurringExpensesCreated}
      />
      
      <BottomNavigationBar />
    </>
  );
}

function App() {
  useEffect(() => {
    // Initialize the database with sample data on app startup
    dataInitializationService.initializeData();
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AppContent />
      </Router>
    </ThemeProvider>
  );
}

export default App;
