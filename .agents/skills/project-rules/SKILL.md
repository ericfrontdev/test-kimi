---
name: project-rules
description: Règles strictes de codage React/Next.js et workflow Git - Découpage auto des fichiers, branches fix/feature obligatoires, PR requise, pas de merge sur main
---

# ⚠️ CONTRAINTES OBLIGATOIRES - NON-NÉGOCIABLES

Tu DOIS suivre ces règles À LA LETTRE pour chaque fichier créé ou modifié. Si une demande viole ces règles, refuse l'implémentation et explique pourquoi.

---

## 📏 LIMITES DE LIGNES PAR TYPE DE FICHIER (STRICT)

| Type de fichier | Lignes MAX | Flexibilité | Action si dépassé |
|-----------------|------------|-------------|-------------------|
| **Composants React** (.tsx/.jsx) | 200 lignes | Moyenne | Extraire en sous-composants |
| **Pages Next.js** (page.tsx) | 100 lignes | Élevée | Déplacer la logique dans des composants ou hooks |
| **Layouts** (layout.tsx) | 80 lignes | Moyenne | Créer des composants de layout séparés |
| **API Routes** (route.ts) | 150 lignes | Moyenne | Séparer en fonctions utilitaires ou services |
| **Hooks personnalisés** (useX.ts) | 100 lignes | Faible | Diviser en hooks plus petits et spécialisés |
| **Stores Zustand** (*.ts) | 150 lignes | Moyenne | Découper en stores spécialisés |
| **Utilitaires** (lib/utils.ts) | Pas de limite stricte | Élevée | - |
| **Types/Interfaces** (types.ts) | Pas de limite | Élevée | - |
| **Styles** (globals.css, etc.) | Pas de limite | Élevée | - |
| **Tests** (*.test.tsx) | 300 lignes | Élevée | - |
| **Configuration** (next.config.js, etc.) | Variable | Élevée | - |

### 🚨 Règles de découpage

**SI une demande risque de dépasser les limites, tu DOIS :**
1. Identifier les responsabilités séparables AVANT de coder
2. Planifier le découpage en fichiers respectant les limites
3. Créer directement tous les fichiers nécessaires
4. Expliquer le découpage réalisé après coup

**N'attends pas la permission** - découpe automatiquement et présente le résultat.

---

## 🏪 STORES ZUSTAND

**Limite :** Maximum **150 lignes** par store.

**Si un store dépasse 150 lignes, le découper en plusieurs stores spécialisés :**

| Store | Responsabilité |
|-------|----------------|
| `xxxStore.ts` | Données et CRUD (état, actions, fetch) |
| `xxxUIStore.ts` | État UI uniquement (modales ouvertes, loading, erreurs) |
| `xxxSelectionStore.ts` | Sélection/active item |

**Exemple de découpage :**
```typescript
// projectsStore.ts (111 lignes) - Données
export const useProjectsStore = create<ProjectsState>((set, get) => ({
  projects: [],
  fetchProjects: async () => { ... },
  createProject: async (data) => { ... },
}));

// projectsUIStore.ts (50 lignes) - UI state
export const useProjectsUIStore = create<ProjectsUIState>((set) => ({
  isCreateDialogOpen: false,
  editingProjectId: null,
  setCreateDialogOpen: (open) => set({ isCreateDialogOpen: open }),
}));
```

---

## 🎨 STYLE DE CODE

### Formatage
- **Indentation** : 2 espaces (PAS de tabs)
- **Longueur max** : 80 caractères par ligne
- **Nomenclature** :
  - `camelCase` : variables, fonctions, hooks
  - `PascalCase` : classes, types, interfaces, composants React
  - `UPPER_SNAKE_CASE` : constantes globales
- **Langue** : Tous les commentaires et noms DOIVENT être en anglais

### TypeScript (Strict)
- **Pas de `any`** - types stricts obligatoires partout
- **Explicit return types** sur toutes les fonctions exportées
- **No implicit returns** - toujours retourner une valeur explicite
- **Strict null checks** activé

---

## 🏗️ ARCHITECTURE

