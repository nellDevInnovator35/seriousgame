# 🏘️ SmartCity ANC — Serious Game Premier Tech Eau

> Jeu de simulation de type SmartCity appliqué au marché de l'**Assainissement Non Collectif** (ANC).
> Conçu pour les équipiers Premier Tech afin de comprendre les enjeux de chaque service, du client jusqu'à la production.

![Stack](https://img.shields.io/badge/React-18-blue) ![Stack](https://img.shields.io/badge/Node.js-20-green) ![Stack](https://img.shields.io/badge/Docker-ready-blue) ![License](https://img.shields.io/badge/Usage-interne%20PT-orange)

---

## 🎯 Objectif pédagogique

Le joueur gère la **chaîne complète** de l'ANC sur un territoire de 2 communes rurales pendant **11 ans** :

- Produire des fosses septiques (Ecoflo & Eparco)
- Gérer les stocks et la logistique
- Vendre via 2 circuits de distribution (Point Service / Distributeur) **et arbitrer entre eux**
- Satisfaire les clients dans les délais
- Réagir aux événements imprévus (fuites, fermeture usine, concurrence)
- Assurer la maintenance des installations
- **Piloter la rentabilité** : l'EBITDA réel = chiffre d'affaires − coûts

**À la fin de la partie**, un écran de résultats analyse les forces et faiblesses du joueur, avec des courbes d'évolution et des messages pédagogiques liés à chaque service de Premier Tech.

Une partie dure **5 à 15 minutes** selon la vitesse choisie.

---

## 🗺️ Le terrain de jeu

```
┌──────── COMMUNE A (10 km) ────────┐┌──────── COMMUNE B (10 km) ────────┐
│  🏠🏠  🌳🏠                       ││     🏠🏠🏠                        │
│     🏠    🏠🏠                     ││  🏠        🏠                     │
│  🏪 Point Service (Eparco)        ││          🏠   🏠                  │
│  🏠🏠       🏠                     ││  🏠  🏠                          │
│      📦 Distributeur A (2km)      ││       📦 Distributeur B (2km)    │
│  🏠    🏠  ⛰️ 🏠                  ││  🏠🏠     🌳🏠                   │
└────────────────────────────────────┘└────────────────────────────────────┘

                        🏭 Usine PT (hors communes)
```

- **Jusqu'à 200 maisons** sur le territoire. **≈12 sont en demande au départ** ; le reste du parc existant émerge progressivement (contrôles SPANC étalés), au rythme de **1 à 3 nouvelles demandes par mois**. La demande reste donc active jusque vers la fin de partie.
- **1 Point Service** (vente directe Eparco) dans la commune A
- **2 Distributeurs** placés aléatoirement avec une sphère d'influence de 2 km
- **1 Usine** Premier Tech hors des communes

---

## 🔄 Les deux circuits de vente — un vrai choix

Quand un distributeur est à portée d'une maison, le joueur **choisit lui-même** le circuit. Sinon, seul le Point Service est possible. Sur un terrain inadapté à l'épandage, seul l'Ecoflo (filtre compact) convient.

### 🏪 Circuit Point Service → Eparco (vente directe)
```
🏭 Usine PT ──→ 🏪 Point Service ──(1 install/jour)──→ 🏠 Client
                Vend + distribue + installe
                Prix : 2000 € tout compris
                + Marge la plus élevée · 🔧 maintenance incluse
                ⏱ Délai devis → vente : 2 semaines, pose limitée
```

### 📦 Circuit Distributeur → Ecoflo (vente indirecte)
```
🏭 Usine PT ──→ 📦 Distributeur ──→ 🔧 Installateur ──→ 🏠 Client
                Prix : 1000 €
                + Rapide (sans délai devis) · fidélise le distributeur · 🔧 maintenance incluse
                − Marge plus faible
                ⚠️ Si ses ventes PT < 20 % → il passe au concurrent !
```

**L'arbitrage** : le Point Service maximise la marge unitaire mais il est lent (délai + 1 pose/jour) ; le distributeur écoule vite et le garde fidèle, au prix d'une marge plus faible. Les deux circuits posent **notre marque** et incluent donc la maintenance.

---

## 🎮 Comment jouer

### Démarrage
1. Lancer l'application (voir Installation ci-dessous)
2. Choisir un **niveau de difficulté** (Facile / Normal / Expert) puis cliquer sur **Nouvelle partie**
3. La carte s'affiche avec **≈12 maisons en jaune** (besoin d'une installation ANC)

