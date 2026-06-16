import { signInWithMagicLink } from "./actions";

interface LoginPageProps {
  searchParams: Promise<{ message?: string; error?: string; next?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { message, error, next } = await searchParams;

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-md">
        {/* Decorative gradient card accent */}
        <div className="h-1.5 w-full rounded-t-2xl bg-gradient-to-r from-brand-500 via-brand-600 to-accent-600" />
        <div className="rounded-b-2xl border border-t-0 border-brand-100 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-extrabold text-slate-900">Willkommen zurück</h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Gib deine E-Mail-Adresse ein – wir schicken dir einen Magic Link.
            Kein Passwort nötig.
          </p>

          <form action={signInWithMagicLink} className="mt-6 space-y-4">
            {next && <input type="hidden" name="next" value={next} />}
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-slate-500">
                E-Mail-Adresse
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="du@beispiel.de"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 transition-colors focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-brand-600 to-accent-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90"
            >
              Magic Link senden
            </button>
          </form>

          {message && (
            <div className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
              {message}
            </div>
          )}
          {error && (
            <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
          )}
        </div>
      </div>
    </div>
  );
}
