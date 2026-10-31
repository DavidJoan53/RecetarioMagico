import {TabBar} from '@/components/tab-bar'

/** Chrome for signed-in routes. The sign-in page sits outside this group. */
export default function AppLayout({children}: {children: React.ReactNode}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="mx-auto w-full max-w-2xl flex-1 p-4">{children}</div>
      <TabBar />
    </div>
  )
}
