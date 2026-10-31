import {signOut} from '@/auth'
import {getSession} from '@/lib/session'

/**
 * Placeholder for the home screen. It exists now so the auth gate has
 * somewhere to land, and so a signed-in session is visible end to end rather
 * than only in a cookie.
 */
export default async function InicioPage() {
  // Middleware has already redirected an unauthenticated request, but this
  // page reads the session itself rather than assuming that ran.
  const session = await getSession()

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
      <h1 className="font-bold text-2xl tracking-tight">Inicio</h1>
      <p className="text-secondary-foreground text-sm">
        Sesión iniciada como <strong>{session?.email}</strong>.
      </p>
      <form
        action={async () => {
          'use server'
          await signOut({redirectTo: '/'})
        }}
      >
        <button
          type="submit"
          className="rounded-lg border border-secondary-foreground px-4 py-2 text-sm"
        >
          Cerrar sesión
        </button>
      </form>
    </main>
  )
}
