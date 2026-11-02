"use client";

import { useFormStatus } from "react-dom";

/** Bouton d'envoi de formulaire : se grise pendant l'envoi, demande une confirmation si besoin */
export default function BoutonAction({
  children,
  confirmation,
  className = "bg-violet-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-violet-700 transition disabled:opacity-50",
}: {
  children: React.ReactNode;
  confirmation?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={className}
      onClick={(e) => {
        if (confirmation && !window.confirm(confirmation)) e.preventDefault();
      }}
    >
      {pending ? "…" : children}
    </button>
  );
}
