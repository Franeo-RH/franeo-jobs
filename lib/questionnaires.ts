// lib/questionnaires.ts
// Questionnaires de présélection (côté serveur uniquement : les bonnes réponses ne quittent jamais le serveur).
// Chaque questionnaire contient : des questions techniques, des questions de logique et de raisonnement,
// puis des mises en situation (échelle de profil et réponse libre à relire par le consultant).

export type Question = {
  type: "qcm" | "echelle" | "libre";
  partie: "tech" | "logique" | "dominos" | "profil";
  dominos?: [number, number][]; // suite de dominos affichée (test de dominos) ; les options sont au format "haut|bas"
  axe: number;
  q: string;
  options?: string[];
  bonne?: number; // index de la bonne réponse (qcm)
};

export type Questionnaire = { cle: string; nom: string; dureeMin: number; axes: string[]; questions: Question[] };

// Raisonnement commun à tous les métiers (suites, déduction, proportions, lecture de consigne)
const LOGIQUE_COMMUNE: Omit<Question, "axe">[] = [
  { type: "qcm", partie: "logique", q: "Quelle valeur complète la suite : 2, 6, 18, 54, … ?", options: ["108", "162", "216", "270"], bonne: 1 },
  { type: "qcm", partie: "logique", q: "Tous les A sont des B. Certains B sont des C. Quelle conclusion est certaine ?", options: ["Tous les A sont des C", "Certains A sont des C", "Aucune conclusion certaine sur les A et les C", "Aucun A n'est un C"], bonne: 2 },
  { type: "qcm", partie: "logique", q: "5 machines fabriquent 5 pièces en 5 minutes. Combien de temps faut-il à 100 machines pour fabriquer 100 pièces ?", options: ["5 minutes", "20 minutes", "50 minutes", "100 minutes"], bonne: 0 },
  { type: "qcm", partie: "logique", q: "Quel nombre complète la suite : 3, 5, 9, 17, 33, … ?", options: ["49", "57", "65", "66"], bonne: 2 },
];

// Test de dominos (type D-48 / D-70) : trouver le domino qui complète la suite.
// Chaque moitié suit sa propre règle ; les valeurs vont de 0 à 6 et après 6 on revient à 0.
const d = (dominos: [number, number][], options: string[], bonne: number): Omit<Question, "axe"> => ({
  type: "qcm", partie: "dominos", q: "Quel domino complète la suite ?", dominos, options, bonne,
});
export const DOMINOS: Omit<Question, "axe">[] = [
  d([[1, 2], [2, 3], [3, 4]], ["5|4", "4|5", "4|4", "5|6"], 1),
  d([[0, 6], [1, 5], [2, 4]], ["3|4", "2|2", "3|3", "4|3"], 2),
  d([[2, 1], [4, 2], [6, 3]], ["1|4", "0|4", "6|4", "1|3"], 0),
  d([[6, 0], [4, 1], [2, 2]], ["1|3", "0|2", "3|0", "0|3"], 3),
  d([[5, 5], [3, 1], [5, 5], [3, 1]], ["3|1", "5|5", "1|3", "4|4"], 1),
  d([[1, 2], [2, 4], [3, 6]], ["4|0", "4|6", "4|1", "5|1"], 2),
  d([[3, 3], [4, 2], [5, 1]], ["0|6", "6|0", "6|1", "5|0"], 1),
  d([[0, 6], [3, 5], [6, 4]], ["3|2", "2|3", "1|3", "2|4"], 1),
];

type QTech = Omit<Question, "partie">;
type QLogique = Omit<Question, "axe">;

/**
 * Un questionnaire = 6 questions techniques, 6 de logique (4 communes + 2 propres au métier), 4 dominos,
 * 2 échelles de profil et 1 mise en situation en réponse libre (relue et notée par le consultant).
 */
function fabriquer(cle: string, nom: string, axes: string[], tech: QTech[], logiqueMetier: QLogique[], echelles: [number, string][], libre: [number, string]): Questionnaire {
  const axeLogique = axes.length; // dernier axe = logique et raisonnement
  const questions: Question[] = [
    ...tech.map((x) => ({ ...x, partie: "tech" as const })),
    ...[LOGIQUE_COMMUNE[0], LOGIQUE_COMMUNE[1], ...logiqueMetier, LOGIQUE_COMMUNE[2], LOGIQUE_COMMUNE[3]].map((l) => ({ ...l, axe: axeLogique })),
    ...[0, 1, 2, 3].map((k) => ({ ...DOMINOS[(cle.length + k * 2) % DOMINOS.length], axe: axeLogique })),
    ...echelles.map(([axe, q]) => ({ type: "echelle" as const, partie: "profil" as const, axe, q })),
    { type: "libre", partie: "profil", axe: libre[0], q: libre[1] },
  ];
  return { cle, nom, dureeMin: 25, axes: [...axes, "Logique et raisonnement"], questions };
}

