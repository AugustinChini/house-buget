import {
  Typography,
  Container,
  Card,
  CardContent,
  Box,
  Chip,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import { useState, useEffect } from "react";
import { categoryService, dataService } from "../services";
import type { Category } from "../models";

export function Settings() {
  const [contentVisible, setContentVisible] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryBudget, setNewCategoryBudget] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load categories on component mount
  useEffect(() => {
    loadCategories();
  }, []);

  // Animate content when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setContentVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const allCategories = await categoryService.getAllCategories({
        isActive: true,
      });
      setCategories(allCategories);
    } catch (error) {
      console.error("Error loading categories:", error);
    } finally {
      setLoading(false);
    }
  };

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
                Gestion des catégories
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setDialogOpen(true)}
                size="small"
              >
                Ajouter
              </Button>
            </Box>

            {loading ? (
              <Typography variant="body2" color="text.secondary">
                Chargement des catégories...
              </Typography>
            ) : (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {categories.map((category) => (
                  <Chip
                    key={category.id}
                    label={`${category.name} - ${category.budget.toLocaleString(
                      "fr-FR",
                      {
                        style: "currency",
                        currency: "EUR",
                      }
                    )}`}
                    onDelete={() => handleDeleteCategory(category.id)}
                    color="primary"
                    variant="outlined"
                    sx={{ mb: 1 }}
                  />
                ))}
                {categories.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    Aucune catégorie trouvée
                  </Typography>
                )}
              </Box>
            )}
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
              Mon Budget v1.0.0
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
