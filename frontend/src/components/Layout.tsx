import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function Layout() {
  return (
    <div className="flex h-screen bg-canvas text-ink">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}