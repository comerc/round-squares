import { Outlet } from 'react-router-dom'

function AppLayout() {
  return (
    <div className="h-screen w-screen bg-gradient-to-b from-[#9999EB] to-[#EBEB99]">
      <Outlet />
    </div>
  )
}

export default AppLayout
