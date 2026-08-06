import { Outlet } from 'react-router-dom'

export function HabitosShell() {
  return (
    <main className="flex-1 px-4 pb-24 pt-4 md:px-8 md:pb-8 md:pt-6">
      <div className="mx-auto w-full max-w-4xl">
        <Outlet />
      </div>
    </main>
  )
}