const t = (axe: number, q: string, options: string[], bonne: number): QTech => ({ type: "qcm", axe, q, options, bonne });
const l = (q: string, options: string[], bonne: number): QLogique => ({ type: "qcm", partie: "logique", q, options, bonne });

export const QUESTIONNAIRES: Record<string, Questionnaire> = {
  commercial: fabriquer("commercial", "Commerce et vente", ["Posture commerciale", "Négociation et chiffres", "Organisation"],
    [t(0, "Un prospect répond « c'est trop cher ». Votre première réaction ?", ["Je baisse mon prix tout de suite", "Je demande à quoi il compare et ce qu'il attend", "Je répète les points forts de l'offre", "Je propose de le rappeler le mois prochain"], 1),
     t(1, "Votre chiffre d'affaires annuel est de 600 k€ pour un objectif de 750 k€. Quel est le taux d'atteinte ?", ["75 %", "80 %", "85 %", "125 %"], 1),
     t(2, "Un client important n'a pas répondu depuis trois semaines. Vous…", ["Attendez qu'il revienne", "Lui écrivez un message court avec une question précise", "Passez par son supérieur", "Le retirez de votre suivi"], 1),
     t(1, "Un produit acheté 60 € est vendu 90 € HT. Quel est le taux de marge sur le prix de vente ?", ["30 %", "33 %", "50 %", "66 %"], 1),
     t(0, "Lors d'un premier rendez-vous, vous parlez surtout…", ["De votre entreprise et de ses références", "Du client : ses besoins, ses enjeux, ses délais", "Du prix, pour gagner du temps", "De la concurrence"], 1),
     t(2, "Pour prioriser vos prospects, le critère le plus utile est…", ["L'ordre alphabétique", "Le potentiel de chiffre d'affaires et la maturité du projet", "La proximité de vos locaux", "La taille du logo sur leur site"], 1)],
    [l("Un produit coûte 80 € après 20 % de remise. Quel était son prix initial ?", ["96 €", "100 €", "104 €", "160 €"], 1),
     l("Sur 40 rendez-vous, vous signez 6 contrats. Combien de rendez-vous faut-il pour 15 contrats au même taux ?", ["75", "90", "100", "120"], 2)],
    [[0, "Je préfère conquérir de nouveaux clients plutôt que fidéliser les existants."], [2, "Je tiens mon suivi client à jour chaque jour, même quand je suis débordé."]],
    [0, "Décrivez en quelques lignes votre vente la plus difficile et ce que vous en avez retenu."]),

  paie: fabriquer("paie", "Paie", ["Technique paie", "Calcul", "Fiabilité"],
    [t(0, "Quelle déclaration mensuelle transmet les données de paie aux organismes sociaux ?", ["La DPAE", "La DSN", "La DUE", "Le BOSS"], 1),
     t(1, "Salaire brut de 2 500 € auquel s'ajoute une prime de 10 %. Quel est le nouveau brut ?", ["2 600 €", "2 700 €", "2 750 €", "2 850 €"], 2),
     t(0, "Quelle pièce justifie l'absence d'un salarié malade ?", ["Un mail du salarié", "Un arrêt de travail", "Un SMS au manager", "Une attestation sur l'honneur"], 1),
     t(0, "Les heures supplémentaires, au-delà de 35 h, sont majorées par défaut (sans accord) de…", ["10 % puis 25 %", "25 % puis 50 %", "50 % puis 100 %", "Elles ne sont pas majorées"], 1),
     t(1, "Un salarié à 1 820 € brut pour 151,67 h fait 8 heures majorées à 25 %. Combien valent ces heures ? (taux horaire arrondi à 12 €)", ["96 €", "100 €", "120 €", "144 €"], 2),
     t(2, "Avant de valider la paie du mois, le contrôle le plus utile est…", ["Vérifier la couleur des bulletins", "Comparer les écarts avec le mois précédent", "Imprimer tous les bulletins", "Attendre les remarques des salariés"], 1)],
    [l("Une prime de 12 % est suivie d'une baisse de 12 %. Par rapport au point de départ, le résultat est…", ["Identique", "Légèrement plus élevé", "Légèrement plus bas", "12 % plus bas"], 2),
     l("Vous traitez 45 bulletins en 3 heures. Combien de temps pour 120 bulletins au même rythme ?", ["6 h", "7 h", "8 h", "9 h"], 2)],
    [[2, "Je relis toujours un bulletin avant de le valider, même sous pression."], [0, "Je suis l'actualité sociale (taux, plafonds, conventions) chaque mois."]],
    [2, "Une erreur de paie est découverte après le virement. Comment procédez-vous ?"]),

  compta: fabriquer("compta", "Comptabilité", ["Technique comptable", "Calcul", "Rigueur"],
    [t(0, "Quel document récapitule l'actif et le passif d'une entreprise ?", ["Le compte de résultat", "Le bilan", "Le grand livre", "La balance âgée"], 1),
     t(1, "Bien de 10 000 € amorti en linéaire sur 5 ans. Quelle dotation annuelle ?", ["1 000 €", "1 500 €", "2 000 €", "2 500 €"], 2),
     t(0, "Dans quelle classe de comptes trouve-t-on les comptes fournisseurs ?", ["Classe 2", "Classe 4", "Classe 6", "Classe 7"], 1),
     t(1, "Facture de 1 200 € TTC avec TVA à 20 %. Quel est le montant HT ?", ["960 €", "1 000 €", "1 040 €", "1 440 €"], 1),
     t(0, "Le rapprochement bancaire sert à…", ["Calculer la TVA", "Vérifier que la comptabilité correspond au relevé de banque", "Préparer les bulletins de paie", "Relancer les clients"], 1),
     t(2, "Une facture fournisseur n'a pas de numéro de TVA intracommunautaire obligatoire. Vous…", ["La saisissez quand même", "Demandez une facture rectifiée au fournisseur", "La jetez", "Inventez le numéro"], 1)],
    [l("Une balance présente un écart de 27 €. Quelle erreur est la plus plausible ?", ["Une inversion de chiffres (63 saisi au lieu de 36)", "Un oubli de TVA", "Un arrondi", "Un doublon de facture"], 0),
     l("Le chiffre d'affaires passe de 200 000 € à 250 000 €. Quelle est la hausse en pourcentage ?", ["20 %", "25 %", "30 %", "50 %"], 1)],
    [[2, "Je préfère clôturer un mois avec un écart expliqué plutôt qu'à l'euro près."], [1, "J'aime analyser les chiffres pour expliquer une variation à un dirigeant."]],
    [2, "Votre balance ne s'équilibre pas à la veille d'une clôture. Par quoi commencez-vous ?"]),

  rh: fabriquer("rh", "Ressources humaines", ["Droit du travail", "Organisation", "Relationnel"],
    [t(0, "Quelle formalité est à effectuer avant l'embauche d'un salarié ?", ["La DSN", "La DPAE", "Le registre des plaintes", "Le bilan social"], 1),
     t(0, "Durée maximale d'un CDD, renouvellements compris, en principe ?", ["12 mois", "18 mois", "24 mois", "36 mois"], 1),
     t(1, "Trois urgences arrivent en même temps. Vous traitez d'abord…", ["La plus facile", "Celle dont l'échéance légale est la plus proche", "Celle du dernier demandeur", "Celle de la direction, toujours"], 1),
     t(0, "À partir de quel effectif une entreprise doit-elle mettre en place un CSE ?", ["5 salariés", "11 salariés", "20 salariés", "50 salariés"], 1),
     t(0, "L'entretien professionnel doit avoir lieu au minimum…", ["Tous les ans", "Tous les 2 ans", "Tous les 5 ans", "Une seule fois"], 1),
     t(2, "Un salarié conteste vivement une décision devant ses collègues. Vous…", ["Lui répondez sur place", "Proposez de l'écouter en privé rapidement", "L'ignorez", "Envoyez un avertissement immédiatement"], 1)],
    [l("Sur 120 candidatures, 25 % sont présélectionnées, puis la moitié est reçue en entretien. Combien d'entretiens ?", ["15", "30", "45", "60"], 0),
     l("Une équipe de 25 personnes a 3 départs et 5 arrivées dans l'année. Quel est l'effectif final ?", ["23", "25", "27", "33"], 2)],
    [[2, "J'aime accompagner un salarié dans une situation délicate."], [1, "Je tiens des tableaux de suivi (visites médicales, fins de période d'essai) sans qu'on me le demande."]],
    [2, "Un salarié vous confie un conflit avec son manager. Que lui répondez-vous ?"]),

  admin: fabriquer("admin", "Assistanat et administratif", ["Outils et procédures", "Organisation", "Communication"],
    [t(0, "Dans un tableur, quelle formule additionne les cellules A1 à A10 ?", ["=TOTAL(A1;A10)", "=SOMME(A1:A10)", "=ADD(A1-A10)", "=A1+A10"], 1),
     t(1, "Votre responsable vous demande trois tâches pour la même heure. Vous…", ["Faites la plus courte", "Lui demandez l'ordre de priorité", "Faites les trois à moitié", "Choisissez au hasard"], 1),
     t(2, "Un client mécontent appelle. La première chose à faire est…", ["Le transférer sans explication", "L'écouter et reformuler sa demande", "Lui dire de rappeler plus tard", "Raccrocher s'il s'énerve"], 1),
     t(0, "Pour envoyer un document confidentiel par e-mail, le plus sûr est…", ["L'envoyer à toute l'équipe", "Le protéger par mot de passe et vérifier le destinataire", "Le mettre dans l'objet du mail", "L'envoyer depuis une adresse personnelle"], 1),
     t(1, "Pour organiser une réunion de 8 personnes, vous commencez par…", ["Réserver la salle la plus grande", "Proposer plusieurs créneaux et confirmer le plus partagé", "Envoyer l'ordre du jour sans date", "Attendre que quelqu'un propose une date"], 1),
     t(2, "Dans un mail professionnel, la formule la plus adaptée pour conclure est…", ["Bisous", "Cordialement", "À plus", "Bonne chance"], 1)],
    [l("Un dossier reçu un lundi doit être rendu 9 jours ouvrés plus tard (lundi au vendredi, sans jour férié). Quel jour ?", ["Le mercredi de la semaine suivante", "Le jeudi de la semaine suivante", "Le vendredi de la semaine suivante", "Le lundi dans deux semaines"], 2),
     l("Vous classez 240 factures, 30 par heure. Il vous reste 90 factures. Combien de temps avez-vous déjà passé ?", ["3 h", "4 h", "5 h", "6 h"], 2)],
    [[1, "J'aime que mon bureau et mes dossiers soient classés de façon que n'importe qui s'y retrouve."], [2, "Je suis à l'aise pour relancer quelqu'un qui tarde à répondre."]],
    [1, "Votre responsable est absent et un fournisseur exige une réponse urgente. Que faites-vous ?"]),

  direction: fabriquer("direction", "Management et direction", ["Management", "Pilotage et finance", "Décision"],
    [t(0, "Un collaborateur performant voit ses résultats chuter depuis un mois. Vous…", ["Lui adressez un avertissement", "Organisez un entretien pour comprendre", "Attendez que ça passe", "Réduisez ses objectifs sans lui dire"], 1),
     t(1, "Un chiffre d'affaires de 2 M€ avec un résultat net de 120 k€ donne une marge nette de…", ["1,2 %", "6 %", "12 %", "16 %"], 1),
     t(2, "Deux responsables sont en désaccord sur une priorité. Votre rôle est d'abord de…", ["Choisir le plus ancien", "Les écouter tous les deux puis trancher selon les objectifs", "Les laisser régler seuls", "Reporter la décision"], 1),
     t(0, "Un objectif « SMART » est…", ["Simple, motivant, ambitieux, rapide, terminé", "Spécifique, mesurable, atteignable, réaliste, temporel", "Stratégique, mesuré, annuel, revu, tenu", "Sûr, maîtrisé, adapté, rentable, tracé"], 1),
     t(1, "Le besoin en fonds de roulement augmente surtout quand…", ["Les clients paient plus tard", "Les fournisseurs sont payés plus tard", "Le capital augmente", "Les stocks baissent"], 0),
     t(2, "Face à une crise (client majeur perdu), la première action est…", ["Annoncer des licenciements", "Mesurer l'impact et informer l'équipe avec un plan", "Ne rien dire", "Baisser tous les prix"], 1)],
    [l("Une équipe de 6 personnes réalise un projet en 10 jours. Combien de jours à 4 personnes, au même rythme ?", ["12", "14", "15", "16"], 2),
     l("Les ventes baissent de 10 % puis remontent de 10 %. Par rapport au départ, elles sont…", ["Identiques", "Plus hautes de 1 %", "Plus basses de 1 %", "Plus basses de 10 %"], 2)],
    [[0, "Je délègue facilement, même des sujets importants."], [2, "Je préfère décider vite avec 80 % des informations plutôt que tard avec 100 %."]],
    [0, "Décrivez une décision difficile que vous avez prise pour votre équipe et comment vous l'avez annoncée."]),

  info: fabriquer("info", "Informatique et numérique", ["Technique", "Méthode", "Sécurité"],
    [t(0, "Que signifie l'acronyme HTTPS ?", ["Un protocole web chiffré", "Un langage de programmation", "Un format d'image", "Un type de câble réseau"], 0),
     t(0, "Dans une base de données, une « clé primaire » sert à…", ["Chiffrer la base", "Identifier chaque ligne de façon unique", "Trier par ordre alphabétique", "Sauvegarder la base"], 1),
     t(2, "Un utilisateur reçoit un mail lui demandant son mot de passe « pour une vérification ». Il s'agit probablement…", ["D'une demande normale du service informatique", "D'une tentative d'hameçonnage (phishing)", "D'une mise à jour", "D'une sauvegarde"], 1),
     t(1, "Un bug apparaît seulement en production. La première étape est…", ["Réécrire tout le code", "Reproduire le problème et lire les journaux", "Redémarrer le serveur chaque heure", "Attendre qu'il disparaisse"], 1),
     t(0, "Combien d'octets dans 1 kilooctet, au sens informatique strict (kibioctet) ?", ["1 000", "1 024", "1 048", "8 000"], 1),
     t(2, "La règle « 3-2-1 » pour les sauvegardes signifie…", ["3 copies, 2 supports différents, 1 copie hors site", "3 serveurs, 2 pare-feux, 1 antivirus", "3 jours, 2 semaines, 1 mois", "3 mots de passe, 2 comptes, 1 administrateur"], 0)],
    [l("Quelle est la valeur du nombre binaire 1011 en décimal ?", ["9", "10", "11", "13"], 2),
     l("Une boucle s'exécute 3 fois, et dans chaque passage une autre boucle s'exécute 4 fois. Combien d'exécutions au total de la boucle intérieure ?", ["7", "12", "16", "64"], 1)],
    [[1, "Je documente mon travail pour qu'un collègue puisse le reprendre."], [0, "Je me forme seul aux nouvelles technologies, sur mon temps personnel."]],
    [1, "Expliquez à un utilisateur non technicien pourquoi il doit changer son mot de passe régulièrement."]),

  tech: fabriquer("tech", "Industrie et maintenance", ["Sécurité", "Technique", "Autonomie"],
    [t(0, "Avant d'intervenir sur une machine, la première action est…", ["Regarder le manuel", "La consignation de l'énergie", "Prévenir un collègue", "Nettoyer la zone"], 1),
     t(1, "Une machine tourne à 1 500 tr/min. Combien de tours en 20 minutes ?", ["15 000", "30 000", "45 000", "75 000"], 1),
     t(1, "Un roulement chauffe et fait du bruit. Votre hypothèse la plus probable ?", ["Un défaut de lubrification", "Un défaut de peinture", "Une tension réseau trop haute", "Un capteur mal réglé"], 0),
     t(0, "Les EPI sont…", ["Des équipements de protection individuelle", "Des étapes de production industrielle", "Des écarts de pièces inspectées", "Des essais de pression interne"], 0),
     t(1, "Une ligne produit 480 pièces par heure. Elle s'arrête 15 minutes. Combien de pièces sont perdues ?", ["60", "96", "120", "160"], 2),
     t(2, "Vous constatez un défaut qualité répété sur votre poste. Vous…", ["Continuez pour tenir la cadence", "Arrêtez et alertez le responsable selon la procédure", "Retirez les pièces sans rien dire", "Changez un réglage au hasard"], 1)],
    [l("Une courroie relie une petite poulie à une grande. Laquelle tourne le plus vite ?", ["La petite", "La grande", "Les deux à la même vitesse", "Cela dépend de la courroie"], 0),
     l("Un engrenage de 20 dents entraîne un engrenage de 40 dents. Si le premier fait 10 tours, combien en fait le second ?", ["5", "10", "20", "40"], 0)],
    [[2, "Je préfère résoudre seul une panne plutôt que demander de l'aide."], [0, "Je respecte les consignes de sécurité même quand elles me ralentissent."]],
    [2, "Décrivez la dernière panne que vous avez diagnostiquée et votre méthode."]),

  btp: fabriquer("btp", "BTP et chantier", ["Sécurité chantier", "Technique et métré", "Organisation"],
    [t(0, "Le port du casque sur un chantier est…", ["Facultatif s'il fait chaud", "Obligatoire dans les zones à risque de chute d'objets", "Réservé au chef de chantier", "Seulement pour les visiteurs"], 1),
     t(1, "Une pièce mesure 5 m sur 4 m. Quelle est sa surface ?", ["9 m²", "18 m²", "20 m²", "40 m²"], 2),
     t(1, "Une dalle de 20 m² et 15 cm d'épaisseur nécessite combien de béton ?", ["1,5 m³", "3 m³", "15 m³", "30 m³"], 1),
     t(0, "Pour travailler en hauteur à plus de 3 m sans protection collective, il faut…", ["Faire attention", "Un harnais antichute correctement ancré", "Un collègue qui tient l'échelle", "Des chaussures de sécurité"], 1),
     t(2, "Le matériel prévu n'est pas livré le matin. Vous…", ["Renvoyez l'équipe chez elle", "Prévenez le conducteur de travaux et réorganisez les tâches", "Attendez sans rien dire", "Empruntez du matériel sur un autre chantier sans demander"], 1),
     t(1, "Sur un plan à l'échelle 1/50, un mur mesure 8 cm. Quelle est sa longueur réelle ?", ["0,4 m", "4 m", "40 m", "400 m"], 1)],
    [l("3 maçons montent un mur en 6 jours. Combien de jours faudra-t-il à 2 maçons au même rythme ?", ["4", "8", "9", "12"], 2),
     l("Une pente de 5 % sur 20 m correspond à une différence de hauteur de…", ["0,5 m", "1 m", "2 m", "5 m"], 1)],
    [[0, "Je fais remarquer un risque à un collègue, même plus ancien que moi."], [2, "Je prépare mon matériel la veille pour démarrer à l'heure."]],
    [2, "Le client modifie sa demande en plein chantier. Comment gérez-vous la situation ?"]),

  logistique: fabriquer("logistique", "Logistique et entrepôt", ["Sécurité", "Gestion de stock", "Fiabilité"],
    [t(0, "Le CACES R489 autorise à…", ["Conduire un poids lourd", "Conduire des chariots élévateurs", "Travailler en hauteur sur échafaudage", "Manipuler des produits chimiques"], 1),
     t(1, "La méthode FIFO signifie…", ["Premier entré, premier sorti", "Dernier entré, premier sorti", "Le plus lourd en premier", "Le plus cher en premier"], 0),
     t(1, "Quelle est la taille d'une palette Europe standard ?", ["60 × 80 cm", "80 × 120 cm", "100 × 120 cm", "120 × 120 cm"], 1),
     t(2, "Une commande de 36 colis, à raison de 12 colis par palette. Combien de palettes ?", ["2", "3", "4", "6"], 1),
     t(0, "Dans un rack, les charges les plus lourdes se placent…", ["En haut", "En bas", "Au milieu", "N'importe où"], 1),
     t(2, "Lors d'un inventaire, vous trouvez 4 cartons de moins que prévu. Vous…", ["Corrigez le chiffre sans rien dire", "Recomptez puis signalez l'écart à votre responsable", "Ajoutez 4 cartons d'un autre emplacement", "Ignorez l'écart"], 1)],
    [l("Un préparateur traite 25 lignes par heure sur une journée de 7 heures de travail. Combien de lignes ?", ["150", "175", "200", "225"], 1),
     l("Un camion part à 14 h 30 et le chargement dure 1 h 45. À quelle heure commencer au plus tard ?", ["12 h 15", "12 h 45", "13 h 00", "13 h 15"], 1)],
    [[0, "Je respecte les allées piétons et les limitations de vitesse, même quand je suis pressé."], [2, "Je vérifie la référence de chaque colis avant de le charger."]],
    [2, "Un colis arrive abîmé à la réception, le chauffeur est pressé de repartir. Que faites-vous ?"]),

  electricite: fabriquer("electricite", "Électricité", ["Sécurité électrique", "Technique", "Méthode"],
    [t(0, "Avant d'intervenir sur un circuit, il faut…", ["Couper au disjoncteur seulement", "Consigner et vérifier l'absence de tension (VAT)", "Porter des gants en laine", "Prévenir le client"], 1),
     t(1, "Une résistance de 10 Ω traversée par 2 A : quelle tension à ses bornes ?", ["5 V", "12 V", "20 V", "200 V"], 2),
     t(1, "Un appareil en 230 V consomme 10 A. Quelle puissance ?", ["23 W", "230 W", "2 300 W", "23 000 W"], 2),
     t(0, "Un dispositif différentiel 30 mA sert surtout à…", ["Protéger les personnes contre l'électrocution", "Réduire la facture", "Protéger contre la foudre", "Augmenter la puissance"], 0),
     t(0, "En France, le conducteur de protection (terre) est de couleur…", ["Bleu", "Rouge", "Vert et jaune", "Noir"], 2),
     t(1, "Section de fil habituelle pour un circuit de prises 16 A en logement (NF C 15-100) ?", ["1,5 mm²", "2,5 mm²", "4 mm²", "6 mm²"], 1)],
    [l("Trois résistances de 10 Ω montées en série donnent une résistance totale de…", ["3,3 Ω", "10 Ω", "20 Ω", "30 Ω"], 3),
     l("Deux résistances de 10 Ω montées en parallèle donnent une résistance totale de…", ["5 Ω", "10 Ω", "15 Ω", "20 Ω"], 0)],
    [[0, "Je ne travaille jamais sous tension sans habilitation adaptée."], [2, "Je contrôle mon installation avec un appareil de mesure avant de la remettre au client."]],
    [2, "Un client signale que son disjoncteur saute régulièrement. Décrivez votre démarche de diagnostic."]),

  accueil: fabriquer("accueil", "Accueil et relation client", ["Accueil", "Organisation", "Expression écrite"],
    [t(0, "Le téléphone sonne alors que vous accueillez un visiteur. Vous…", ["Laissez sonner", "Vous excusez auprès du visiteur, répondez brièvement et prenez un message", "Faites attendre le visiteur pendant tout l'appel", "Décrochez et raccrochez"], 1),
     t(1, "Un visiteur sans rendez-vous demande à voir le directeur. Vous…", ["Le laissez monter", "Lui demandez l'objet, prévenez l'assistante et proposez un rendez-vous", "Le renvoyez sans explication", "Lui donnez le portable du directeur"], 1),
     t(2, "Quelle phrase est correctement écrite ?", ["Je vous ai envoyé les documents.", "Je vous ai envoyer les documents.", "Je vous es envoyé les documents.", "Je vous ai envoyés les documents."], 0),
     t(1, "Pour prendre un message téléphonique complet, il faut noter…", ["Seulement le prénom", "Nom, coordonnées, objet, date et heure de l'appel", "L'humeur de la personne", "Rien, vous retiendrez"], 1),
     t(0, "Une personne s'énerve à l'accueil. Le bon réflexe est…", ["Hausser le ton", "Rester calme, écouter et reformuler sa demande", "Lui tourner le dos", "Appeler la police immédiatement"], 1),
     t(2, "Un inconnu au téléphone demande l'agenda d'un collaborateur. Vous…", ["Le lui donnez", "Ne le communiquez pas et proposez de transmettre un message", "Lui donnez une partie", "Raccrochez sans rien dire"], 1)],
    [l("L'accueil reçoit 40 appels par jour, dont 15 % pour la facturation. Combien d'appels pour la facturation ?", ["4", "6", "8", "15"], 1),
     l("L'accueil est ouvert de 8 h 30 à 12 h et de 13 h 30 à 17 h. Combien d'heures par jour ?", ["6 h", "6 h 30", "7 h", "8 h 30"], 2)],
    [[0, "Je garde le sourire même après une journée difficile."], [1, "J'aime que les messages et le courrier soient transmis dans l'heure."]],
    [0, "Un client mécontent attend depuis 20 minutes à l'accueil. Que lui dites-vous et que faites-vous ?"]),

  general: fabriquer("general", "Questionnaire général", ["Organisation", "Relation client", "Adaptabilité"],
    [t(0, "Vous avez trop de tâches pour la journée. Vous…", ["Faites au plus vite sans ordre", "Listez, priorisez et prévenez si un délai ne tiendra pas", "Faites les plus agréables", "Laissez les autres pour demain sans prévenir"], 1),
     t(1, "Un client vous pose une question dont vous ignorez la réponse. Vous…", ["Inventez une réponse", "Dites que vous vérifiez et revenez vers lui", "Lui dites de chercher sur internet", "Changez de sujet"], 1),
     t(2, "Une nouvelle procédure est mise en place dans votre service. Vous…", ["Continuez comme avant", "Vous la faites expliquer et l'appliquez", "Critiquez-la auprès des collègues", "Attendez qu'on vous oblige"], 1),
     t(0, "Pour ne rien oublier dans une journée chargée, le plus efficace est…", ["Compter sur sa mémoire", "Une liste de tâches mise à jour", "Demander aux collègues de vous rappeler", "Tout faire le matin"], 1),
     t(1, "Un collègue fait une erreur qui touche un client. Vous…", ["Le dénoncez au client", "L'aidez à corriger et prévenez le responsable", "Ne dites rien", "Corrigez en cachette"], 1),
     t(2, "On vous propose une formation sur un outil que vous ne connaissez pas. Vous…", ["Refusez", "Acceptez volontiers", "Acceptez seulement si elle est notée", "Envoyez un collègue à votre place"], 1)],
    [l("Un article coûte 50 €. Il augmente de 10 %. Quel est son nouveau prix ?", ["50,10 €", "55 €", "60 €", "51 €"], 1),
     l("Si aujourd'hui est mardi, quel jour serons-nous dans 10 jours ?", ["Jeudi", "Vendredi", "Samedi", "Lundi"], 1)],
    [[2, "J'aime quand mes journées ne se ressemblent pas."], [1, "Je reste calme face à une personne mécontente."]],
    [0, "Parlez d'une réussite professionnelle ou personnelle dont vous êtes fier(e)."]),
};

