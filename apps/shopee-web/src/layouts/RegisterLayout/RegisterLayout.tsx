import React, { memo, useEffect } from 'react'
import { Outlet } from 'react-router'
import Footer from 'src/components/Footer'
import RegisterHeader from 'src/components/RegisterHeader'
import PageTransition from 'src/components/PageTransition'

interface Props {
  children?: React.ReactNode // này có cũng được không có cũng được
}

const RegisterLayoutInner = ({ children }: Props) => {
  // useEffect khi mà load đến trang nào đó thì nó sẽ scroll lên đầu trang đó cho mình
  // console.log('RegisterLayout')
  useEffect(() => {
    window.scrollTo(0, 0)
  })

  return (
    <div className='min-h-screen bg-gray-100 dark:bg-slate-900'>
      <RegisterHeader />
      <PageTransition>
        {children}
        <Outlet />
      </PageTransition>
      <Footer />
    </div>
  )
}

const RegisterLayout = memo(RegisterLayoutInner)

export default RegisterLayout
