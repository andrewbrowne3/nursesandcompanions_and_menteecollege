import React from 'react';
import '../MyFinancialaid.css';
import { 
  Card, CardContent, Typography, Button, Box, 
  Chip, Divider, List, ListItem, ListItemIcon, ListItemText 
} from '@mui/material';
import { 
  AttachMoney, CalendarToday, DescriptionOutlined,
  AssignmentOutlined, CheckCircleOutline, PendingOutlined
} from '@mui/icons-material';

const getCurrentSemester = () => {
  const currentMonth = new Date().getMonth() + 1; // getMonth() returns 0-11
  
  if (currentMonth >= 1 && currentMonth <= 5) {
      return 'Spring';
  } else if (currentMonth >= 6 && currentMonth <= 8) {
      return 'Summer';
  } else {
      return 'Fall';
  }
};

const Myfinancialaid = () => {
  const currentSemester = getCurrentSemester();
  const currentYear = new Date().getFullYear();
  
  // Sample financial aid data
  const financialAidItems = [
    {
      name: 'Federal Nursing Scholarship',
      amount: 5000,
      status: 'Approved',
      disbursement: 'September 15, 2023'
    },
    {
      name: 'Pell Grant',
      amount: 3000,
      status: 'Approved',
      disbursement: 'September 15, 2023'
    },
    {
      name: 'Healthcare Workers Relief Fund',
      amount: 1500,
      status: 'Pending',
      disbursement: 'Pending Review'
    }
  ];

  // Calculate total aid
  const totalAid = financialAidItems.reduce((total, item) => {
    return item.status === 'Approved' ? total + item.amount : total;
  }, 0);

  return (
    <Card className="financial-aid-card dashboard-card">
      <Box className="dashboard-card-header">
        <Box className="card-header-content">
          <AttachMoney className="card-header-icon" />
          <Typography variant="h6" className="dashboard-card-title">
            My Financial Aid
          </Typography>
        </Box>
        <Chip 
          icon={<CalendarToday fontSize="small" />}
          label={`${currentSemester} ${currentYear}`}
          color="primary"
          variant="outlined"
          className="semester-badge"
        />
      </Box>
      
      <CardContent className="financial-aid-content">
        {financialAidItems.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 5 }}>
            <AttachMoney sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="body2" color="textSecondary" gutterBottom>
              No financial aid information available
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Contact the financial aid office for assistance
            </Typography>
            <Box className="financial-aid-actions" sx={{ mt: 3 }}>
              <Button
                variant="outlined"
                startIcon={<AssignmentOutlined />}
                className="apply-aid-button"
                fullWidth
                color="primary"
              >
                Apply for Financial Aid
              </Button>
            </Box>
          </Box>
        ) : (
          <>
            <Box className="aid-summary">
              <Typography variant="subtitle2" className="aid-summary-title" color="textSecondary">
                Total Financial Aid
              </Typography>
              <Typography variant="h4" className="aid-total-amount">
                ${totalAid.toLocaleString()}
              </Typography>
              <Divider className="aid-divider">
                <Chip label="Aid Details" size="small" color="primary" />
              </Divider>
            </Box>

            <List className="aid-list">
              {financialAidItems.map((aid, index) => (
            <ListItem key={index} className={`aid-item ${aid.status.toLowerCase()}`}>
              <ListItemIcon className="aid-item-icon">
                {aid.status === 'Approved' ? 
                  <CheckCircleOutline color="success" /> : 
                  <PendingOutlined color="warning" />}
              </ListItemIcon>
              <ListItemText 
                primary={
                  <Typography variant="subtitle2" className="aid-item-name">
                    {aid.name}
                  </Typography>
                }
                secondary={
                  <Box className="aid-item-details">
                    <Typography variant="body2" className="aid-item-amount">
                      ${aid.amount.toLocaleString()}
                    </Typography>
                    <Chip 
                      label={aid.status} 
                      size="small" 
                      color={aid.status === 'Approved' ? 'success' : 'warning'}
                      className="aid-status-chip"
                    />
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>

        <Box className="financial-aid-actions">
          <Button
            variant="contained"
            startIcon={<DescriptionOutlined />}
            className="view-awards-button"
            fullWidth
            color="primary"
          >
            View Award Letters
          </Button>
          <Button
            variant="outlined"
            startIcon={<AssignmentOutlined />}
            className="apply-aid-button"
            fullWidth
            color="primary"
          >
            Apply for Additional Aid
          </Button>
        </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default Myfinancialaid;