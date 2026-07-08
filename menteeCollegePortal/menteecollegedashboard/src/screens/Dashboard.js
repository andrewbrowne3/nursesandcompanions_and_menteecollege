import React from 'react';
import { useSelector } from 'react-redux';
import { Container, Grid, Paper, Typography, Box } from '@mui/material';
import MyRegistration from '../Components/MyRegistration';
import Mybill from '../Components/Mybill';
import CurrentCourses from '../Components/CurrentCourses';
import UpcomingPayments from '../Components/UpcomingPayments';
import AlertsCard from '../Components/AlertsCard';
import Header from '../Components/Header';

const Dashboard = () => {
  const { userInfo } = useSelector((state) => state.userLogin);
  const name = userInfo?.name || userInfo?.username || 'Student';

  return (
    <div className="outer-container">
      <Header />
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
        {/* Welcome banner */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, md: 3.5 },
            mb: 3,
            borderRadius: 3,
            color: '#fff',
            background: 'linear-gradient(120deg, #1565c0 0%, #0d47a1 100%)',
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Welcome back, {name}
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9, mt: 0.5 }}>
            Your classes, registration, and account — all in one place.
          </Typography>
        </Paper>

        {/* Alerts span full width */}
        <Box sx={{ mb: 3 }}>
          <AlertsCard />
        </Box>

        {/* Two-column responsive grid of dashboard cards */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <CurrentCourses />
          </Grid>
          <Grid item xs={12} md={6}>
            <MyRegistration />
          </Grid>
          <Grid item xs={12} md={6}>
            <Mybill />
          </Grid>
          <Grid item xs={12} md={6}>
            <UpcomingPayments />
          </Grid>
        </Grid>
      </Container>
    </div>
  );
};

export default Dashboard;
