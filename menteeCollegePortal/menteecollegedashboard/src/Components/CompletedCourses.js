import React, { useState, useEffect } from 'react';
import {
  Card, CardContent, Typography, Box, Chip, List, ListItem,
  ListItemText, CircularProgress, Alert, Divider, Button, IconButton,
  Tooltip
} from '@mui/material';
import {
  MenuBook, Grade, Lock, CheckCircle, Assignment
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import axios from 'axios';
import CourseSurveyModal from './CourseSurveyModal';

const CompletedCourses = () => {
  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [surveyModalOpen, setSurveyModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);

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

      setCourses(response.data.academic_progress.completed_courses || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setError('Unable to load course information');
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade) => {
    if (!grade || grade === 'IP' || grade === 'LOCKED') return 'default';
    if (grade.startsWith('A')) return 'success';
    if (grade.startsWith('B')) return 'info';
    if (grade.startsWith('C')) return 'warning';
    return 'error';
  };

  const handleOpenSurvey = (course) => {
    setSelectedCourse(course);
    setSurveyModalOpen(true);
  };

  const handleCloseSurvey = () => {
    setSurveyModalOpen(false);
    setSelectedCourse(null);
  };

  const handleSurveyComplete = (data) => {
    // Refresh courses after survey completion
    fetchCourses();
  };

  const renderGradeChip = (course) => {
    if (course.grade === 'LOCKED' || !course.grade_released) {
      return (
        <Tooltip title="Complete survey to view grade">
          <Chip
            icon={<Lock fontSize="small" />}
            label="Locked"
            color="warning"
            size="small"
          />
        </Tooltip>
      );
    }

    return (
      <Chip
        icon={<Grade fontSize="small" />}
        label={course.grade}
        color={getGradeColor(course.grade)}
        size="small"
      />
    );
  };

  const renderSurveyAction = (course) => {
    if (course.grade === 'LOCKED' || !course.grade_released) {
      return (
        <Button
          variant="outlined"
          size="small"
          startIcon={<Assignment />}
          onClick={() => handleOpenSurvey(course)}
          sx={{ mt: 1 }}
        >
          Take Survey
        </Button>
      );
    }

    if (course.survey_completed) {
      return (
        <Chip
          icon={<CheckCircle fontSize="small" />}
          label="Survey Completed"
          color="success"
          size="small"
          variant="outlined"
          sx={{ mt: 1 }}
        />
      );
    }

    return null;
  };

  return (
    <>
      <Card className="dashboard-card">
        <Box className="dashboard-card-header">
          <Box className="card-header-content">
            <MenuBook className="card-header-icon" />
            <Typography variant="h6" className="dashboard-card-title">
              Completed Courses
            </Typography>
          </Box>
          <Chip
            label={`${courses.length} course${courses.length !== 1 ? 's' : ''}`}
            color="primary"
            variant="outlined"
            size="small"
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
                <React.Fragment key={`${course.id}-${course.semester}-${course.year}`}>
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
                      {renderGradeChip(course)}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2, width: '100%', flexWrap: 'wrap', alignItems: 'center' }}>
                      <Typography variant="body2" color="textSecondary">
                        {course.credit_hours} credit{course.credit_hours !== 1 ? 's' : ''}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {course.semester} {course.year}
                      </Typography>
                      {course.grade_points && (
                        <Typography variant="body2" color="textSecondary">
                          GPA: {course.grade_points.toFixed(2)}
                        </Typography>
                      )}
                    </Box>
                    {renderSurveyAction(course)}
                  </ListItem>
                  {index < courses.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <MenuBook sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
              <Typography variant="body2" color="textSecondary">
                No completed courses yet
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Survey Modal */}
      {selectedCourse && (
        <CourseSurveyModal
          course={selectedCourse}
          enrollmentId={selectedCourse.enrollment_id}
          open={surveyModalOpen}
          onClose={handleCloseSurvey}
          onSurveyComplete={handleSurveyComplete}
        />
      )}
    </>
  );
};

export default CompletedCourses;
