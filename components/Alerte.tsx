/** Message d'erreur (rouge) ou de succès (vert) affiché en haut d'une page après une action */
export default function Alerte({ erreur, ok }: { erreur?: string | string[]; ok?: string | string[] | boolean }) {
  const e = Array.isArray(erreur) ? erreur[0] : erreur;
  const o = Array.isArray(ok) ? ok[0] : ok;
  if (e) return <p role="alert" className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 mb-6">{e}</p>;
  if (o) return <p role="status" className="bg-green-50 text-green-700 border border-green-200 rounded-lg px-4 py-3 mb-6">{typeof o === "string" && o !== "1" ? o : "Enregistré ✅"}</p>;
  return null;
}
