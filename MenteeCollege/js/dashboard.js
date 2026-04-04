// Dashboard functionality for MenteeCollege Analytics
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication status
    checkAuthStatus();
    
    // Load all dashboard data
    loadDashboardData();
    
    // Chart.js global options
    Chart.defaults.font.family = 'Poppins, sans-serif';
    Chart.defaults.color = '#666';
    Chart.defaults.plugins.legend.position = 'bottom';
    
    // Check if user is authenticated
    function checkAuthStatus() {
        const accessToken = localStorage.getItem('accessToken');
        const username = localStorage.getItem('username');
        
        if (!accessToken || !username) {
            console.log('User not authenticated. Redirecting to login page...');
            // Redirect to login page
            window.location.href = 'login.html?redirect=dashboard';
        } else {
            console.log('User authenticated:', username);
        }
    }
    
    // Load all dashboard data
    function loadDashboardData() {
        // Show loading message
        document.getElementById('loadingMessage').style.display = 'block';
        document.getElementById('errorMessage').style.display = 'none';
        
        // Load data from APIs
        Promise.all([
            fetchApplicationStats(),
            fetchRevenueStats(),
            fetchConversionStats(),
            fetchProgramPopularity()
        ])
        .then(([applicationData, revenueData, conversionData, popularityData]) => {
            // Hide loading message
            document.getElementById('loadingMessage').style.display = 'none';
            
            // Render all dashboard sections
            renderRevenueMetrics(revenueData);
            renderApplicationMetrics(applicationData);
            renderConversionMetrics(conversionData);
            renderProgramPopularity(popularityData);
        })
        .catch(error => {
            console.error('Error loading dashboard data:', error);
            // Show error message
            document.getElementById('loadingMessage').style.display = 'none';
            document.getElementById('errorMessage').style.display = 'block';
            document.getElementById('errorMessage').textContent = 'Error loading dashboard data. Please try again later.';
        });
    }
    
    // Fetch application stats from API
    function fetchApplicationStats() {
        return fetch('https://api.menteecollege.com/api/analytics/applications/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to fetch application stats (status: ${response.status})`);
            }
            return response.json();
        });
    }
    
    // Fetch revenue stats from API
    function fetchRevenueStats() {
        return fetch('https://api.menteecollege.com/api/analytics/revenue/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to fetch revenue stats (status: ${response.status})`);
            }
            return response.json();
        });
    }
    
    // Fetch conversion stats from API
    function fetchConversionStats() {
        return fetch('https://api.menteecollege.com/api/analytics/conversions/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to fetch conversion stats (status: ${response.status})`);
            }
            return response.json();
        });
    }
    
    // Fetch program popularity from API
    function fetchProgramPopularity() {
        return fetch('https://api.menteecollege.com/api/analytics/program-popularity/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to fetch program popularity (status: ${response.status})`);
            }
            return response.json();
        });
    }
    
    // Render revenue metrics
    function renderRevenueMetrics(data) {
        // Set summary metrics
        document.getElementById('totalRevenue').textContent = formatCurrency(data.total_revenue);
        document.getElementById('paymentCount').textContent = data.payment_count;
        document.getElementById('averagePayment').textContent = formatCurrency(data.average_payment);
        
        // Render monthly revenue chart
        const months = data.monthly_revenue.map(item => formatMonthYear(item.month));
        const revenues = data.monthly_revenue.map(item => item.revenue);
        
        new Chart(document.getElementById('revenueChart'), {
            type: 'line',
            data: {
                labels: months,
                datasets: [{
                    label: 'Monthly Revenue',
                    data: revenues,
                    borderColor: '#8460f6',
                    backgroundColor: 'rgba(132, 96, 246, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return '$' + context.parsed.y.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
        
        // Render revenue by program chart
        const programLabels = ['Diploma', 'Certificate', 'Associates'];
        const programRevenues = [
            data.revenue_by_program.diploma,
            data.revenue_by_program.certificate,
            data.revenue_by_program.associates
        ];
        
        new Chart(document.getElementById('revenueProgramChart'), {
            type: 'doughnut',
            data: {
                labels: programLabels,
                datasets: [{
                    data: programRevenues,
                    backgroundColor: ['#8460f6', '#ff5722', '#4caf50']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed;
                                const percentage = (value / programRevenues.reduce((a, b) => a + b, 0) * 100).toFixed(1);
                                return `${context.label}: ${formatCurrency(value)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Render application metrics
    function renderApplicationMetrics(data) {
        // Prepare monthly applications chart data
        const monthlyData = data.monthly_applications;
        monthlyData.sort((a, b) => a.month.localeCompare(b.month));
        
        const months = monthlyData.map(item => formatMonthYear(item.month));
        const diplomaApps = monthlyData.map(item => item.diploma);
        const certApps = monthlyData.map(item => item.certificate);
        const associatesApps = monthlyData.map(item => item.associates);
        
        new Chart(document.getElementById('applicationsChart'), {
            type: 'bar',
            data: {
                labels: months,
                datasets: [
                    {
                        label: 'Diploma',
                        data: diplomaApps,
                        backgroundColor: '#8460f6'
                    },
                    {
                        label: 'Certificate',
                        data: certApps,
                        backgroundColor: '#ff5722'
                    },
                    {
                        label: 'Associates',
                        data: associatesApps,
                        backgroundColor: '#4caf50'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Applications'
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Monthly Applications by Program Type'
                    }
                }
            }
        });
        
        // Prepare source chart data
        const sourceData = data.heard_about_sources;
        const sourceLabels = sourceData.map(item => item.source);
        const sourceCounts = sourceData.map(item => item.count);
        
        new Chart(document.getElementById('applicationSourceChart'), {
            type: 'pie',
            data: {
                labels: sourceLabels,
                datasets: [
                    {
                        data: sourceCounts,
                        backgroundColor: [
                            '#8460f6', '#ff5722', '#4caf50', '#2196f3', '#ff9800',
                            '#9c27b0', '#607d8b', '#795548', '#e91e63', '#ffeb3b'
                        ]
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'How Applicants Heard About Us'
                    }
                }
            }
        });
    }
    
    // Render conversion metrics
    function renderConversionMetrics(data) {
        // Set summary metrics
        document.getElementById('enrollmentRate').textContent = data.enrollment_rate + '%';
        document.getElementById('paymentRate').textContent = data.payment_rate + '%';
        document.getElementById('overallConversion').textContent = data.overall_conversion + '%';
        
        // Render conversion by program chart
        const programLabels = ['Diploma', 'Certificate', 'Associates'];
        const conversionRates = [
            data.program_conversion.diploma.rate,
            data.program_conversion.certificate.rate,
            data.program_conversion.associates.rate
        ];
        
        new Chart(document.getElementById('conversionChart'), {
            type: 'bar',
            data: {
                labels: programLabels,
                datasets: [{
                    label: 'Conversion Rate',
                    data: conversionRates,
                    backgroundColor: ['#8460f6', '#ff5722', '#4caf50']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Conversion Rate (%)'
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Application to Enrollment Conversion Rate by Program'
                    }
                }
            }
        });
        
        // Render funnel chart
        new Chart(document.getElementById('funnelChart'), {
            type: 'bar',
            data: {
                labels: ['Applications', 'Enrollments', 'Paying Students'],
                datasets: [{
                    data: [data.total_applications, data.enrolled_students, data.paying_students],
                    backgroundColor: ['#8460f6', '#ff5722', '#4caf50']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Enrollment Funnel'
                    }
                }
            }
        });
    }
    
    // Render program popularity
    function renderProgramPopularity(data) {
        // Get top 5 programs by enrollment count
        const programData = [];
        
        // Combine all program types
        if (data.program_enrollments.diploma) {
            data.program_enrollments.diploma.forEach(item => {
                programData.push({name: item.program_name + " (Diploma)", count: item.count});
            });
        }
        
        if (data.program_enrollments.certificate) {
            data.program_enrollments.certificate.forEach(item => {
                programData.push({name: item.program_name + " (Certificate)", count: item.count});
            });
        }
        
        if (data.program_enrollments.associates) {
            data.program_enrollments.associates.forEach(item => {
                programData.push({name: item.program_name + " (Associates)", count: item.count});
            });
        }
        
        // Sort by count and take top 5
        programData.sort((a, b) => b.count - a.count);
        const top5Programs = programData.slice(0, 5);
        
        // Render popular programs chart
        new Chart(document.getElementById('popularProgramsChart'), {
            type: 'bar',
            data: {
                labels: top5Programs.map(item => item.name),
                datasets: [{
                    label: 'Number of Enrollments',
                    data: top5Programs.map(item => item.count),
                    backgroundColor: '#8460f6'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: {
                    title: {
                        display: true,
                        text: 'Top 5 Most Popular Programs'
                    }
                }
            }
        });
        
        // Render revenue courses chart
        const topCourses = data.course_revenue.slice(0, 5);
        
        new Chart(document.getElementById('revenueCoursesChart'), {
            type: 'bar',
            data: {
                labels: topCourses.map(item => item.course),
                datasets: [{
                    label: 'Revenue',
                    data: topCourses.map(item => item.revenue),
                    backgroundColor: '#ff5722'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                scales: {
                    x: {
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Top 5 Revenue-Generating Courses'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return '$' + context.parsed.x.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Helper function to format currency
    function formatCurrency(value) {
        return '$' + parseFloat(value).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    }
    
    // Helper function to format month-year from YYYY-MM
    function formatMonthYear(dateStr) {
        if (!dateStr) return '';
        
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const parts = dateStr.split('-');
        
        if (parts.length !== 2) return dateStr;
        
        const year = parts[0];
        const month = parseInt(parts[1], 10) - 1;
        
        return `${months[month]} ${year}`;
    }
}); 