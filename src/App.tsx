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
import { PinCodeModal } from "./components/PinCodeModal";

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

const PIN_CODE = "1234"; // À modifier pour personnaliser le code
const PIN_TOKEN_KEY = "budget_app_pin_token";
const PIN_TOKEN_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 1 mois

function isPinTokenValid() {
  const token = localStorage.getItem(PIN_TOKEN_KEY);
  if (!token) return false;
  try {
    const { expiresAt } = JSON.parse(token);
    return Date.now() < expiresAt;
  } catch {
    return false;
  }
}

function setPinToken() {
  const expiresAt = Date.now() + PIN_TOKEN_DURATION_MS;
  localStorage.setItem(PIN_TOKEN_KEY, JSON.stringify({ expiresAt }));
}

function AppContent() {
  const [modalOpen, setModalOpen] = useState(false);
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);
  const [recurringModalOpen, setRecurringModalOpen] = useState(false);
  const [pinModalOpen, setPinModalOpen] = useState(!isPinTokenValid());

  // Load categories for the modal
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const { categoryService } = await import("./services");
        const allCategories = await categoryService.getAllCategories({
          isActive: true,
          show: true,
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

  const handlePinSuccess = () => {
    setPinToken();
    setPinModalOpen(false);
  };

  return (
    <>
      <PinCodeModal open={pinModalOpen} onSuccess={handlePinSuccess} correctPin={PIN_CODE} />
      {/* Le reste de l'app est désactivé tant que le code n'est pas validé */}
      <div style={{ filter: pinModalOpen ? 'blur(4px)' : 'none', pointerEvents: pinModalOpen ? 'none' : 'auto' }}>
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
            bottom: 80,
            right: 16,
            zIndex: 9999,
            transform: "translateZ(0)",
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
      </div>
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
