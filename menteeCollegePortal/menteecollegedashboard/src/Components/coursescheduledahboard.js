import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CourseScheduleDashboard = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect to the course schedule editor page
    navigate('/course-schedule-editor');
  }, [navigate]);

  return (
    <div>
      {/* This component just redirects to the new editor page */}
    </div>
  );
};

export default CourseScheduleDashboard;