Un **tutoriel** s'affiche au lancement (passable, et rouvrable via le bouton **?**).

### Actions du joueur
| Action | Comment | Effet |
|--------|---------|-------|
| **Proposer un devis** | Cliquer sur une maison jaune 🟡 | Ouvre le panneau devis : choix du circuit (Point Service / Distributeur selon la zone) |
| **Planifier la production** | Cocher Ecoflo/Eparco dans le panneau Production | L'usine produit pendant la semaine (non modifiable en cours de semaine) |
| **Expédier un produit** | Cliquer "Expédier" sur une commande en attente | Un camion part de l'usine (trajet = 1 jour) |
| **Résoudre une fuite** | Cliquer sur une maison rouge 🔴 → "Intervenir" | Doit être fait sous 2 jours sinon client mécontent |
| **Effectuer la maintenance** | Cliquer sur une maison avec 🔧 → "Effectuer" | Visite tous les 2 ans sur les installations PT |
| **Contrôler le temps** | Play/Pause + vitesse x1 à x3 | Partie complète en ~15 min (x1), ~7,5 min (x2), ~5 min (x3) |

### Règles clés
- ⏱️ **Livraison > 20 jours** → avis négatif → les 5 voisins les plus proches commandent chez le concurrent
- 📦 **Stock maximum** : 100 produits à l'usine — attention, **surproduire un produit invendu sature le stock, bloque la production de l'autre et pèse sur l'EBITDA**
- 🏭 **Production** : Ecoflo 1/jour, Eparco 2/jour (jours ouvrés uniquement)
- 📉 **Distributeur** : si ses ventes PT passent sous 20 %, il bascule chez le concurrent
- 🌳 **5 % des terrains** sont problématiques → seul l'Ecoflo (distributeur) convient
- 🔧 **Maintenance** : contrat sur toutes les installations PT (Point Service et distributeur), revenu annuel récurrent mais visites à assurer

### Événements aléatoires
| Événement | Effet | Contrainte |
|-----------|-------|------------|
| 💧 **Fuite / inondation** | Une installation fuit | Intervenir sous 2 jours |
| 🏭 **Fermeture usine** | Plus aucune production | Pendant 20 jours |
| ⚔️ **Concurrent casse les prix** | Les prospects de la **zone d'influence d'un distributeur (~30 maisons)** partent chez lui. La zone est **mise en évidence en rouge** sur la carte. | Pendant 6 mois |

### Score
- **Score principal** : **EBITDA réel = CA − coûts** (production, logistique, maintenance, frais fixes)
- **Note** : A+ à E selon l'EBITDA final
- **KPIs suivis** : CA, EBITDA & marge, Satisfaction client, Délai moyen, Part de marché PT, Stock, Revenus maintenance, **CA capté par le concurrent**
- **Courbes d'évolution** : CA, EBITDA, satisfaction et part de marché dans le temps
- **Mode débrief animateur** : points de discussion par service + **export PDF** des résultats

---

## 📊 Tableau de bord (en temps réel)

| KPI | Description |
|-----|-------------|
| 💰 **CA** | Chiffre d'affaires cumulé |
| 📈 **EBITDA** | CA − coûts (score principal), avec la marge en % |
| 😊 **Satisfaction** | % de clients livrés dans les délais |
| 📊 **Part de marché** | % maisons équipées PT vs concurrent |
| ⏱️ **Délai moyen** | Jours entre la demande client et l'installation |
| 📦 **Stock** | Niveau de stock à l'usine (max 100) |
| 🏠 **Maisons équipées** | PT vs Concurrent |
| 🔧 **Maintenance** | Revenus des contrats de vérification |
| 🏴 **CA Concurrent** | Chiffre d'affaires capté par la concurrence |

