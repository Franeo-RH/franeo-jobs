// Domino dessiné (deux moitiés de 0 à 6 points). « vide » affiche un domino à trouver.
const POSITIONS: Record<number, number[]> = {
  0: [], 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8],
};

function Moitie({ n }: { n: number }) {
  return (
    <span style={{ display: "grid", gridTemplateColumns: "repeat(3, 8px)", gridTemplateRows: "repeat(3, 8px)", gap: "3px", padding: "6px" }}>
      {Array.from({ length: 9 }, (_, i) => (
        <span key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: POSITIONS[n]?.includes(i) ? "#111827" : "transparent" }} />
      ))}
    </span>
  );
}

export default function Domino({ haut, bas, vide = false, actif = false }: { haut?: number; bas?: number; vide?: boolean; actif?: boolean }) {
  return (
    <span
      role="img"
      aria-label={vide ? "Domino à trouver" : `Domino ${haut} et ${bas}`}
      style={{
        display: "inline-flex", flexDirection: "column", alignItems: "center", background: vide ? "#f5f3ff" : "#ffffff",
        border: `2px ${vide ? "dashed" : "solid"} ${actif ? "#7c3aed" : vide ? "#a78bfa" : "#111827"}`, borderRadius: 8, minWidth: 48,
        boxShadow: actif ? "0 0 0 3px #ddd6fe" : "none",
      }}
    >
      {vide ? (
        <span style={{ height: 82, display: "flex", alignItems: "center", fontSize: 26, fontWeight: 800, color: "#7c3aed" }}>?</span>
      ) : (
        <>
          <Moitie n={haut ?? 0} />
          <span style={{ width: "80%", height: 2, background: "#111827" }} />
          <Moitie n={bas ?? 0} />
        </>
      )}
    </span>
  );
}
