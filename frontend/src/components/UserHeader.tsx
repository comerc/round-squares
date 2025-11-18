import { Link } from 'react-router-dom'
import { useAuthStore } from '@/app/store'

function UserHeader({ title }: { title: string }) {
  const user = useAuthStore((state) => state.user)
  const userName = user?.username || ''

  return (
    <div className="flex items-center gap-3 border-b-2 border-green-500 px-5 py-3">
      <div className="flex-1"></div>
      <div className="flex-1 text-center whitespace-nowrap">{title}</div>
      <div className="flex-1 text-right">
        <Link title="Выйти" className="text-blue-500 hover:text-red-500" to="/logout">
          {userName}
        </Link>
      </div>
    </div>
  )
}

export default UserHeader