// Test de logique seul (dominos, suites, déduction) : utilisable pour tout poste, à choisir sur l'offre
QUESTIONNAIRES.logique = {
  cle: "logique",
  nom: "Test de logique (dominos et raisonnement)",
  dureeMin: 20,
  axes: ["Dominos", "Suites et calcul", "Déduction"],
  questions: [
    ...DOMINOS.map((x) => ({ ...x, axe: 0 })),
    ...[LOGIQUE_COMMUNE[0], LOGIQUE_COMMUNE[3],
      l("Quel nombre complète la suite : 1, 1, 2, 3, 5, 8, … ?", ["11", "12", "13", "16"], 2),
      l("Quel nombre complète la suite : 100, 95, 85, 70, … ?", ["45", "50", "55", "60"], 1)].map((x) => ({ ...x, axe: 1 })),
    ...[LOGIQUE_COMMUNE[1], LOGIQUE_COMMUNE[2],
      l("Paul est plus grand que Marc. Marc est plus grand que Léo. Qui est le plus petit ?", ["Paul", "Marc", "Léo", "On ne peut pas savoir"], 2),
      l("Tous les chats sont des animaux et certains chats sont noirs. Quelle conclusion est certaine ?", ["Tous les animaux sont noirs", "Certains animaux sont noirs", "Aucun animal n'est noir", "Tous les chats sont noirs"], 1)].map((x) => ({ ...x, axe: 2 })),
  ],
};

