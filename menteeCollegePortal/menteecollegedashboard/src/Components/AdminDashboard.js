import React, { useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Container,
  Button,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Description as DocumentIcon,
  Group as GroupIcon,
  Category as CategoryIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  AssignmentTurnedIn as RequiredIcon,
  ArrowBack,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import DocumentManagement from './DocumentManagement';
import CohortManagement from './CohortManagement';
import AllStudents from './AllStudents';
import RequiredDocuments from './RequiredDocuments';

const drawerWidth = 240;

const AdminDashboard = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState('documents');
  const navigate = useNavigate();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: <DashboardIcon /> },
    { id: 'students', label: 'Students', icon: <PersonIcon /> },
    { id: 'documents', label: 'Documents', icon: <DocumentIcon /> },
    { id: 'required', label: 'Required Docs', icon: <RequiredIcon /> },
    { id: 'cohorts', label: 'Cohorts', icon: <GroupIcon /> },
    { id: 'categories', label: 'Categories', icon: <CategoryIcon /> },
    { id: 'analytics', label: 'Analytics', icon: <AnalyticsIcon /> },
    { id: 'settings', label: 'Settings', icon: <SettingsIcon /> },
  ];

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Admin Panel
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.id} disablePadding>
            <ListItemButton
              selected={selectedSection === item.id}
              onClick={() => setSelectedSection(item.id)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  const renderContent = () => {
    switch (selectedSection) {
      case 'students':
        return <AllStudents />;
      case 'documents':
        return <DocumentManagement />;
      case 'required':
        return <RequiredDocuments embedded />;
      case 'cohorts':
        return <CohortManagement />;
      case 'overview':
        return <AdminOverview />;
      case 'categories':
        return <CategoryManagement />;
      case 'analytics':
        return <AdminAnalytics />;
      case 'settings':
        return <AdminSettings />;
      default:
        return <DocumentManagement />;
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Mentee College Admin Dashboard
          </Typography>
          <Button
            color="inherit"
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => navigate('/Dashboard')}
            sx={{ ml: 2, borderColor: 'rgba(255,255,255,0.7)' }}
          >
            Main Dashboard
          </Button>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        <Container maxWidth="lg">
          {renderContent()}
        </Container>
      </Box>
    </Box>
  );
};

// Placeholder components - you can implement these later
const AdminOverview = () => (
  <Box>
    <Typography variant="h4" gutterBottom>
      Admin Overview
    </Typography>
    <Typography>
      Welcome to the admin dashboard. Select an option from the menu to get started.
    </Typography>
  </Box>
);

const CategoryManagement = () => (
  <Box>
    <Typography variant="h4" gutterBottom>
      Category Management
    </Typography>
    <Typography>
      Category management functionality coming soon...
    </Typography>
  </Box>
);

const AdminAnalytics = () => (
  <Box>
    <Typography variant="h4" gutterBottom>
      Analytics
    </Typography>
    <Typography>
      Analytics dashboard coming soon...
    </Typography>
  </Box>
);

const AdminSettings = () => (
  <Box>
    <Typography variant="h4" gutterBottom>
      Settings
    </Typography>
    <Typography>
      Admin settings coming soon...
    </Typography>
  </Box>
);

export default AdminDashboard;