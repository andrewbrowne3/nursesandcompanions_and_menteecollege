import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  TextField,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  School,
  CheckCircle,
  Close
} from '@mui/icons-material';
import axios from 'axios';
import { useSelector } from 'react-redux';

const CourseSurveyModal = ({ course, enrollmentId, open, onClose, onSurveyComplete }) => {
  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const [responses, setResponses] = useState({
    courseQuality: '',
    instructorEffectiveness: '',
    learningObjectives: '',
    recommendation: '',
    feedback: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const API_BASE = process.env.REACT_APP_API_URL || 'https://api.menteecollege.com';

  const handleChange = (field, value) => {
    setResponses(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const isFormValid = () => {
    return (
      responses.courseQuality &&
      responses.instructorEffectiveness &&
      responses.learningObjectives &&
      responses.recommendation
    );
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      setError('Please answer all required questions');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const authToken = userInfo?.token || userInfo?.access;

      const response = await axios.post(
        `${API_BASE}/api/student/submit-course-survey/`,
        {
          enrollment_id: enrollmentId,
          responses: responses
        },
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );

      // Call onSurveyComplete with the grade data
      if (onSurveyComplete) {
        onSurveyComplete(response.data);
      }

      onClose();
    } catch (err) {
      console.error('Error submitting survey:', err);
      setError(err.response?.data?.error || 'Failed to submit survey');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '70vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <School color="primary" />
          <Typography variant="h6">
            End of Semester Survey - {course?.name}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Complete this brief survey to view your final grade
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Question 1: Overall Course Quality */}
          <FormControl component="fieldset" required>
            <FormLabel component="legend">
              <Typography variant="subtitle1" fontWeight="medium">
                1. How would you rate the overall quality of this course?
              </Typography>
            </FormLabel>
            <RadioGroup
              value={responses.courseQuality}
              onChange={(e) => handleChange('courseQuality', e.target.value)}
            >
              <FormControlLabel value="5" control={<Radio />} label="Excellent" />
              <FormControlLabel value="4" control={<Radio />} label="Good" />
              <FormControlLabel value="3" control={<Radio />} label="Average" />
              <FormControlLabel value="2" control={<Radio />} label="Below Average" />
              <FormControlLabel value="1" control={<Radio />} label="Poor" />
            </RadioGroup>
          </FormControl>

          <Divider />

          {/* Question 2: Instructor Effectiveness */}
          <FormControl component="fieldset" required>
            <FormLabel component="legend">
              <Typography variant="subtitle1" fontWeight="medium">
                2. How effective was the instructor in delivering course content?
              </Typography>
            </FormLabel>
            <RadioGroup
              value={responses.instructorEffectiveness}
              onChange={(e) => handleChange('instructorEffectiveness', e.target.value)}
            >
              <FormControlLabel value="5" control={<Radio />} label="Very Effective" />
              <FormControlLabel value="4" control={<Radio />} label="Effective" />
              <FormControlLabel value="3" control={<Radio />} label="Somewhat Effective" />
              <FormControlLabel value="2" control={<Radio />} label="Not Very Effective" />
              <FormControlLabel value="1" control={<Radio />} label="Ineffective" />
            </RadioGroup>
          </FormControl>

          <Divider />

          {/* Question 3: Learning Objectives */}
          <FormControl component="fieldset" required>
            <FormLabel component="legend">
              <Typography variant="subtitle1" fontWeight="medium">
                3. Did this course meet its stated learning objectives?
              </Typography>
            </FormLabel>
            <RadioGroup
              value={responses.learningObjectives}
              onChange={(e) => handleChange('learningObjectives', e.target.value)}
            >
              <FormControlLabel value="5" control={<Radio />} label="Strongly Agree" />
              <FormControlLabel value="4" control={<Radio />} label="Agree" />
              <FormControlLabel value="3" control={<Radio />} label="Neutral" />
              <FormControlLabel value="2" control={<Radio />} label="Disagree" />
              <FormControlLabel value="1" control={<Radio />} label="Strongly Disagree" />
            </RadioGroup>
          </FormControl>

          <Divider />

          {/* Question 4: Recommendation */}
          <FormControl component="fieldset" required>
            <FormLabel component="legend">
              <Typography variant="subtitle1" fontWeight="medium">
                4. Would you recommend this course to other students?
              </Typography>
            </FormLabel>
            <RadioGroup
              value={responses.recommendation}
              onChange={(e) => handleChange('recommendation', e.target.value)}
            >
              <FormControlLabel value="5" control={<Radio />} label="Definitely" />
              <FormControlLabel value="4" control={<Radio />} label="Probably" />
              <FormControlLabel value="3" control={<Radio />} label="Maybe" />
              <FormControlLabel value="2" control={<Radio />} label="Probably Not" />
              <FormControlLabel value="1" control={<Radio />} label="Definitely Not" />
            </RadioGroup>
          </FormControl>

          <Divider />

          {/* Question 5: Additional Feedback */}
          <FormControl component="fieldset">
            <FormLabel component="legend">
              <Typography variant="subtitle1" fontWeight="medium">
                5. Additional comments or suggestions (optional)
              </Typography>
            </FormLabel>
            <TextField
              multiline
              rows={4}
              fullWidth
              placeholder="Please share any additional feedback about this course..."
              value={responses.feedback}
              onChange={(e) => handleChange('feedback', e.target.value)}
              sx={{ mt: 1 }}
            />
          </FormControl>
        </Box>

        <Box sx={{ mt: 3, p: 2, bgcolor: 'info.50', borderRadius: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircle color="info" fontSize="small" />
            <Typography variant="body2" color="info.dark">
              Your grade will be visible immediately after submitting this survey
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          startIcon={submitting ? <CircularProgress size={20} /> : <CheckCircle />}
          onClick={handleSubmit}
          disabled={!isFormValid() || submitting}
        >
          {submitting ? 'Submitting...' : 'Submit Survey'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CourseSurveyModal;
