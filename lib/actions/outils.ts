// lib/actions/outils.ts : petits outils communs aux actions serveur (pas de "use server" ici).
export const txt = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
export const nbr = (fd: FormData, k: string) => {
  const v = txt(fd, k).replace(/\s/g, "").replace(",", ".");
  const n = Number(v);
  return v && Number.isFinite(n) ? n : null;
};
export const liste = (fd: FormData, k: string) => txt(fd, k).split(/[,;\n]/).map((s) => s.trim()).filter(Boolean);
export const vers = (chemin: string, erreur?: string) => (erreur ? `${chemin}${chemin.includes("?") ? "&" : "?"}erreur=${encodeURIComponent(erreur)}` : chemin);
