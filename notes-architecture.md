# Étape 1 – Analyse du code existant

## 1. Structure générale du projet

- Les composants sont rangés dans `src/app/pages`.
- Aucun dossier `services`, `core` ou `shared`.  
  Toute la logique métier, la récupération des données et les calculs sont dans les composants.

**Exemple (src/app/pages/home/home.component.ts)**  
private olympicUrl = './assets/mock/olympic.json';  
ngOnInit() {  
this.http.get<any[]>(this.olympicUrl).subscribe(data => { ... });  
}

**Risques :**
- duplication de code
- faible testabilité
- difficile à remplacer par une API réelle

**Amélioration :** créer un `OlympicService`.

Les composants ont trop de responsabilités :
- `home.component.ts` : HTTP, calculs, graphiques, navigation.
- `country.component.ts` : HTTP, filtrage, calculs, graphiques.

---

## 2. Analyse du HomeComponent
Fichier : `src/app/pages/home/home.component.ts`

### Appels HTTP
ngOnInit() {  
this.http.get<any[]>(this.olympicUrl).subscribe(...);  
}  
→ Devrait être déplacé dans un service.

### Usage massif du type `any`
Exemples :  
data.map((i: any) => i.country)  
i.participations.map((p: any) => p.medalsCount)

Interfaces attendues :
- `Participation` : id, year, city, medalsCount, athleteCount
- `OlympicCountry` : id, country, participations[]

### Console.log inutiles
console.log(JSON.stringify(data))  
→ À retirer

### Gestion d’erreur incomplète
this.error = error.message  
→ Aucune balise affichant cette erreur dans `home.component.html`.

### Observables gérés manuellement
- subscribe direct
- pas de désabonnement  
  → Peu robuste.

### Logique Chart.js + navigation Angular mélangées
- Le clic sur un segment du graphique redirige via `router.navigate`.  
  → Mauvaise séparation des responsabilités.

### Destruction manquante du graphique
Aucun `ngOnDestroy()` pour détruire le graphique → risque de fuites mémoire.

---

## 3. Analyse du CountryComponent
Fichier : `src/app/pages/country/country.component.ts`

### Duplication de l’appel HTTP
Même logique de chargement que dans Home → devrait être centralisé dans un service.

### Usage massif de any
selectedCountry = data.find((i: any) => ...)  
→ Doit être remplacé par des types stricts.

### Gestion du paramètre de route peu lisible
route.paramMap.subscribe(...)  
→ `snapshot` serait plus simple :  
route.snapshot.paramMap.get('countryName')


### Erreur jamais affichée
this.error existe mais n’apparaît pas dans le template HTML.

---

## 6. Synthèse des problèmes identifiés

- Appels HTTP directement dans les composants.
- Usage massif du type `any`.
- Absence d’interfaces TypeScript.
- Aucune couche service.
- Observables gérés manuellement.
- Logique Chart.js mélangée avec la logique Angular.
- Erreurs jamais affichées dans la vue.
- Présence de console.log.
- HTML avec du code inutile.

---

## Conclusion

Le code actuel fonctionne mais présente plusieurs anti-patterns Angular :

- mauvaise séparation des responsabilités,
- typage faible,
- duplication de logique,
- gestion insuffisante des observables,
- tests non pertinents.

## Étape 2 – Proposition de nouvelle architecture front-end

---

### 1. Principes d’architecture retenus

- **Séparer l’affichage de la logique métier**
  - Les composants (`components` / `pages`) ne contiennent que :
    - la gestion de l’affichage,
    - les interactions utilisateur,
    - le binding des données.
  - La logique métier (calculs, transformations, accès aux données) est déplacée dans des **services**.

- **Centraliser les accès aux données dans `services/`**
  - Tous les appels aux données (aujourd’hui : JSON local, demain : API REST) passent par un service Angular dédié (`OlympicService`).
  - Pattern utilisé : **Singleton** (services fournis en `providedIn: 'root'`).

- **Typage fort avec des modèles (`models/`)**
  - Création d’interfaces TypeScript pour décrire les données manipulées :
    - `OlympicCountry`
    - `Participation`
  - Objectif : supprimer l’usage du type `any` et sécuriser les évolutions.

- **Distinguer pages, composants et services**
  - `pages/` : composants liés aux routes (écrans principaux).
  - `components/` : composants réutilisables éventuels (cartes, graphiques, etc.).
  - `services/` : logique de données et de métier.
  - `models/` : définitions des types de données.

---

### 2. Nouvelle arborescence proposée

Arborescence cible de `src/app/` :

