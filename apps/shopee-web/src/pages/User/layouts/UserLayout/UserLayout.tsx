import UserSideNav from '../../components/UserSideNav'
import { Outlet } from 'react-router'

const UserLayout = () => {
  return (
    <div className='border-b-4 border-b-[#ee4d2d] bg-black/5 pt-0 pb-12.5 text-sm text-gray-600 md:pt-5 dark:bg-slate-900 dark:text-gray-400'>
      <div className='container'>
        <div className='grid grid-cols-1 gap-0 md:grid-cols-12 md:gap-6'>
          {/* sideNav */}
          <div className='md:col-span-3 lg:col-span-2'>
            <UserSideNav />
          </div>
          {/* Profile, password, history */}
          <div className='md:col-span-9 md:ml-4 lg:col-span-10 lg:ml-6.75'>
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserLayout
