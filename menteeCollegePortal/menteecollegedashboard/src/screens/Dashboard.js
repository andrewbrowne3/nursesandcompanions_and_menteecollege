import React from 'react'
import MyRegistration from '../Components/MyRegistration'
import Mybill from '../Components/Mybill'
import Myfinancialaid from '../Components/Myfinancialaid'
import CurrentCourses from '../Components/CurrentCourses'
import UpcomingPayments from '../Components/UpcomingPayments'
import AlertsCard from '../Components/AlertsCard'
import Header from '../Components/Header'

const Dashboard = () => {
  return (
    <div className="outer-container">
      <Header />
      <div className="app-container">
        <AlertsCard />
        <MyRegistration />
        <Mybill />
        <Myfinancialaid />
        <CurrentCourses />
        <UpcomingPayments />
      </div>
    </div>
  )
}

export default Dashboard
