# ARCHITECTURE FRONT-END – TéléSport
---

## 1. Arborescence du projet

```text
src/app/
├── pages/
│ ├── home/
│ │ ├── home.component.ts
│ │ ├── home.component.html
│ │ └── home.component.scss
│ ├── country/
│ │ ├── country.component.ts
│ │ ├── country.component.html
│ │ └── country.component.scss
│ └── not-found/
│ ├── not-found.component.ts
│ └── not-found.component.html
│
├── components/
│ ├── medal-chart/
│ │ ├── medal-chart.component.ts
│ │ ├── medal-chart.component.html
│ │ └── medal-chart.component.scss
│ └── country-card/
│ ├── country-card.component.ts
│ ├── country-card.component.html
│ └── country-card.component.scss
│
├── services/
│ └── data.service.ts
│
├── models/
│ ├── olympic.model.ts
│ └── participation.model.ts
│
├── app-routing.module.ts
└── app.component.ts
```

Cette structure sépare clairement :
- les pages liées au routing,
- les composants réutilisables,
- les services de logique métier,
- les modèles TypeScript.

---

## 2. Rôle des composants

### HomeComponent (pages/home/)
- Charge toutes les données via DataService.
- Calcule les statistiques globales (nombre de pays, nombre de JO).
- Transmet les données au MedalChartComponent.
- Ne gère plus aucun appel HTTP ni aucune logique Chart.js.

### MedalChartComponent (components/medal-chart/)
- Affiche le graphique global (pie chart).
- Gère le clic utilisateur et la navigation vers `/country/:name`.
- Détruit proprement le graphique pour éviter les fuites mémoire.
- Reçoit les données via : `@Input() olympics: Olympic[]`.

### CountryComponent (pages/country/)
- Lit le paramètre de route `countryName`.
- Charge le pays correspondant via DataService.
- Transmet l’objet Olympic au CountryCardComponent.
- Ne calcule plus les statistiques et n’affiche plus de graphique.

### CountryCardComponent (components/country-card/)
- Affiche les informations détaillées du pays.
- Calcule les indicateurs : médailles, athlètes, participations.
- Affiche le graphique d’évolution des médailles.
- Reçoit la donnée via : `@Input() country?: Olympic`.

### NotFoundComponent (pages/not-found/)
- Affiché pour les routes invalides.

---

## 3. DataService

Fichier : `src/app/services/data.service.ts`

Rôle :
- Centralise l’accès aux données.
- Charge les données depuis le mock JSON `assets/mock/olympic.json`.
- Fournit des méthodes typées :
  - `getOlympics(): Observable<Olympic[]>`
  - `getCountryByName(name: string): Observable<Olympic | undefined>`
- Est instancié comme Singleton grâce à `providedIn: 'root'`.

Ce service remplace tous les appels HTTP auparavant présents dans les composants.

---

## 4. Modèles TypeScript

### Olympic
- id: number
- country: string
- participations: Participation[]

### Participation
- id: number
- year: number
- city: string
- medalsCount: number
- athleteCount: number

Ces interfaces permettent un typage strict et remplacent l’usage du type `any`.

---

## 5. Préparation à une future API

L’architecture a été pensée pour faciliter la transition vers un back-end réel :

- Les composants ne dépendent plus de l’origine des données.
- Seul DataService devra être modifié pour appeler une API REST.
- Les modèles garantissent la cohérence des données.
- Aucun changement dans les composants ne sera nécessaire pour connecter une API.

---

## 6. Conclusion

L’architecture obtenue est :

- modulaire et facile à comprendre,
- respectueuse des bonnes pratiques Angular,
- basée sur une séparation claire (pages / composants / services / modèles),
- plus simple à maintenir,
- prête pour une évolution vers une API back-end.

Elle constitue une base solide pour la suite du développement du projet TéléSport.