### Structure des fichiers
```
src/
  components/     # UI components only (50-200 lignes max)
  hooks/          # Custom React hooks (30-100 lignes max)
  lib/            # Pure functions, utils (pas de limite)
  types/          # TypeScript definitions
  services/       # API calls et logique métier
  app/            # Next.js app router
    page.tsx      # Pages (30-100 lignes max)
    layout.tsx    # Layouts (20-80 lignes max)
    api/          # API routes (50-150 lignes max)
```

### Règles d'organisation
- **Un seul export par fichier** (sauf `lib/utils/`)
- **Pas de dépendances circulaires** - toujours vérifier les imports
- **Alias obligatoires** : utiliser `@/components`, `@/utils`, jamais de chemins relatifs complexes (`../../../`)
- **Séparation des concerns** : UI ≠ Logique ≠ Data

---

## 🧪 TESTS (OBLIGATOIRES)

### Couverture minimale
- **Chaque fonction exportée DOIT avoir un test**
- **Couverture minimale** : 80%
- **Framework** : Vitest uniquement
- **Tests d'intégration** : pour les composants critiques

### Structure des tests
```typescript
// Pattern obligatoire
describe('ComponentName', () => {
  it('should render correctly', () => {})
  it('should handle user interaction', () => {})
  it('should handle edge cases', () => {})
})
```

---

## 🔒 VALIDATION AVANT COMMIT

Tout code doit passer ces vérifications :

- [ ] **ESLint** : aucune erreur (warnings acceptés avec justification)
- [ ] **Prettier** : formaté automatiquement
- [ ] **TypeScript** : compilation sans erreur (`tsc --noEmit`)
- [ ] **Tests** : tous les tests passent (`npm test`)
- [ ] **Limites de lignes** : chaque fichier respecte son max

---

## 🚫 INTERDICTIONS STRICTES

| Interdit | Raison | Alternative |
|----------|--------|-------------|
| `console.log` en production | Pollue les logs | Utiliser un logger typé ou retirer avant commit |
| `var` | Scope confus | `const` par défaut, `let` si nécessaire |
| `==` / `!=` | Coercion implicite | `===` / `!==` uniquement |
| Fonctions anonymes | Difficile à débugger | Named functions ou arrow functions avec nom |
| Commentaires inutiles | Code doit être auto-documenté | Nommer mieux ou extraire en fonction |
| Magic numbers | Pas de contexte | Constantes nommées |
| Copy-paste de code | Violation DRY | Extraire en fonction réutilisable |

---

## 📝 COMMENTAIRES

### Quand commenter (seulement si nécessaire)
- Logique métier complexe non évidente
- Workarounds temporaires (avec TODO et date)
- Dépendances externes non standards

### Format des TODOs
```typescript
// TODO(username): description - YYYY-MM-DD
// FIXME(username): bug description - YYYY-MM-DD
```

---

## 🔄 PROCESS DE DÉVELOPPEMENT

### Avant de créer un fichier
1. Vérifier s'il existe déjà un fichier similaire
2. Estimer le nombre de lignes nécessaires
3. SI estimation > limite → planifier immédiatement le découpage
4. Créer tous les fichiers du découpage d'un coup

### Pendant le développement
1. Vérifier régulièrement le nombre de lignes (`wc -l`)
2. Refactoriser dès qu'on approche la limite
3. Extraire tôt les composants/hooks réutilisables

### Avant de proposer le code
1. Linter + formater
2. Vérifier les imports (pas de cycles)
3. Compter les lignes de chaque fichier créé/modifié
4. S'assurer que tous les tests passent

---

## ❓ CLARIFICATION ET CONFIRMATION OBLIGATOIRES

**AVANT de commencer toute tâche, tu DOIS suivre ce processus :**

### Étape 1 : Évaluer la clarté

Demande-toi : *La demande est-elle suffisamment claire pour être implémentée sans ambiguïté ?*

**Demande des clarifications si :**
- Les spécifications sont floues ou incomplètes
- Il manque des détails techniques importants
- Plusieurs interprétations sont possibles
- Le comportement attendu n'est pas défini
- Les critères de succès sont absents

