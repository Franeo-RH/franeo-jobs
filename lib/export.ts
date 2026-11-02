// lib/export.ts : fabrique un fichier Excel (.xlsx) à partir de lignes simples.
import * as XLSX from "xlsx";
import { NextResponse } from "next/server";

type Ligne = Record<string, string | number | boolean | null>;

export function reponseExcel(nomFichier: string, feuilles: { nom: string; lignes: Ligne[] }[]) {
  const wb = XLSX.utils.book_new();
  for (const f of feuilles) {
    const lignes = f.lignes.length ? f.lignes : [{ "Aucune donnée": "" }];
    const ws = XLSX.utils.json_to_sheet(lignes);
    ws["!cols"] = Object.keys(lignes[0]).map((k) => ({ wch: Math.min(40, Math.max(12, k.length + 2)) }));
    XLSX.utils.book_append_sheet(wb, ws, f.nom.slice(0, 31));
  }
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${nomFichier}"`,
    },
  });
}

export const dateFR = (d: Date | null | undefined) => (d ? d.toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" }) : "");
