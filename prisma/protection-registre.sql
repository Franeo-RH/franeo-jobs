-- OPTIONNEL mais recommandé : verrouille le registre anti-litiges dans la base elle-même.
-- À exécuter une seule fois dans l'éditeur SQL de Neon, après "prisma db push".
-- Résultat : même en cas d'erreur de code ou d'accès direct à la base, aucune ligne du
-- registre ne peut être modifiée ni supprimée.

CREATE OR REPLACE FUNCTION registre_non_modifiable() RETURNS trigger AS $$
BEGIN
  -- seule exception : la remise à zéro nocturne des données de démonstration
  IF TG_OP = 'DELETE' AND EXISTS (SELECT 1 FROM "Entreprise" WHERE id = OLD."entrepriseId" AND demo = true) THEN
    RETURN OLD;
  END IF;
  RAISE EXCEPTION 'Le registre anti-litiges est en ajout seul : modification et suppression interdites';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS registre_protege ON "JournalRegistre";
CREATE TRIGGER registre_protege
  BEFORE UPDATE OR DELETE ON "JournalRegistre"
  FOR EACH ROW EXECUTE FUNCTION registre_non_modifiable();