/** Libellés des parties (affichage) */
export const PARTIES_QUESTIONNAIRE = { tech: "Technique", logique: "Logique et raisonnement", dominos: "Test de dominos", profil: "Mise en situation" } as const;

/** Questionnaire à proposer selon le classement du métier */
export function cleParCategorie(categorie: string): string {
  return ({
    "Commercial": "commercial", "Paie": "paie", "Comptabilité": "compta", "Ressources Humaines": "rh", "Administratif": "admin",
    "Direction": "direction", "Informatique": "info", "Industrie": "tech", "BTP": "btp",
  } as Record<string, string>)[categorie] ?? "general";
}

/** Questionnaire de l'offre : choix explicite, sinon déduit de la catégorie, « aucun » = pas de test */
export function cleDeLOffre(offre: { questionnaire: string; categorie: string } | null, categorieChoisie?: string): string | null {
  const choix = offre?.questionnaire ?? "auto";
  if (choix === "aucun") return null;
  if (choix !== "auto" && QUESTIONNAIRES[choix]) return choix;
  return cleParCategorie(offre?.categorie ?? categorieChoisie ?? "Autres");
}

/** Version envoyée au navigateur : sans les bonnes réponses */
export function questionnairePublic(cle: string) {
  const q = QUESTIONNAIRES[cle];
  if (!q) return null;
  return {
    cle: q.cle,
    nom: q.nom,
    dureeMin: q.dureeMin,
    questions: q.questions.map((x) => ({ type: x.type, partie: x.partie, q: x.q, options: x.options, dominos: x.dominos })),
  };
}