- `src/app/`
  - `pages/`
    - `home/`
      - `home.component.ts`
      - `home.component.html`
      - `home.component.scss`
    - `country/`
      - `country.component.ts`
      - `country.component.html`
      - `country.component.scss`
    - `not-found/`
      - `not-found.component.ts`
      - `not-found.component.html`
      - `not-found.component.scss`
  - `components/`
    - (optionnel pour plus tard : composants de présentation réutilisables, par exemple un composant de carte pays ou un composant de graphique)
  - `services/`
    - `olympic.service.ts`
  - `models/`
    - `olympic-country.model.ts`
    - `participation.model.ts`
  - `app-routing.module.ts`
  - `app.component.ts / .html / .scss`

Cette structure reste simple mais :
- sépare clairement les responsabilités,
- prépare l’extension du projet (nouvelles pages, nouveaux services, etc.).

---

### 3. Répartition des fichiers existants (déplacement “virtuel”)

Pour l’instant, les fichiers ne sont pas encore réellement déplacés dans le code, mais **la structure cible est la suivante** :

- **Pages** (`src/app/pages/`)
  - `HomeComponent` → reste dans `src/app/pages/home/`
  - `CountryComponent` → reste dans `src/app/pages/country/`
  - `NotFoundComponent` → reste dans `src/app/pages/not-found/`

- **Services** (`src/app/services/`)
  - Nouveau fichier `olympic.service.ts`
    - Rôle :
      - charger les données depuis `assets/mock/olympic.json`,
      - exposer des méthodes comme :
        - `getCountries(): Observable<OlympicCountry[]>`
        - `getCountryByName(name: string): Observable<OlympicCountry | undefined>`
      - centraliser tous les accès aux données.
    - Pattern : **Singleton Angular** (service fourni en `root`).

- **Modèles** (`src/app/models/`)
  - `olympic-country.model.ts`
    - contient l’interface `OlympicCountry`
  - `participation.model.ts`
    - contient l’interface `Participation`

- **Composants réutilisables** (`src/app/components/`)
  - Aucun dans l’immédiat, mais ce dossier est prévu pour :
    - un éventuel composant de graphique réutilisable,
    - un composant de carte “pays”,
    - d’autres éléments UI si le projet grandit.

---

### 4. Design patterns utilisés et bénéfices

- **Pattern Singleton (services Angular)**
  - Les services Angular (comme `OlympicService`) sont fournis via `providedIn: 'root'`.
  - Cela signifie qu’il existe **une seule instance partagée** dans toute l’application.
  - Bénéfices :
    - état centralisé (si nécessaire),
    - configuration des accès aux données (URL API, headers…) au même endroit,
    - plus simple à tester et à maintenir.

- **Séparation Component / Service**
  - Les composants ne font plus d’appels HTTP ni de calculs lourds.
  - Les services :
    - récupèrent les données,
    - les transforment si besoin,
    - les fournissent aux composants via des `Observable` ou des `Promise`.
  - Bénéfices :
    - composants plus simples, plus faciles à lire,
    - logique métier testable indépendamment de l’UI,
    - réutilisabilité (un même service peut alimenter plusieurs pages).

- **Modèles (interfaces TypeScript)**
  - Suppression progressive de `any`.
  - Bénéfices :
    - cohérence des données,
    - auto-complétion dans l’IDE,
    - erreurs détectées à la compilation plutôt qu’à l’exécution.

---

### 5. Préparation à l’intégration d’un back-end

Même si, dans ce projet, les données proviennent d’un fichier JSON local (`assets/mock/olympic.json`), l’architecture proposée anticipe l’arrivée d’une vraie API back-end.

Avec la structure proposée :

- Les composants (Home, Country) ne “savent pas” d’où viennent les données.
- Si, plus tard, le back-end expose une API REST :
  - seul `OlympicService` devra être modifié (remplacer la lecture du JSON par des appels HTTP).
  - les signatures des méthodes (`getCountries()`, `getCountryByName()`) pourront rester identiques.
- Les tests pourront simuler (mock) le service sans changer les composants.

Cette organisation :
- limite l’impact des changements côté serveur,
- respecte le principe de **faible couplage** entre front-end et back-end.

---

### 6. Synthèse de l’architecture cible

En résumé, l’architecture proposée :

- garde les **pages** dans `src/app/pages` (structure existante, mais clarifiée),
- ajoute :
  - un dossier `services/` pour tous les accès aux données,
  - un dossier `models/` pour les types de données,
  - un dossier `components/` pour les futurs composants de présentation réutilisables,
- applique :
  - le pattern **Singleton** pour les services,
  - la **séparation nette component / service**,
  - l’usage systématique d’**interfaces TypeScript** pour remplacer `any`.

Cette architecture reste simple, claire et proportionnée à la taille du projet, tout en rendant le code plus maintenable et prêt pour une future intégration avec une API back-end.
