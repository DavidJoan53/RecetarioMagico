import {signIn} from '@/auth'
import {Mark} from '@/components/mark'

/**
 * The sign-in screen, and the only route reachable without a session.
 *
 * No email or password field: there is nothing to phish and nothing to reset.
 * GitHub is the sole provider, and the allowlist decides the rest.
 */
export default function SignInPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center gap-6 p-6 text-center">
      <Mark size={72} />

      <div>
        <h1 className="font-bold text-2xl tracking-tight">Recetario Mágico</h1>
        <p className="mt-1 text-secondary-foreground text-sm">
          Tus recetas, etiquetadas y fáciles de encontrar.
        </p>
      </div>

      <form
        className="w-full"
        action={async () => {
          'use server'
          await signIn('github', {redirectTo: '/inicio'})
        }}
      >
        <button
          type="submit"
          className="w-full rounded-lg bg-primary-strong px-4 py-3 font-semibold text-white"
        >
          Entrar con GitHub
        </button>
      </form>

      <p className="text-secondary-foreground text-xs">Acceso restringido.</p>
    </main>
  )
}
