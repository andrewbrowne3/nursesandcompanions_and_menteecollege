import React from 'react'
import Header from './Header'
import LoginButton from './LoginButton'
import MyRegistration from './MyRegistration'
import Mybill from './Mybill'
import Myfinancialaid from './Myfinancialaid'

const Dashboard = () => {
  return (
    <div className="outer-container">
    <Header />
    <div className="app-container">
      <LoginButton />
      <MyRegistration />
      <Mybill />
      <Myfinancialaid />
      {/* Other components can be added here */}
    </div>
    </div>
  )
}

export default Dashboard

