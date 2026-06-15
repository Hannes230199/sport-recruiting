import { signInWithMagicLink } from "./actions";

interface LoginPageProps {
  searchParams: Promise<{ message?: string; error?: string; next?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { message, error, next } = await searchParams;

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-xl border border-slate-200 bg-white p-8">
        <h1 className="text-xl font-bold text-slate-900">Anmelden</h1>
        <p className="mt-1 text-sm text-slate-600">
          Gib deine E-Mail-Adresse ein – wir schicken dir einen Anmeldelink
          (Magic Link). Kein Passwort nötig, beim ersten Login wird
          automatisch ein Konto angelegt.
        </p>

        <form action={signInWithMagicLink} className="mt-6 space-y-4">
          {next && <input type="hidden" name="next" value={next} />}
          <div>
            <label htmlFor="email" className="mb-1 block text-xs font-medium text-slate-600">
              E-Mail-Adresse
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="du@beispiel.de"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Magic Link senden
          </button>
        </form>

        {message && (
          <p className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">{message}</p>
        )}
        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}
      </div>
    </div>
  );
}
