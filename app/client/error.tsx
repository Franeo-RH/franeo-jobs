"use client";

export default function Erreur({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="bg-white rounded-xl shadow p-8 text-center">
      <p className="text-4xl mb-2">⚠️</p>
      <h1 className="text-2xl font-bold mb-2">Cette page n&apos;a pas pu s&apos;afficher</h1>
      <p className="text-gray-500 mb-6">Un problème est survenu. Réessayez ; si cela continue, rechargez la page.</p>
      <button onClick={reset} className="bg-violet-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-violet-700">Réessayer</button>
    </div>
  );
}