**Exemple de demande de clarification :**
> J'ai besoin de clarifications avant de pouvoir avancer :
>
> 1. Tu veux un bouton "Submit" ou "Save" ?
> 2. Le formulaire doit-il être accessible hors connexion ?
> 3. Quelle est la couleur de validation attendue ?
> 4. Dois-je ajouter une confirmation avant suppression ?

### Étape 2 : Reformuler pour confirmation (si c'est clair)

**SI la demande est claire, tu DOIS :**
1. **Reformuler** ce que tu as compris en tes propres mots
2. **Lister les fichiers** que tu vas créer/modifier
3. **Estimer** si ça respecte les limites de lignes
4. **Demander confirmation** avant de commencer

**Template de confirmation :**
> Voici ce que j'ai compris :
>
> **Demande :** Créer un composant UserProfile avec affichage et édition
> **Fichiers à créer :**
> - `UserProfileCard.tsx` (~60 lignes) - affichage read-only
> - `UserProfileEdit.tsx` (~80 lignes) - mode édition
> - `useUserProfile.ts` (~50 lignes) - gestion des données
>
> **Détails confirmés :**
> - Design system : Tailwind + composants existants
> - Validation email requise
> - Pas de photo de profil pour l'instant
>
> **Estimation totale :** ~190 lignes ✅ Respecte les limites
>
> **Puis-je commencer ?** (oui / modifie si besoin)

### Étape 3 : Attendre le feu vert

**NE JAMAIS commencer le développement avant :**
- La réponse "oui" explicite de l'utilisateur, OU
- Des clarifications reçues et reformulées

---

## 📝 RÈGLES DE MESSAGES (COMMIT & PR)

**INTERDICTION ABSOLUE de mentionner :**
- "Kimi"
- "Kimi Code CLI"
- "Kimi K2.5"
- "AI"
- "Modèle"
- "Agent"
- "Claude"
- "GPT"
- Toute autre référence à un assistant IA ou modèle

### Messages de commit