---

## ⚙️ Page Administration

Tous les paramètres du jeu sont éditables depuis le panneau Admin (accessible depuis le menu ou pendant la partie) :

- **Production** : cadence Ecoflo/Eparco, stock max, jours ouvrés
- **Prix** : installation Eparco, vente Ecoflo, contrat maintenance, **CA concurrent / installation**
- **Coûts (EBITDA réel)** : coût production Ecoflo & Eparco, coût par trajet, coût visite maintenance, frais fixes / an
- **Logistique** : durée trajet, installations/jour
- **Seuils** : délai max livraison, seuil switch concurrent, voisins impactés, délai devis, taux terrain problématique
- **Carte & Maisons** : parc existant, **maisons en demande au départ**, nouvelles maisons/mois, distributeurs, rayon d'influence
- **Événements** : durées des aléas, **taille de la zone d'influence** touchée par la guerre des prix, taux de capture
- **Scoring** : durée de la partie, intervalle de maintenance

---

## 🚀 Installation

### Prérequis
- [Node.js 20+](https://nodejs.org)
- (Optionnel) [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### Lancement en développement

```bash
# Terminal 1 — Backend
cd backend
npm install
npm run dev
# → Backend sur http://localhost:3001

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev
# → Jeu sur http://localhost:3000
```

### Lancement avec Docker

```bash
docker-compose up --build
# → Jeu sur http://localhost:3000
```

---

## 🛠️ Stack technique

| Couche | Technologie |
|--------|-------------|
| **Frontend** | React 18 + Vite |
| **Rendu carte** | Canvas 2D (vue isométrique) |
| **Graphiques** | SVG sans dépendance |
| **Backend** | Node.js + Express |
| **Stockage** | SQLite (sql.js, fichier local — sans compilation) |
| **Conteneurisation** | Docker + docker-compose |

### Architecture
```
smartcity-anc/
├── docker-compose.yml
├── backend/
│   └── src/
│       ├── index.js              # Serveur Express
│       ├── database.js           # Stockage SQLite (sql.js)
│       └── routes/
│           ├── game.js           # Save / Load / List
│           └── admin.js          # Paramètres
└── frontend/
    └── src/
        ├── App.jsx               # Application principale
        ├── App.css               # Styles (dark theme)
        ├── config/
        │   └── defaultParams.js  # Paramètres par défaut
        ├── api/
        │   └── gameApi.js        # Client API
        ├── engine/
        │   ├── MapGenerator.js   # Génération de la carte + helpers
        │   └── GameEngine.js     # Moteur de jeu (toutes les règles + EBITDA)
        └── components/
            ├── IsometricRenderer.js  # Rendu Canvas 2D
            ├── GameMap.jsx           # Carte interactive
            ├── Dashboard.jsx         # KPIs
            ├── TimeControl.jsx       # Contrôles du temps
            ├── ProductionPanel.jsx   # Planification production
            ├── DevisPanel.jsx        # Interaction maison + choix du circuit
            ├── EventPopup.jsx        # Événements aléatoires
            ├── EvolutionCharts.jsx   # Courbes d'évolution (débrief)
            ├── ScoreScreen.jsx       # Résultats fin de partie
            └── AdminPanel.jsx        # Paramètres éditables
```

---

## 🔮 Pistes d'amélioration

### 🎮 Gameplay

| # | Amélioration | Impact | Difficulté |
|---|-------------|--------|------------|
| 1 | **Mode multijoueur** — chaque joueur incarne un rôle (usine, point service, distributeur) pour ressentir les interdépendances | 🔥🔥🔥 | ⭐⭐⭐ |
| 2 | **Système de prix dynamique** — le joueur fixe ses prix et voit l'impact sur la demande (élasticité) | 🔥🔥 | ⭐⭐ |
| 3 | ✅ **Niveaux de difficulté** — facile (peu d'aléas, marché captif) → expert (concurrence agressive, réglementations) | 🔥🔥 | ⭐ |
| 4 | **Scénarios prédéfinis** — "Crise fournisseur", "Boom immobilier", "Nouvelle réglementation" avec objectifs spécifiques | 🔥🔥 | ⭐⭐ |
| 5 | ✅ **Tutoriel interactif** — guide pas-à-pas pour les 5 premières minutes de jeu | 🔥🔥 | ⭐ |
| 6 | **Système de quêtes/objectifs** — "Équiper 50 maisons en 2 ans", "Zéro avis négatif pendant 6 mois" | 🔥🔥 | ⭐⭐ |
| 7 | **Ajout du bureau d'études / prescripteur** — un acteur qui recommande tel ou tel produit selon les sols | 🔥 | ⭐⭐ |
| 31 | 🏗️ **Investir & placer des infrastructures** — ouvrir un 2ᵉ Point Service, acheter un camion, agrandir l'usine (CAPEX avec retour sur investissement) — *voir évaluation ci-dessous* | 🔥🔥🔥 | ⭐⭐ |

### 🏗️ Focus d'évaluation — Investir & placer des infrastructures

> Idée : transformer une partie de l'argent gagné en **décisions d'investissement** (CAPEX) plutôt qu'en simple score. C'est le levier le plus « SimCity » qui reste cohérent avec la pédagogie métier.

**Mécaniques proposées**

- **Ouvrir un 2ᵉ Point Service** (≈ 60 000 €) — le joueur le **place sur la carte** ; il double la capacité de pose (1 → 2 installs/jour) et raccourcit les délais dans sa zone. Décision de couverture territoriale.
- **Acheter un camion** (≈ 15 000 €) — permet plus d'expéditions simultanées / des tournées groupées ; baisse le risque de retard quand la demande grimpe.
- **Agrandir l'usine** (≈ 40 000 €) — augmente la cadence de production et/ou le stock max, pour soutenir la croissance.

**Apport pédagogique** — c'est le chaînon qui manque aujourd'hui : passer d'une logique purement **opérationnelle** à une logique **d'investissement**. Le joueur doit arbitrer CAPEX vs OPEX, calculer un **retour sur investissement** (un 2ᵉ Point Service ne se rentabilise que si la demande suit), et raisonner **couverture géographique** — ce qui redonne enfin du sens à la carte. Très aligné avec un public Premier Tech (décisions de capacité et d'implantation réelles).

**Impact : 🔥🔥🔥** — ajoute de l'agentivité, de la rejouabilité et fait « compter la carte » ; comble le principal écart avec un vrai jeu de gestion.

**Difficulté : ⭐⭐ (modérée)** — l'essentiel des briques existe déjà :
- un poste de dépense est facile à brancher sur l'EBITDA (déjà calculé en CA − coûts) ;
- `installsPerDay`, `tripDuration`/nombre de camions, `ecofloPerDay`/`maxStock` sont **déjà des paramètres** : il suffit de les rendre **évolutifs en cours de partie** ;
- le placement d'un Point Service réutilise la logique de zone déjà écrite (sphères d'influence, plus proches voisins).

**Points d'attention**

- **Équilibrage** : un coût d'investissement trop bas casse la tension (on achète tout) ; trop haut, personne n'investit. À calibrer pour qu'un investissement bien placé soit gagnant et un investissement prématuré pénalisant.
- **UI** : prévoir un panneau « Investir » (budget, ROI estimé) et un mode placement sur la carte.
- **Garde-fou** : limiter le nombre d'achats pour éviter une partie « tout-en-capacité » sans risque.

**Estimation** : ~1 à 1,5 jour de dev. Bon candidat pour la prochaine itération, idéalement couplé au **#2 prix dynamique** ou au **#6 quêtes** pour donner des objectifs d'investissement.

### 📊 Données & Analytics

| # | Amélioration | Impact | Difficulté |
|---|-------------|--------|------------|
| 8 | ✅ **Graphiques d'évolution** — courbes CA, EBITDA, satisfaction, part de marché dans le temps *(fait, en SVG)* | 🔥🔥 | ⭐ |
| 9 | **Replay de la partie** — revoir les décisions clés et leurs conséquences | 🔥🔥 | ⭐⭐⭐ |
| 10 | **Leaderboard** — classement entre équipiers, comparaison des scores | 🔥🔥🔥 | ⭐⭐ |
| 11 | ✅ **Export des résultats en PDF** — pour débrief en réunion d'équipe | 🔥 | ⭐⭐ |

### 🎨 Visuel & UX

| # | Amélioration | Impact | Difficulté |
|---|-------------|--------|------------|
| 12 | **Sprites isométriques** — remplacer les rectangles par de vrais dessins (maisons, camions, usine) | 🔥🔥🔥 | ⭐⭐ |
| 13 | **Animations camions** — trajet fluide sur la carte avec particules | 🔥🔥 | ⭐⭐ |
| 14 | **Sons & musique** — ambiance, notifications sonores pour les événements | 🔥 | ⭐ |
| 15 | **Vue satellite** — basculer entre vue isométrique et vue satellite (Leaflet / Mapbox) | 🔥 | ⭐⭐⭐ |
| 16 | **Responsive mobile** — jouer sur tablette pendant un atelier de formation | 🔥🔥 | ⭐⭐ |

### 🏢 Métier & Pédagogie

| # | Amélioration | Impact | Difficulté |
|---|-------------|--------|------------|
| 17 | **Conformité SPANC** — ajouter les contrôles réglementaires comme contrainte de jeu | 🔥🔥 | ⭐⭐ |
| 18 | **Impact environnemental** — score vert basé sur la qualité d'épuration, pollution des nappes | 🔥🔥 | ⭐⭐ |
| 19 | ✅ **Fiches métier** — en cliquant sur un service (usine, point service...) on voit une fiche explicative du vrai métier chez PT | 🔥🔥🔥 | ⭐ |
| 20 | ✅ **Mode débrief animateur** — un mode spécial pour l'animateur de formation avec les points de discussion | 🔥🔥 | ⭐⭐ |
| 21 | **Carte réelle** — utiliser une vraie carte de commune où PT opère, avec des données réalistes | 🔥🔥 | ⭐⭐⭐ |

### 🔧 Technique

| # | Amélioration | Impact | Difficulté |
|---|-------------|--------|------------|
| 22 | ✅ **Base de données SQLite** — stockage via sql.js (sans compilation), migration auto depuis l'ancien JSON *(fait)* | 🔥 | ⭐ |
| 23 | **Tests unitaires** — tester le moteur de jeu (Jest / Vitest) | 🔥🔥 | ⭐⭐ |
| 24 | ✅ **PWA** — installer le jeu comme une app sur le bureau / tablette | 🔥 | ⭐ |
| 25 | **CI/CD** — déploiement automatique sur push Git | 🔥 | ⭐⭐ |
| 26 | **i18n** — support français / anglais pour les équipiers hors Québec | 🔥 | ⭐⭐ |

### 🚀 Vision long terme

| # | Amélioration | Impact | Difficulté |
|---|-------------|--------|------------|
| 27 | **IA adversaire** — un concurrent intelligent qui adapte sa stratégie aux actions du joueur | 🔥🔥🔥 | ⭐⭐⭐ |
| 28 | **Marketplace de scénarios** — les équipiers créent et partagent leurs propres scénarios | 🔥🔥 | ⭐⭐⭐ |
| 29 | **Intégration données réelles** — connecter le jeu aux vrais KPIs de PT pour calibrer les paramètres | 🔥🔥🔥 | ⭐⭐⭐ |
| 30 | **Extension à d'autres BU** — adapter le concept SmartCity à d'autres divisions de Premier Tech | 🔥🔥🔥 | ⭐⭐⭐ |

---

## 👥 Crédits

- **Conception & développement** : Nell Pied — Analyste d'affaires, Production & Logistique
- **Entreprise** : Premier Tech Eau et Environnement
- **Année** : 2026

---

## 📄 Licence

Usage interne Premier Tech.
