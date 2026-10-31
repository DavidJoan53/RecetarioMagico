import {getTranslations} from 'next-intl/server'
import {signOut} from '@/auth'
import {getSession} from '@/lib/session'

export default async function HomePage() {
  const [t, session] = await Promise.all([getTranslations(), getSession()])

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
      <h1 className="font-bold text-2xl tracking-tight">{t('nav.home')}</h1>
      <p className="text-secondary-foreground text-sm">
        {t('auth.signedInAs', {email: session?.email ?? ''})}
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
          {t('auth.signOut')}
        </button>
      </form>
    </main>
  )
}
