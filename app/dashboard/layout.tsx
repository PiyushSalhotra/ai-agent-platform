import React from 'react'
import DashboardProvider from './Provider'

function Dashboard({children}:any) {
  return (
    <div>
        <DashboardProvider>
      {children}
      </DashboardProvider>
    </div>
  )
}

export default Dashboard
