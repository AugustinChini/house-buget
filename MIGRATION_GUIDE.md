# Guide de Migration - Fonctionnalité de Masquage des Catégories

## Nouveautés

### Attribut `show` pour les catégories

Un nouvel attribut `show` de type boolean a été ajouté au modèle des catégories pour permettre de masquer/afficher les catégories dans l'interface utilisateur.

## Changements dans la Base de Données

### Nouvelle colonne `show`

- **Table**: `categories`
- **Colonne**: `show`
- **Type**: `INTEGER NOT NULL DEFAULT 1`
- **Description**: Contrôle la visibilité de la catégorie dans l'interface

### Migration automatique

La migration est automatiquement appliquée lors du démarrage de l'application. Toutes les catégories existantes sont marquées comme visibles (`show = 1`) par défaut.

## Changements dans l'Interface Utilisateur

### Page Paramètres (Settings)

1. **Toggle de visibilité** : Chaque catégorie dispose maintenant d'un switch pour activer/désactiver sa visibilité
2. **Indicateurs visuels** :
   - Icône 👁️ pour les catégories visibles
   - Icône 👁️‍🗨️ pour les catégories masquées
   - Texte barré pour les catégories masquées
   - Fond grisé pour les catégories masquées
3. **Toggle global** : Option pour afficher/masquer toutes les catégories (y compris les masquées)
4. **Légende** : Explication des icônes de visibilité

### Filtrage automatique

- **Page d'accueil** : Seules les catégories visibles sont affichées dans les graphiques et résumés
- **Création d'expenses** : Seules les catégories visibles apparaissent dans les listes déroulantes
- **Détails des expenses** : Seules les catégories visibles sont disponibles pour le filtrage

## API Changes

### Endpoint GET /api/categories

Nouveau paramètre de requête supporté :
- `show`: boolean - Filtre les catégories par visibilité

### Endpoint PUT /api/categories/:id

Nouveau champ supporté dans le body :
- `show`: boolean - Met à jour la visibilité de la catégorie

## Modèles TypeScript

### Category Interface

```typescript
export interface Category {
  id: number;
  name: string;
  budget: number;
  color: string;
  icon?: string;
  description?: string;
  isActive: boolean;
  show: boolean; // Nouveau champ
  createdAt: Date;
  updatedAt: Date;
}
```

### CategoryFilters Interface

```typescript
export interface CategoryFilters {
  isActive?: boolean;
  show?: boolean; // Nouveau filtre
  search?: string;
}
```

## Migration Manuelle (Optionnel)

Si vous souhaitez exécuter la migration manuellement :

```bash
cd backend
node scripts/migrate-add-show-column.js
```

## Compatibilité

- ✅ **Rétrocompatible** : Toutes les catégories existantes restent visibles
- ✅ **Migration automatique** : Aucune action manuelle requise
- ✅ **API compatible** : Les anciens appels API continuent de fonctionner

## Utilisation

### Masquer une catégorie

1. Aller dans **Paramètres** > **Gestion des catégories**
2. Utiliser le switch à côté de la catégorie souhaitée
3. La catégorie sera automatiquement masquée de toutes les interfaces

### Afficher les catégories masquées

1. Dans **Paramètres** > **Gestion des catégories**
2. Activer le toggle "Afficher les catégories masquées"
3. Toutes les catégories (visibles et masquées) seront affichées

### Programmatiquement

```typescript
// Masquer une catégorie
await categoryService.updateCategory(categoryId, { show: false });

// Afficher une catégorie
await categoryService.updateCategory(categoryId, { show: true });

// Récupérer seulement les catégories visibles
const visibleCategories = await categoryService.getAllCategories({ 
  isActive: true, 
  show: true 
});
``` 