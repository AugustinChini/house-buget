import {
  Typography,
  Container,
  Card,
  CardContent,
  Box,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  IconButton,
} from "@mui/material";
import {
  Add as AddIcon,
  Visibility,
  VisibilityOff,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { useState, useEffect, useCallback } from "react";
import { categoryService, dataService } from "../services";
import type { Category } from "../models";

const MONTHLY_INCOME_STORAGE_KEY = "monthlyIncome";

export function Settings() {
  const [contentVisible, setContentVisible] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryBudget, setNewCategoryBudget] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{
    id: number;
    name: string;
    budget: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showHiddenCategories, setShowHiddenCategories] = useState(false);
  const [monthlyIncome, setMonthlyIncome] = useState("");

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      const allCategories = await categoryService.getAllCategories({
        isActive: true,
        show: showHiddenCategories ? undefined : true,
      });
      setCategories(allCategories);
    } catch (error) {
      console.error("Error loading categories:", error);
    } finally {
      setLoading(false);
    }
  }, [showHiddenCategories]);

  // Load categories on component mount
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Animate content when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setContentVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const storedIncome = localStorage.getItem(MONTHLY_INCOME_STORAGE_KEY);
    if (storedIncome) {
      setMonthlyIncome(storedIncome);
    }
  }, []);

  const handleMonthlyIncomeChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value;
    setMonthlyIncome(value);
    localStorage.setItem(MONTHLY_INCOME_STORAGE_KEY, value);
  };

  const formatCurrency = (value: number) =>
    value.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

  const totalCategoryBudget = categories.reduce(
    (sum, category) => sum + (category.budget ?? 0),
    0
  );
  const monthlyIncomeValue = parseFloat(monthlyIncome) || 0;
  const remainingBudget = monthlyIncomeValue - totalCategoryBudget;
  const remainingColor = remainingBudget >= 0 ? "success.main" : "error.main";

  const handleAddCategory = async () => {
    if (!newCategoryName.trim() || !newCategoryBudget.trim()) return;

    try {
      const budget = parseFloat(newCategoryBudget);
      if (isNaN(budget) || budget <= 0) {
        alert("Le budget doit être un nombre positif");
        return;
      }

      await categoryService.createCategory({
        name: newCategoryName.trim(),
        budget,
        color: "#1976d2", // Default color
      });

      setNewCategoryName("");
      setNewCategoryBudget("");
      setDialogOpen(false);
      loadCategories(); // Refresh the list
    } catch (error) {
      console.error("Error creating category:", error);
      alert("Erreur lors de la création de la catégorie");
    }
  };

  const handleEditClick = (category: Category) => {
    setEditingCategory({
      id: category.id,
      name: category.name,
      budget: category.budget.toString(),
    });
    setEditDialogOpen(true);
  };

  const handleUpdateCategory = async () => {
    if (
      !editingCategory ||
      !editingCategory.name.trim() ||
      !editingCategory.budget.trim()
    )
      return;

    try {
      const budget = parseFloat(editingCategory.budget);
      if (isNaN(budget) || budget < 0) {
        alert("Le budget doit être un nombre positif");
        return;
      }

      await categoryService.updateCategory(editingCategory.id, {
        name: editingCategory.name.trim(),
        budget,
      });

      setEditingCategory(null);
      setEditDialogOpen(false);
      loadCategories(); // Refresh the list
    } catch (error) {
      console.error("Error updating category:", error);
      alert("Erreur lors de la mise à jour de la catégorie");
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    if (
      window.confirm("Êtes-vous sûr de vouloir supprimer cette catégorie ?")
    ) {
      try {
        await categoryService.deleteCategory(categoryId);
        loadCategories(); // Refresh the list
      } catch (error) {
        console.error("Error deleting category:", error);
        alert("Erreur lors de la suppression de la catégorie");
      }
    }
  };

  const handleToggleCategoryVisibility = async (
    categoryId: number,
    currentShow: boolean
  ) => {
    try {
      await categoryService.updateCategory(categoryId, {
        show: !currentShow,
      });
      loadCategories(); // Refresh the list
    } catch (error) {
      console.error("Error updating category visibility:", error);
      alert("Erreur lors de la modification de la visibilité de la catégorie");
    }
  };

  const handleExportDatabase = async () => {
    try {
      // Get all data from the database
      const exportData = await dataService.exportData();

      // Convert to JSON string
      const jsonString = JSON.stringify(exportData, null, 2);

      // Create blob and download
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      // Create download link
      const link = document.createElement("a");
      link.href = url;
      link.download = `budget-export-${
        new Date().toISOString().split("T")[0]
      }.json`;

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert("Base de données exportée avec succès !");
    } catch (error) {
      console.error("Error exporting database:", error);
      alert("Erreur lors de l'export de la base de données");
    }
  };

  const handleImportDatabase = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Confirm import action
      const confirmed = window.confirm(
        "Attention ! L'import va remplacer toutes les données actuelles. Êtes-vous sûr de vouloir continuer ?"
      );

      if (!confirmed) {
        event.target.value = ""; // Reset file input
        return;
      }

      // Read the file
      const text = await file.text();
      const importData = JSON.parse(text);

      // Validate the import structure
      if (
        !importData.version ||
        !importData.categories ||
        !importData.expenses
      ) {
        throw new Error("Format de fichier invalide");
      }

      // Import data using the data service
      await dataService.importData(importData);

      // Refresh the categories list
      await loadCategories();

      alert(
        `Import réussi ! ${importData.categories.length} catégories et ${importData.expenses.length} dépenses importées.`
      );

      // Reset file input
      event.target.value = "";
    } catch (error) {
      console.error("Error importing database:", error);
      alert(
        "Erreur lors de l'import de la base de données. Vérifiez que le fichier est valide."
      );
      event.target.value = ""; // Reset file input
    }
  };

  return (
    <>
      {/* Main Content */}
      <Container
        maxWidth="md"
        sx={{
          mt: 0,
          mb: 8, // Add bottom margin for bottom navigation
          opacity: contentVisible ? 1 : 0,
          transform: contentVisible ? "translateY(0)" : "translateY(30px)",
          transition: "opacity 0.6s ease-out, transform 0.6s ease-out",
        }}
      >
        <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
          Paramètres de l'application
        </Typography>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Revenu mensuel
            </Typography>
            <TextField
              label="Montant total des revenus (€)"
              value={monthlyIncome}
              onChange={handleMonthlyIncomeChange}
              type="number"
              inputProps={{ min: "0", step: "0.01" }}
              fullWidth
            />
          </CardContent>
        </Card>

        {/* Category Management */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6" gutterBottom>
                Catégories
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={showHiddenCategories}
                      onChange={(e) =>
                        setShowHiddenCategories(e.target.checked)
                      }
                      size="small"
                    />
                  }
                  label="Afficher"
                />
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setDialogOpen(true)}
                  size="small"
                >
                  Ajouter
                </Button>
              </Box>
            </Box>

            {loading ? (
              <Typography variant="body2" color="text.secondary">
                Chargement des catégories...
              </Typography>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {categories.map((category) => (
                  <Box
                    key={category.id}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      p: 1,
                      border: 1,
                      borderColor: "divider",
                      borderRadius: 1,
                      backgroundColor: category.show
                        ? "background.paper"
                        : "action.hover",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        cursor: "pointer",
                        flexGrow: 1,
                      }}
                      onClick={() => handleEditClick(category)}
                    >
                      {category.show ? (
                        <Visibility color="primary" fontSize="small" />
                      ) : (
                        <VisibilityOff color="action" fontSize="small" />
                      )}
                      <Typography
                        variant="body2"
                        sx={{
                          textDecoration: category.show
                            ? "none"
                            : "line-through",
                          color: category.show
                            ? "text.primary"
                            : "text.secondary",
                        }}
                      >
                        {category.name} -{" "}
                        {category.budget.toLocaleString("fr-FR", {
                          style: "currency",
                          currency: "EUR",
                        })}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={category.show}
                            onChange={() =>
                              handleToggleCategoryVisibility(
                                category.id,
                                category.show
                              )
                            }
                            size="small"
                          />
                        }
                        label=""
                      />
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteCategory(category.id)}
                        aria-label="supprimer"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                ))}
                {categories.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    Aucune catégorie trouvée
                  </Typography>
                )}
              </Box>
            )}

            <Box
              sx={{
                mt: 2,
                pt: 2,
                borderTop: 1,
                borderColor: "divider",
                display: "flex",
                flexDirection: "column",
                gap: 1,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Total des catégories
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {formatCurrency(totalCategoryBudget)}
                </Typography>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: "action.hover",
                  borderRadius: 1,
                  px: 1,
                  py: 0.5,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Revenu - catégories
                </Typography>
                <Typography
                  variant="body1"
                  fontWeight={600}
                  color={remainingColor}
                >
                  {formatCurrency(remainingBudget)}
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                mt: 2,
                p: 1,
                backgroundColor: "action.hover",
                borderRadius: 1,
              }}
            >
              <Typography variant="caption" color="text.secondary">
                <Visibility
                  fontSize="small"
                  sx={{ verticalAlign: "middle", mr: 0.5 }}
                />
                Catégorie visible
                {" | "}
                <VisibilityOff
                  fontSize="small"
                  sx={{ verticalAlign: "middle", mr: 0.5 }}
                />
                Catégorie masquée
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Add Category Dialog */}
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Ajouter une nouvelle catégorie</DialogTitle>
          <DialogContent>
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
            >
              <TextField
                label="Nom de la catégorie"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                fullWidth
                required
              />
              <TextField
                label="Budget mensuel (€)"
                value={newCategoryBudget}
                onChange={(e) => setNewCategoryBudget(e.target.value)}
                fullWidth
                required
                type="number"
                inputProps={{ min: "0", step: "0.01" }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button
              onClick={handleAddCategory}
              variant="contained"
              disabled={!newCategoryName.trim() || !newCategoryBudget.trim()}
            >
              Ajouter
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Category Dialog */}
        <Dialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Modifier la catégorie</DialogTitle>
          <DialogContent>
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
            >
              <TextField
                label="Nom de la catégorie"
                value={editingCategory?.name || ""}
                onChange={(e) =>
                  setEditingCategory((prev) =>
                    prev ? { ...prev, name: e.target.value } : null
                  )
                }
                fullWidth
                required
              />
              <TextField
                label="Budget mensuel (€)"
                value={editingCategory?.budget || ""}
                onChange={(e) =>
                  setEditingCategory((prev) =>
                    prev ? { ...prev, budget: e.target.value } : null
                  )
                }
                fullWidth
                required
                type="number"
                inputProps={{ min: "0", step: "0.01" }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>Annuler</Button>
            <Button
              onClick={handleUpdateCategory}
              variant="contained"
              disabled={
                !editingCategory?.name.trim() || !editingCategory?.budget.trim()
              }
            >
              Enregistrer
            </Button>
          </DialogActions>
        </Dialog>

        {/* Database Export/Import */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Export/Import de la base de données
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Sauvegardez ou restaurez toutes vos données (catégories et
              dépenses)
            </Typography>

            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <Button
                variant="contained"
                onClick={handleExportDatabase}
                sx={{ mt: 1 }}
              >
                Exporter la base de données
              </Button>

              <Button variant="outlined" component="label" sx={{ mt: 1 }}>
                Importer la base de données
                <input
                  type="file"
                  hidden
                  accept=".json"
                  onChange={handleImportDatabase}
                />
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* About Section */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              À propos
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Mon Budget v1.0.3
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Application de gestion de budget personnelle
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </>
  );
}