**Format obligatoire :** [Conventional Commits](https://www.conventionalcommits.org/)

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

**Types autorisés :**
- `feat:` - Nouvelle fonctionnalité
- `fix:` - Correction de bug
- `docs:` - Documentation
- `style:` - Formatage, point-virgule manquant, etc.
- `refactor:` - Refactoring de code
- `test:` - Ajout/modification de tests
- `chore:` - Tâches de maintenance, dépendances

**Exemples corrects :**
```bash
git commit -m "feat(auth): add OAuth login flow"
git commit -m "fix(api): handle null response in user endpoint"
git commit -m "refactor(components): extract UserCard from UserProfile"
git commit -m "test(utils): add unit tests for formatDate"
```

**INTERDIT :**
```bash
git commit -m "feat: add button (created by Kimi)"        ❌
git commit -m "fix: bug - generated by AI"                 ❌
git commit -m "feat: login - Claude Code implementation"   ❌
```

### Descriptions de Pull Request

**Template obligatoire :**

```markdown
## Description
[Bref résumé des changements]

## Changements
- [Liste des modifications principales]
- [Fichiers créés/modifiés]

## Tests
- [ ] Tests passent localement
- [ ] Pas de régression identifiée

## Checklist
- [ ] Code review effectué
- [ ] Limites de lignes respectées
```

**INTERDIT dans les PRs :**
- ❌ "J'ai créé..." (utiliser "Ajout de...", "Création de...")
- ❌ "Kimi a..."
- ❌ "L'IA a..."
- ❌ "Generated by..."
- ❌ Toute mention d'assistant/automation

**Formulation correcte :**
- ✅ "Ajout du composant UserProfile"
- ✅ "Implémentation de l'authentification OAuth"
- ✅ "Refactoring du hook useAuth"
- ❌ "J'ai ajouté le composant..." (pas de "je")

---

## 🌿 WORKFLOW GIT STRICT

**INTERDICTION ABSOLUE de commit directement sur `main`.** Tout code passe par une PR.

### Convention de nommage des branches

| Type | Pattern | Exemple |
|------|---------|---------|
| **Nouvelle fonctionnalité** | `feature/description-courte` | `feature/add-user-auth` |
| **Correction de bug** | `fix/description-courte` | `fix/login-redirect-error` |
| **Hotfix critique** | `hotfix/description-courte` | `hotfix/security-patch` |

### Process obligatoire

```bash
# 1. Créer et switch sur la branche de travail
git checkout -b feature/ma-fonctionnalite

# 2. Développer sur cette branche uniquement
# ... coder ...

# 3. Commit avec message conventionnel
git commit -m "feat(auth): add OAuth login flow"

# 4. Pousser la branche sur remote
git push origin feature/ma-fonctionnalite

# 5. Créer une Pull Request (via GitHub CLI ou interface)
gh pr create --title "feat(auth): add OAuth login" --body "Description..."
```

### 🚫 RÈGLES NON-NÉGOCIABLES

- **JAMAIS de commit direct sur `main`**
- **JAMAIS de merge par moi (l'IA)** - Je ne peux PAS merger les PRs
- **JAMAIS de code review par moi** - Seul l'utilisateur fait le review
- **TOUJOURS une PR** avant que le code arrive sur `main`

### Ce que je fais / Ce que je ne fais PAS

| Action | Je fais | Je ne fais PAS |
|--------|---------|----------------|
| Créer des branches | ✅ Oui | - |
| Commiter du code | ✅ Oui | - |
| Pousser sur remote | ✅ Oui | - |
| Créer des PRs | ✅ Oui (avec `gh pr create`) | - |
| Merger sur `main` | ❌ NON | ⛔ Interdit absolu |
| Review de code | ❌ NON | ⛔ Seul l'utilisateur review |
| Approuver une PR | ❌ NON | ⛜ Je ne peux pas approuver |

### Message après création de PR

Quand j'ai fini et poussé sur une branche, je dois dire :

> ✅ J'ai créé la branche `feature/xxx` et poussé le code.
> 
> **Prochaines étapes pour toi :**
> 1. Review la PR : `gh pr view` ou sur GitHub
> 2. Faire le code review (je ne peux pas le faire)
> 3. Merger si tout est OK (je ne peux pas merger)
>
> La PR est prête à être reviewée !

---

## 🔴 PROCÉDURE DE DÉCOUPAGE AUTOMATIQUE

**Si une demande dépasserait les limites de lignes, tu DOIS découper automatiquement SANS demander la permission.**

### Approche proactive

1. **Analyser la demande** et identifier les responsabilités distinctes
2. **Planifier le découpage** en fichiers respectant les limites
3. **Créer directement** tous les fichiers nécessaires
4. **Expliquer après coup** le découpage réalisé et pourquoi

### Stratégies de découpage par type

**Composant React trop grand (>200 lignes) :**
- Extraire les sous-sections UI en composants enfants
- Déplacer la logique métier dans des hooks personnalisés
- Séparer les constantes/configurations dans un fichier dédié

**Page Next.js trop grosse (>100 lignes) :**
- Déplacer tout le contenu dans un composant `PageContent.tsx`
- Garder dans `page.tsx` uniquement : imports, metadata, et render
- Extraire les data fetching dans des fonctions `lib/data/xxx.ts`

**Hook trop gros (>100 lignes) :**
- Diviser en hooks spécialisés (`useXData`, `useXActions`, `useXState`)
- Extraire les helpers dans `lib/hooks/helpers/xxx.ts`

**API Route trop grosse (>150 lignes) :**
- Créer un service dans `lib/services/xxx.ts`
- Créer des validators dans `lib/validators/xxx.ts`
- Garder dans `route.ts` uniquement : routing + appel au service

### Exemple de réponse après découpage

> J'ai décomposé `UserDashboard` en 4 fichiers pour respecter les limites de lignes :
>
> | Fichier | Lignes | Responsabilité |
> |---------|--------|----------------|
> | `UserDashboard.tsx` | 45 | Orchestration, layout principal |
> | `UserProfileCard.tsx` | 78 | Affichage du profil utilisateur |
> | `useUserData.ts` | 62 | Fetching et gestion des données |
> | `UserActions.tsx` | 42 | Boutons d'action et handlers |
>
> Total : 227 lignes → 4 fichiers maintenables et testables individuellement.
