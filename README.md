# Hackathon_Bdx_Metropole
Hackathon Bordeaux Métropole – Simulation interactive de résilience urbaine : application web interactive permettant de visualiser les îlots de chaleur à Bordeaux et de simuler l’impact d’actions citoyennes (végétalisation, accès à l’eau) sur le confort thermique urbain.

---
## 1. Contexte
**Hackathon Bordeaux Métropole – Simulation interactive de résilience urbaine**

Application web interactive permettant de visualiser les îlots de chaleur à Bordeaux et de simuler l’impact d’actions citoyennes (végétalisation, accès à l’eau) sur le confort thermique urbain.

---
## 2. Objectif du projet
Ce projet vise à **transformer des données territoriales en une expérience interactive** permettant :
- de visualiser les îlots de chaleur et de fraîcheur à Bordeaux
- de comprendre les facteurs qui influencent le confort thermique urbain
- de simuler l’impact d’actions d’aménagement (arbres, fontaines, ...)
- d’impliquer les citoyens dans une réflexion collective autour de la résilience urbaine

L’utilisateur peut également interagir avec une carte virtuelle collaborative de Bordeaux en :
- plantant virtuellement des arbres
- installant des fontaines d’eau potable

Ces actions alimentent une simulation collective permettant de **visualiser un impact hypothétique sur le confort thermique**.

---
## 3. Utilisation des données
Le projet s’appuie sur plusieurs jeux de données open data :
- îlots de chaleur / fraîcheur
- patrimoine arboré
- fontaines publiques
- vulnérabilité à la chaleur

Ces données sont visualisables sur une carte et agrégées dans une grille spatiale (hexagonale ou pixellisée) afin de :

- créer une lecture simplifiée du territoire  
- permettre la simulation d’actions localisées  
- générer de nouveaux indicateurs (confort thermique, priorité d’intervention, etc.)  

---
## 4. Concept de l’application
L’application se structure autour de **deux vues complémentaires** :

### 4.1. Carte réelle (exploration des données)
Une carte interactive de Bordeaux permet de visualiser les données réelles du territoire :
- îlots de chaleur et de fraîcheur  
- délimitations des parcs et espaces verts  
- localisation des fontaines d’eau potable  
- grille hexagonale indiquant le nombre d’arbres par zone  

Cette vue permet à l’utilisateur de **comprendre l’état actuel du territoire** et d’identifier les zones critiques.

### 4.2. Carte simulée (interaction et projection)
Une seconde carte, basée sur une représentation pixellisée de Bordeaux, permet à l’utilisateur d’interagir :
- planter des arbres  
- installer des fontaines  

Ces actions alimentent une **simulation collective** où les données évoluent progressivement.

L’utilisateur peut ainsi observer :
- l’amélioration progressive du confort thermique  
- la réduction hypothétique des îlots de chaleur  
- l’impact cumulé des actions des utilisateurs  

---
## 5. Flow de l’application

### Parcours principal utilisateur

1. L’utilisateur arrive sur l’application
2. Il accède à la **carte réelle**
3. Il explore les données :
   - zones chaudes / fraîches
   - présence d’arbres
   - fontaines disponibles
4. Il identifie une zone d’intérêt

---

5. L’utilisateur bascule sur la **carte simulée**
6. Il sélectionne une zone (pixel / cellule)
7. Il effectue une action :
   - planter un arbre
   - installer une fontaine

---

8. Les données de la zone sont mises à jour  
9. La simulation recalculée affiche :
   - une évolution du niveau thermique
   - un indicateur d’amélioration

---

10. L’utilisateur observe :
   - l’impact local de son action
   - l’impact global (effet collectif)
   - les zones les plus améliorées

---
## 6. Fonctionnalités principales
- Visualisation des données réelles du territoire  
- Superposition de couches (îlots, arbres, fontaines, parcs)  
- Carte interactive pixellisée  
- Actions utilisateur (plantation, installation)  
- Simulation collective et évolutive  
- Comparaison implicite entre état réel et état simulé  
- Identification des zones prioritaires  

