import {getTranslations} from 'next-intl/server'
import {signIn} from '@/auth'
import {Mark} from '@/components/mark'

export default async function SignInPage() {
  const t = await getTranslations()

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center gap-6 p-6 text-center">
      <Mark size={72} label={t('app.name')} />

      <div>
        <h1 className="font-bold text-2xl tracking-tight">{t('app.name')}</h1>
        <p className="mt-1 text-secondary-foreground text-sm">
          {t('app.tagline')}
        </p>
      </div>

      <form
        className="w-full"
        action={async () => {
          'use server'
          await signIn('github', {redirectTo: '/home'})
        }}
      >
        <button
          type="submit"
          className="w-full rounded-lg bg-primary-strong px-4 py-3 font-semibold text-white"
        >
          {t('auth.signIn')}
        </button>
      </form>

      <p className="text-secondary-foreground text-xs">
        {t('auth.restricted')}
      </p>
    </main>
  )
}
