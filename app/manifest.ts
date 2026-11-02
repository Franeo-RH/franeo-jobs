import type { MetadataRoute } from "next";

// Rend l'application installable sur téléphone (« Ajouter à l'écran d'accueil »)
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Franeo Jobs — Recrutement",
    short_name: "Franeo Jobs",
    description: "Offres d'emploi et espace recrutement FRANEO RH",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#000000",
    lang: "fr",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
