import React, { useState, useEffect } from 'react';
import {
  Card, CardContent, Typography, Box, Chip, List, ListItem,
  ListItemText, CircularProgress, Alert, Divider
} from '@mui/material';
import {
  MenuBook, CalendarToday, Grade
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import axios from 'axios';

const getCurrentSemester = () => {
  const currentMonth = new Date().getMonth() + 1;

  if (currentMonth >= 1 && currentMonth <= 5) {
    return 'Spring';
  } else if (currentMonth >= 6 && currentMonth <= 8) {
    return 'Summer';
  } else {
    return 'Fall';
  }
};

const CurrentCourses = () => {
  const currentSemester = getCurrentSemester();
  const currentYear = new Date().getFullYear();

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_BASE = process.env.REACT_APP_API_URL || 'https://api.menteecollege.com';

  useEffect(() => {
    if (userInfo) {
      fetchCourses();
    }
  }, [userInfo]);

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);

    try {
      const authToken = userInfo?.token || userInfo?.access;
      const response = await axios.get(`${API_BASE}/api/student/dashboard/`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      setCourses(response.data.academic_progress.current_courses || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setError('Unable to load course information');
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade) => {
    if (!grade || grade === 'IP') return 'default';
    if (grade.startsWith('A')) return 'success';
    if (grade.startsWith('B')) return 'info';
    if (grade.startsWith('C')) return 'warning';
    return 'error';
  };

  return (
    <Card className="dashboard-card">
      <Box className="dashboard-card-header">
        <Box className="card-header-content">
          <MenuBook className="card-header-icon" />
          <Typography variant="h6" className="dashboard-card-title">
            Current Courses
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

      <CardContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 3 }}>
            <CircularProgress size={30} />
            <Typography variant="body2" sx={{ ml: 2 }}>Loading courses...</Typography>
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        ) : courses.length > 0 ? (
          <List sx={{ py: 0 }}>
            {courses.map((course, index) => (
              <React.Fragment key={course.id}>
                <ListItem
                  sx={{
                    px: 0,
                    py: 1.5,
                    flexDirection: 'column',
                    alignItems: 'flex-start'
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mb: 0.5 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {course.name}
                    </Typography>
                    <Chip
                      icon={<Grade fontSize="small" />}
                      label={course.grade || 'In Progress'}
                      color={getGradeColor(course.grade)}
                      size="small"
                    />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
                    <Typography variant="body2" color="textSecondary">
                      {course.credit_hours} credit{course.credit_hours !== 1 ? 's' : ''}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {course.semester} {course.year}
                    </Typography>
                  </Box>
                </ListItem>
                {index < courses.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <MenuBook sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="body2" color="textSecondary">
              No courses enrolled for current semester
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default CurrentCourses;
