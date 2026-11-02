// lib/notifications.ts
// E-mails (Resend). Variables Vercel : RESEND_API_KEY, MAIL_FROM, MAIL_ADMIN, APP_URL.
// Sans clé Resend, l'application fonctionne normalement mais n'envoie aucun e-mail.
import { Resend } from "resend";

const EXPEDITEUR = process.env.MAIL_FROM || "Franeo Jobs <onboarding@resend.dev>";
const DESTINATAIRE_ADMIN = process.env.MAIL_ADMIN || "lfranchino@franeo-rh.com";
export const APP_URL = (process.env.APP_URL || "https://jobs.franeo-rh.com").replace(/\/$/, "");

const echapper = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Ne bloque jamais l'action en cours : en cas d'erreur d'envoi, on l'écrit seulement dans les logs */
export async function envoyerMail(options: {
  a: string | string[];
  sujet: string;
  titre: string;
  lignes: string[];
  lien?: string; // chemin dans l'app ou adresse complète
  bouton?: string;
  pixelSuivi?: string; // adresse complète d'une image invisible (ouverture de l'e-mail)
}): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) return false;
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const url = options.lien ? (options.lien.startsWith("http") ? options.lien : `${APP_URL}${options.lien}`) : APP_URL;
    await resend.emails.send({
      from: EXPEDITEUR,
      to: options.a,
      subject: options.sujet,
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;color:#111827">
          <h2 style="color:#7c3aed;margin:0 0 12px">${echapper(options.titre)}</h2>
          ${options.lignes.map((l) => `<p style="margin:6px 0;font-size:14px;line-height:1.5">${echapper(l)}</p>`).join("")}
          ${options.lien ? `<p style="margin:20px 0 0"><a href="${url}" style="background:#7c3aed;color:#ffffff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:bold">${echapper(options.bouton || "Ouvrir Franeo Jobs")}</a></p>` : ""}
          <p style="margin:24px 0 0;font-size:12px;color:#6b7280">FRANEO RH · Franeo Jobs</p>
          ${options.pixelSuivi ? `<img src="${options.pixelSuivi}" width="1" height="1" alt="" style="display:block" />` : ""}
        </div>`,
    });
    return true;
  } catch (e) {
    console.error("E-mail non envoyé :", e);
    return false;
  }
}

/** Mail à l'équipe FRANEO RH */
export async function notifierAdmin(options: { sujet: string; titre: string; lignes: string[]; lien?: string }) {
  await envoyerMail({ a: DESTINATAIRE_ADMIN, sujet: `[Franeo Jobs] ${options.sujet}`, titre: options.titre, lignes: options.lignes, lien: options.lien });
}
