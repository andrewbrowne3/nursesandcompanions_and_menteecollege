import React, { useState, useEffect } from 'react';
import {
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Chip,
  List,
  ListItem,
  Button,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import {
  ExpandMore,
  Grade,
  Lock,
  CheckCircle,
  Assignment
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import axios from 'axios';
import CourseSurveyModal from './CourseSurveyModal';

const AcademicRecords = () => {
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
      setError('Unable to load academic records');
    } finally {
      setLoading(false);
    }
  };

  // Group courses by semester and year
  const groupBySemester = () => {
    const grouped = {};

    courses.forEach(course => {
      const key = `${course.semester} ${course.year}`;
      if (!grouped[key]) {
        grouped[key] = {
          semester: course.semester,
          year: course.year,
          courses: []
        };
      }
      grouped[key].courses.push(course);
    });

    // Sort by year and semester (most recent first)
    const semesterOrder = { 'Fall': 3, 'Summer': 2, 'Spring': 1 };
    return Object.values(grouped).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return (semesterOrder[b.semester] || 0) - (semesterOrder[a.semester] || 0);
    });
  };

  // Calculate semester GPA
  const calculateSemesterGPA = (semesterCourses) => {
    let totalPoints = 0;
    let totalCredits = 0;

    semesterCourses.forEach(course => {
      if (course.grade_points !== null && course.grade_points !== undefined) {
        totalPoints += course.grade_points * course.credit_hours;
        totalCredits += course.credit_hours;
      }
    });

    return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 'N/A';
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

  const handleSurveyComplete = () => {
    fetchCourses();
  };

  const semesterGroups = groupBySemester();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 5 }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ ml: 2 }}>Loading academic records...</Typography>
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (courses.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 5 }}>
        <Grade sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          No Academic Records Yet
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Your completed courses and grades will appear here
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Summary Header */}
      <Box sx={{ mb: 3, p: 2, bgcolor: 'primary.50', borderRadius: 1 }}>
        <Typography variant="subtitle2" color="primary">
          Academic History
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {courses.length} course{courses.length !== 1 ? 's' : ''} completed across {semesterGroups.length} semester{semesterGroups.length !== 1 ? 's' : ''}
        </Typography>
      </Box>

      {/* Semester Accordions */}
      {semesterGroups.map((group, index) => {
        const semesterGPA = calculateSemesterGPA(group.courses);

        return (
          <Accordion key={`${group.semester}-${group.year}`} defaultExpanded={index === 0}>
            <AccordionSummary
              expandIcon={<ExpandMore />}
              sx={{
                bgcolor: 'background.paper',
                '&:hover': { bgcolor: 'action.hover' }
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', pr: 2 }}>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {group.semester} {group.year}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {group.courses.length} course{group.courses.length !== 1 ? 's' : ''}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Semester GPA:
                  </Typography>
                  <Chip
                    label={semesterGPA}
                    color={parseFloat(semesterGPA) >= 3.5 ? 'success' : parseFloat(semesterGPA) >= 2.5 ? 'info' : 'warning'}
                    size="small"
                  />
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <List sx={{ width: '100%' }}>
                {group.courses.map((course, courseIndex) => (
                  <React.Fragment key={`${course.id}-${course.enrollment_id}`}>
                    <ListItem
                      sx={{
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        py: 2
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mb: 1 }}>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {course.name}
                        </Typography>
                        {course.grade === 'LOCKED' || !course.grade_released ? (
                          <Chip
                            icon={<Lock fontSize="small" />}
                            label="Locked"
                            color="warning"
                            size="small"
                          />
                        ) : (
                          <Chip
                            icon={<Grade fontSize="small" />}
                            label={course.grade}
                            color={getGradeColor(course.grade)}
                            size="small"
                          />
                        )}
                      </Box>

                      <Box sx={{ display: 'flex', gap: 3, width: '100%', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          {course.credit_hours} credit{course.credit_hours !== 1 ? 's' : ''}
                        </Typography>
                        {course.grade_points !== null && course.grade_points !== undefined && course.grade_released && (
                          <Typography variant="body2" color="text.secondary">
                            Grade Points: {course.grade_points.toFixed(2)}
                          </Typography>
                        )}

                        {/* Survey Action */}
                        {(course.grade === 'LOCKED' || !course.grade_released) && !course.survey_completed && (
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<Assignment />}
                            onClick={() => handleOpenSurvey(course)}
                            sx={{ ml: 'auto' }}
                          >
                            Take Survey to Unlock Grade
                          </Button>
                        )}

                        {course.survey_completed && (
                          <Chip
                            icon={<CheckCircle fontSize="small" />}
                            label="Survey Completed"
                            color="success"
                            size="small"
                            variant="outlined"
                            sx={{ ml: 'auto' }}
                          />
                        )}
                      </Box>
                    </ListItem>
                    {courseIndex < group.courses.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        );
      })}

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
    </Box>
  );
};

export default AcademicRecords;
