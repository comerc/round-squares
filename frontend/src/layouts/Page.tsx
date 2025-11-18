import { Outlet } from 'react-router-dom'

function PageLayout() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex min-h-0 flex-1 flex-col items-center">
        <Outlet />
      </div>
      <Footer />
    </div>
  )
}

function Footer() {
  return (
    <div className="flex justify-between px-3 py-1">
      <div>The Last of Guss</div>
      <div>v0.1</div>
    </div>
  )
}

export default PageLayout