/** Score final : 80 % questions à choix + 20 % note du consultant sur la réponse libre (0 à 5), si elle existe */
export function scoreAjuste(scoreTest: number | null, noteLibre: number | null): number | null {
  if (scoreTest == null) return null;
  if (noteLibre == null) return scoreTest;
  return Math.round(scoreTest * 0.8 + (noteLibre / 5) * 100 * 0.2);
}

export type ResultatTest = { score: number; axes: Record<string, number>; aRelire: boolean; nbCorrectes: number; nbQcm: number };

/** Correction automatique : score sur 100 (questions à choix) et score par axe */
export function corriger(cle: string, reponses: (string | number | null)[]): ResultatTest {
  const q = QUESTIONNAIRES[cle];
  const parAxe: Record<number, { bon: number; total: number }> = {};
  let bon = 0;
  let total = 0;
  let aRelire = false;
  q.questions.forEach((question, i) => {
    const rep = reponses[i];
    if (question.type === "libre") {
      if (typeof rep === "string" && rep.trim()) aRelire = true;
      return;
    }
    if (question.type !== "qcm") return;
    total += 1;
    parAxe[question.axe] = parAxe[question.axe] || { bon: 0, total: 0 };
    parAxe[question.axe].total += 1;
    if (rep !== null && rep !== undefined && Number(rep) === question.bonne) {
      bon += 1;
      parAxe[question.axe].bon += 1;
    }
  });
  const axes: Record<string, number> = {};
  q.axes.forEach((nom, i) => {
    const p = parAxe[i];
    if (p && p.total) axes[nom] = Math.round((p.bon / p.total) * 100);
  });
  return { score: total ? Math.round((bon / total) * 100) : 0, axes, aRelire, nbCorrectes: bon, nbQcm: total };
}
