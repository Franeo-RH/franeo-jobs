import { redirect } from "next/navigation";

// La page d'accueil de Franeo Jobs est la liste des offres, ouverte à tous
export default function Accueil() {
  redirect("/offres");
}
