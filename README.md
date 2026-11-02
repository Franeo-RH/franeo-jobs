# FRANEO JOBS

Application de recrutement de FRANEO RH, construite comme les applications Formation et Optimz (même logique, même mise en page, couleur **violet**).

Trois accès :

| Accès | Pour qui | Adresse |
|---|---|---|
| **Candidat** (ouvert 24 h/24, avec votre espace candidat) | Toute personne qui veut postuler ou déposer son CV | `/offres`, `/candidature-spontanee` |
| **Espace candidat** (obligatoire pour postuler) | Le candidat suit ses candidatures, voit où son CV est envoyé, ses résultats, et modifie ses infos | `/espace-candidat` puis `/candidat` |
| **Client** | Les entreprises qui reçoivent les CV et donnent leur retour | `/login` puis `/client/dashboard` |
| **Admin** | L'équipe FRANEO RH : tout gérer | `/login` puis `/admin/dashboard` |

La page de connexion propose aussi **« Tester la démo client »** (faux client, candidats fictifs, remise à zéro chaque nuit).

## Ce que fait l'application

- **Candidat** : offres publiques avec filtres, candidature avec CV (PDF/Word, 5 Mo), consentement RGPD, questionnaire de présélection adapté au métier (technique + logique et raisonnement + mises en situation), dépôt de CV spontané. Les offres se consultent librement ; pour postuler, le candidat se connecte à son espace (création gratuite, activée par e-mail).
- **Admin** : dashboard et indicateurs stratégiques, clients (avec création des accès), missions, pipeline en colonnes (Nouveau → … → Embauché), matching candidats/missions (métier 30 %, compétences 25 %, géographie 15 %, salaire 15 %, disponibilité 15 %), offres (brouillon/publiée/suspendue/pourvue/archivée, multi-sourcing), questionnaires, CVthèque et vivier (8 statuts, 10 métiers, filtres, export), fiche candidat (entretien noté, journal des actions, résultats du test, CV), présentations avec **contrôle anti-doublon**, **registre anti-litiges** (envoi, ouverture de l'e-mail, consultation, téléchargement du CV, réponse), facturation (honoraires et fin de garantie), relances automatiques J+7 / J+30 / J+90, RGPD (effacement après 24 mois), équipe, demandes d'accès, démo.
- **Client** : dashboard, missions, candidats présentés, dossier complet avec CV, retour en un clic (**Retenu / À revoir / Refusé**, motif, commentaire), échanges avec FRANEO RH, export Excel. Les coordonnées du candidat sont communiquées quand le client le retient.
- **Exports Excel** sur toutes les listes (bouton vert).
- **Application installable** (PWA) sur téléphone et ordinateur, thème clair/sombre.

---

## Mise en ligne, pas à pas

### 1. Mettre le code sur GitHub
1. Sur github.com, dans l'organisation **Franeo-RH**, créez un dépôt privé nommé `Franeo-Jobs`.
2. Envoyez-y le contenu de ce dossier (glisser-déposer sur la page du dépôt, ou `git push`).

### 2. Créer la base de données (Neon)
1. Sur neon.tech, créez un projet **franeo-jobs**.
2. Copiez la **Connection string** (elle commence par `postgresql://`). C'est votre `DATABASE_URL`.

### 3. Préparer votre ordinateur (une seule fois)
```bash
cp .env.example .env        # puis ouvrez .env et remplissez-le (voir tableau plus bas)
npm install
npx prisma db push          # crée les tables dans Neon
npx prisma db seed          # crée votre compte administrateur (ADMIN_EMAIL / ADMIN_PASSWORD)
npm run dev                 # http://localhost:3000
```
Connectez-vous sur `/login` avec l'e-mail et le mot de passe d'ADMIN_EMAIL / ADMIN_PASSWORD, puis changez le mot de passe dans **Paramètres → Mon compte**.

### 4. Verrouiller le registre anti-litiges (recommandé)
Dans Neon → **SQL Editor**, collez le contenu du fichier `prisma/protection-registre.sql` et exécutez-le. Dès lors, même un accès direct à la base ne permet plus de modifier ni supprimer une ligne du registre (seule la démo peut être remise à zéro).

### 5. Déployer sur Vercel
1. Sur vercel.com : **Add New → Project**, choisissez le dépôt `Franeo-Jobs`.
2. Dans **Environment Variables**, ajoutez les variables du tableau ci-dessous.
3. Cliquez **Deploy**. Les tâches automatiques (remise à zéro de la démo à 2 h, relances à 7 h) sont déjà déclarées dans `vercel.json`.

### 6. Adresse jobs.franeo-rh.com
1. Vercel → votre projet → **Settings → Domains** → ajoutez `jobs.franeo-rh.com`.
2. Chez Wix (gestion DNS du domaine franeo-rh.com), ajoutez un enregistrement **CNAME** : nom `jobs`, valeur `cname.vercel-dns.com`.
3. Mettez `APP_URL=https://jobs.franeo-rh.com` dans les variables Vercel, puis redéployez.

### 7. E-mails (Resend)
Créez un compte sur resend.com, vérifiez le domaine franeo-rh.com, créez une clé API et renseignez `RESEND_API_KEY` et `MAIL_FROM`. Sans clé, tout fonctionne mais aucun e-mail ne part (confirmations de candidature, présentations aux clients, relances, alertes).

### 8. Stockage des CV : OVHcloud (données en France)
Sans réglage, les CV sont rangés dans la base Neon (offre gratuite limitée à 0,5 Go). Pour les ranger chez OVHcloud (quelques centimes par mois) :
1. ovhcloud.com → espace client → **Public Cloud** → créer un projet.
2. **Object Storage** → **Créer un conteneur** → **Standard (API S3)**, région **Gravelines (GRA)** ou **Paris**, nom `franeo-jobs-cv`, accès **privé**.
3. **Utilisateurs S3** → créer un utilisateur (rôle **ObjectStore operator**) → noter la clé d'accès et la clé secrète.
4. Renseigner dans `.env` et dans Vercel : `S3_ENDPOINT`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET`.
5. Admin → Paramètres → **Stockage des CV** → **Tester la connexion**, puis déplacer les CV existants.

Le code fonctionne aussi avec tout autre hébergeur compatible S3 (Scaleway, Cloudflare R2…) en changeant seulement ces variables.

## Variables d'environnement

| Variable | Rôle |
|---|---|
| `DATABASE_URL` | Connexion Neon |
| `APP_URL` | Adresse publique (liens dans les e-mails) |
| `RESEND_API_KEY` | Envoi des e-mails (facultatif au début) |
| `MAIL_FROM` | Expéditeur, ex. `Franeo Jobs <jobs@franeo-rh.com>` |
| `MAIL_ADMIN` | Où arrivent les alertes (nouvelles candidatures, retours clients) |
| `CRON_SECRET` | Mot de passe long et aléatoire qui protège les tâches automatiques |
| `S3_ENDPOINT`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET` | Stockage des CV chez OVHcloud ou autre hébergeur S3 (facultatif) |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Premier compte admin (utilisés par `npx prisma db seed`) |

## Premiers pas conseillés
1. **Paramètres → Démo** : vérifiez la démo, puis testez-la depuis `/login`.
2. **Clients → Ajouter un client**, puis créez l'accès de son contact sur sa fiche.
3. **Missions → Nouvelle mission**, puis **Créer l'offre** : publiez-la, elle apparaît sur `/offres`.
4. Postulez vous-même depuis `/offres` pour voir le parcours candidat.
5. **Présentations → Présenter un candidat** : le client reçoit un e-mail et voit le dossier dans son espace.

## Pour les développeurs
Next.js 16 (App Router), React 19, TypeScript, Tailwind v4, Prisma 5 + PostgreSQL, bcryptjs, Resend, xlsx. Mutations par actions serveur (`lib/actions/*`). Les bonnes réponses des questionnaires ne quittent jamais le serveur (`lib/questionnaires.ts`). Les données de démo sont exclues de toutes les listes, statistiques et exports de l'équipe.

## Lancer en local sur Mac (le plus simple)
1. Dézippez le dossier sur le Bureau.
2. Installez Node.js (version LTS) depuis nodejs.org si ce n'est pas déjà fait.
3. Double-cliquez sur **`demarrer-local.command`** (la première fois : clic droit > Ouvrir, puis confirmer).
4. Collez l'adresse Neon (`DATABASE_URL`), choisissez e-mail et mot de passe admin : tout le reste est automatique.
5. L'application s'ouvre sur http://localhost:3000/login. Les fois suivantes : même double-clic.
