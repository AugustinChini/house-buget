# Mon Budget - Application de Gestion de Budget Familial

Une application légère et intuitive de gestion de budget pour la maison, développée avec React, TypeScript et Vite.

## Description

Mon Budget est une application web moderne conçue pour simplifier la gestion financière familiale. Elle permet de suivre facilement les dépenses et revenus, de catégoriser les transactions, et de visualiser les tendances de consommation mois par mois.

## Fonctionnalités Principales

### 📊 **Tableau de Bord Intuitif**
- Vue d'ensemble du solde total
- Affichage des revenus et dépenses du mois
- Progression visuelle par catégorie avec barres de progression
- Navigation par mois pour analyser l'historique

### 💰 **Gestion des Dépenses**
- Ajout rapide de dépenses et revenus
- Catégorisation automatique
- Support des dépenses récurrentes
- Filtrage et recherche avancée

### 📈 **Analyse et Rapports**
- Résumé mensuel détaillé
- Comparaison des dépenses par catégorie
- Visualisation des tendances
- Export/import des données

### 🔄 **Dépenses Récurrentes**
- Détection automatique des dépenses récurrentes
- Proposition de recréation mensuelle
- Gestion intelligente des paiements réguliers

### 🎨 **Interface Moderne**
- Design responsive et accessible
- Navigation fluide entre les pages
- Animations et transitions élégantes
- Support mobile et desktop

## Technologies Utilisées

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI Framework**: Material-UI (MUI)
- **State Management**: React Hooks
- **Storage**: IndexedDB (stockage local)
- **Routing**: React Router
- **Styling**: Emotion (CSS-in-JS)

## Installation et Démarrage

### Prérequis
- Node.js (version 16 ou supérieure)
- npm ou yarn

### Installation
```bash
# Cloner le repository
git clone [url-du-repo]

# Accéder au dossier
cd budget

# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm run dev
```

### Scripts Disponibles
```bash
npm run dev          # Démarrer le serveur de développement
npm run build        # Construire pour la production
npm run preview      # Prévisualiser la build de production
npm run lint         # Lancer ESLint
```

## Structure du Projet

```
src/
├── components/          # Composants réutilisables
├── pages/              # Pages principales de l'application
├── services/           # Services métier et API
├── models/             # Types et interfaces TypeScript
├── dao/                # Couche d'accès aux données
└── assets/             # Ressources statiques
```

## Fonctionnalités Avancées

### Gestion des Catégories
- Création et modification de catégories personnalisées
- Attribution de budgets par catégorie
- Suivi des dépassements de budget

### Export/Import
- Sauvegarde complète des données en JSON
- Restauration des données depuis un fichier
- Migration facile entre appareils

### Responsive Design
- Interface adaptée aux mobiles et tablettes
- Navigation tactile optimisée
- Affichage adaptatif selon la taille d'écran

## Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
- Signaler des bugs
- Proposer de nouvelles fonctionnalités
- Soumettre des améliorations

## Licence

Ce projet est sous licence MIT.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
