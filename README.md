# Hackathon_Bdx_Metropole

Application web de visualisation cartographique et de simulation de résilience urbaine pour Bordeaux Métropole.

Le projet est composé de deux applications distinctes :

- `Backend/` : API Express + Prisma + PostgreSQL
- `Frontend/` : application Next.js

Le backend synchronise les données cartographiques depuis DataHub vers PostgreSQL, puis sert les couches GeoJSON à l'application frontend.

**Prérequis**

- Node.js 20+
- npm 10+
- PostgreSQL 16+ ou compatible PostgreSQL 14+

**Architecture locale**

- Frontend : `http://localhost:3000`
- Backend : `http://localhost:3001`
- Base PostgreSQL : par défaut `localhost:5432`

Le frontend utilise un rewrite Next.js pour proxyfier les appels `/api/*` vers le backend sur le port `3001`.

**1. Cloner le projet**

```bash
git clone <url-du-repo>
cd Hackathon_Bdx_Metropole
```

**2. Installer PostgreSQL et créer la base**

Exemple Ubuntu/Debian :

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo service postgresql start
```

Créer la base et définir un mot de passe pour l'utilisateur `postgres` :

```bash
sudo -u postgres psql
ALTER USER postgres WITH PASSWORD 'postgres';
CREATE DATABASE hackathon;
\q
```

Si PostgreSQL écoute sur un autre port que `5432`, adapte `DATABASE_URL` en conséquence.

**3. Installer les dépendances npm**

```bash
cd Backend && npm install
cd ../Frontend && npm install
cd ..
```

**4. Créer les fichiers d'environnement**

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

**5. Générer Prisma et appliquer les migrations**

La base est pilotée par le schéma Prisma du backend.

```bash
cd Backend
npm run db:generate
npm run db:migrate
```

Important : le frontend embarque aussi un client Prisma pour certaines routes Next API, mais pour un démarrage standard de l'application il n'est pas nécessaire d'exécuter `db:migrate` côté frontend.

**6. Importer les données cartographiques**

```bash
cd Backend
npm run import:data
```

Cette commande :

- récupère les datasets DataHub
- remplit PostgreSQL
- calcule les bornes spatiales utilisées pour le chargement par emprise carte

Selon la connexion réseau, l'import peut prendre plusieurs minutes.

**7. Lancer l'application en local**

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

**Commandes utiles**

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

**Vérifications rapides**

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

**En cas de problème**

- Si le backend ne démarre pas, vérifier que PostgreSQL est lancé :

```bash
sudo service postgresql status
```

- Si le port PostgreSQL n'est pas `5432`, vérifier avec :

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

**État actuel des données importées**

À la date actuelle, l'import remonte environ :

- `96844` zones d'îlots de chaleur/fraicheur
- `11056` zones de végétation
- `301` fontaines

Un léger écart d'une unité par rapport aux chiffres Open Data peut arriver si un enregistrement ne contient pas de géométrie exploitable.

**Remarques sur le rendu cartographique**

- Le frontend charge les couches végétation et chaleur par emprise visible (`bbox`) et selon le niveau de zoom.
- À faible zoom, l'affichage est volontairement simplifié pour conserver une navigation fluide.
- À fort zoom, plus de géométries détaillées sont affichées.