---
## 7. Approche
Le projet adopte une approche :
- **data-driven** : les simulations reposent sur des données réelles  
- **pédagogique** : simplifier la compréhension des enjeux climatiques  
- **interactive** : impliquer l’utilisateur dans les décisions  
- **collective** : valoriser l’impact des actions cumulées  

---
## 8. Limites
Les résultats proposés sont des **simulations simplifiées** basées sur des ordres de grandeur, et ne constituent pas des prédictions physiques exactes.

---
## 9. Objectif hackathon
Prototyper une solution permettant de :
- valoriser les données territoriales  
- simuler des actions d’adaptation climatique  
- sensibiliser aux enjeux de résilience urbaine  
- proposer une expérience interactive et engageante  

---
## 10. Stack technique
- Frontend : Next.js
- Backend : Express.js
- ORM : Prisma
- Base de données : PostgreSQL
- Cartographie : Leaflet
- Traitement et exposition des données : API GeoJSON + synchronisation DataHub
- Données :
  - [DataHUB - Ilot de chaleur ou de fraicheur urbain](https://datahub.bordeaux-metropole.fr/explore/dataset/ri_icu_ifu_s/information/?disjunctive.insee&disjunctive.dimension)
  - [DataHUB - Végétation urbaine de Bordeaux Métropole](https://datahub.bordeaux-metropole.fr/explore/dataset/met_vegetation_urbaine/information/?disjunctive.insee&disjunctive.nom)
  - [DataHUB - Fontaines d'eau potable de la ville de Bordeaux](https://datahub.bordeaux-metropole.fr/explore/dataset/bor_fontaines_eau_potable/information/?disjunctive.etat&disjunctive.modele_fontaine)
  - [DataHUB - Fontaines d'eau potable de la ville de Mérignac](https://datahub.bordeaux-metropole.fr/explore/dataset/mer_points-d-eau-potable/information/)
  - [DataHUB - Fontaines d'eau potable de la ville de Talence](https://datahub.bordeaux-metropole.fr/explore/dataset/tal_pointseaulibreacces/api/?location=13,44.80894,-0.5712&basemap=jawg.streets)
  - [DataHUB - Indice de confort thermique urbain](https://datahub.bordeaux-metropole.fr/explore/dataset/ri_ictu_s/information/)
 
---
## 11. Mise en place technique et lancement du projet

Application web de visualisation cartographique et de simulation de résilience urbaine pour Bordeaux Métropole.

Le projet est composé de deux applications distinctes :

- `Backend/` : API Express + Prisma + PostgreSQL
- `Frontend/` : application Next.js

Le backend synchronise les données cartographiques depuis DataHub vers PostgreSQL, puis sert les couches GeoJSON à l’application frontend.

**Prérequis**

- Node.js 20+
- npm 10+
- PostgreSQL 16+ ou compatible PostgreSQL 14+

**Architecture locale**

- Frontend : `http://localhost:3000`
- Backend : `http://localhost:3001`
- Base PostgreSQL : par défaut `localhost:5432`

Le frontend utilise un rewrite Next.js pour proxyfier les appels `/api/*` vers le backend sur le port `3001`.

### 11.1. Cloner le projet

```bash
git clone <url-du-repo>
cd Hackathon_Bdx_Metropole
```

### 11.2. Installer PostgreSQL et créer la base

Exemple Ubuntu/Debian :

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo service postgresql start
```

Créer la base et définir un mot de passe pour l’utilisateur `postgres` :

```bash
sudo -u postgres psql
ALTER USER postgres WITH PASSWORD 'postgres';
CREATE DATABASE hackathon;
\q
```

Si PostgreSQL écoute sur un autre port que `5432`, adapte `DATABASE_URL` en conséquence.

### 11.3. Installer les dépendances npm

```bash
cd Backend && npm install
cd ../Frontend && npm install
cd ..
```

Note : après un `git pull`, si `package.json` ou `package-lock.json` a changé, relancer `npm install` dans le dossier concerné.

Important : après un `git pull`, si `package.json` ou `package-lock.json` a changé (Backend ou Frontend), relancer `npm install` dans le dossier concerné.
Sinon, une erreur du type `Cannot find module ...` peut apparaître au démarrage.

### 11.4. Créer les fichiers d’environnement

Backend :

```bash
cp Backend/.env.example Backend/.env
```

Frontend :

```bash
cp Frontend/.env.example Frontend/.env
```

Valeur par défaut attendue :

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/hackathon"
```

Si ta base écoute sur `5433`, remplace simplement `5432` par `5433` dans les deux fichiers.

### 11.5. Générer Prisma et appliquer les migrations

La base est pilotée par le schéma Prisma du backend.

```bash
cd Backend
npm run db:generate
npm run db:migrate
```

Important : le frontend embarque aussi un client Prisma pour certaines routes Next API, mais pour un démarrage standard de l’application il n’est pas nécessaire d’exécuter `db:migrate` côté frontend.

### 11.6. Importer les données cartographiques

```bash
cd Backend
npm run import:data
```

Cette commande :

- récupère les datasets DataHub
- remplit PostgreSQL
- calcule les bornes spatiales utilisées pour le chargement par emprise carte

Selon la connexion réseau, l’import peut prendre plusieurs minutes.

### 11.7. Lancer l’application en local

Ouvrir deux terminaux.

Terminal 1, backend :

```bash
cd Hackathon_Bdx_Metropole/Backend
npm run dev
```

Terminal 2, frontend :

```bash
cd Hackathon_Bdx_Metropole/Frontend
npm run dev
```

Puis ouvrir :

```text
http://localhost:3000
```

### 11.8. Commandes utiles

Backend :

```bash
cd Backend
npm run dev
npm run build
npm run db:generate
npm run db:migrate
npm run import:data
```

Frontend :

```bash
cd Frontend
npm run dev
npm run build
npm run start
```

### 11.9. Vérifications rapides

Santé du backend :

```bash
curl http://localhost:3001/health
```

Statut de synchronisation :

```bash
curl http://localhost:3001/api/heatmap/sync/status
```

Compter les données importées :

```bash
psql "postgresql://postgres:postgres@localhost:5432/hackathon" -c "SELECT COUNT(*) AS source_count FROM \"HeatSourceFeature\"; SELECT COUNT(*) AS veg_count FROM \"VegetationFeature\"; SELECT COUNT(*) AS fountain_count FROM \"FountainFeature\";"
```

### 11.10. En cas de problème

- Si le backend ne démarre pas, vérifier que PostgreSQL est lancé :

```bash
sudo service postgresql status
```

- Si le port PostgreSQL n’est pas `5432`, vérifier avec :

```bash
sudo ss -tlnp | grep postgres
```

- Si le frontend ne reflète pas les derniers changements :

```bash
cd Frontend
rm -rf .next
npm run dev
```

- Si le port `3000` ou `3001` est occupé :

```bash
fuser -k 3000/tcp 3001/tcp
```

### 11.11. État actuel des données importées

À la date actuelle, l’import remonte environ :

- `96844` zones d’îlots de chaleur/fraîcheur
- `11056` zones de végétation
- `301` fontaines

Un léger écart d’une unité par rapport aux chiffres Open Data peut arriver si un enregistrement ne contient pas de géométrie exploitable.

### 11.12. Remarques sur le rendu cartographique

- Le frontend charge les couches végétation et chaleur par emprise visible (`bbox`) et selon le niveau de zoom.
- À faible zoom, l’affichage est volontairement simplifié pour conserver une navigation fluide.
- À fort zoom, plus de géométries détaillées sont affichées.

---
## 12. Auteurs
- Félix Besançon
- Ilan Cornibé
- Laëtitia Grondin
- Frédéric Iglesias Montero
