export default function Chargement() {
  return (
    <div className="fr-chargement" role="status" aria-live="polite">
      <div className="fr-chargement-barre" />
      <div className="fr-chargement-centre"><span className="fr-spinner" /> Chargement…</div>
    </div>
  );
}
