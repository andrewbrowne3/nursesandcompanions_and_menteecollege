// Calendar functionality for MenteeCollege and NursesAndCompanions
document.addEventListener('DOMContentLoaded', function() {
    var calendarEl = document.getElementById('calendar');
    var calendarInstance;
    
    // Check authentication status
    checkAuthStatus();
    
    // Load organizations from API
    loadOrganizations();
    
    // Initial data load
    loadCalendarData();
    
    // Set up event creation form
    setupEventForm();
    
    // Check if user is authenticated
    function checkAuthStatus() {
        const accessToken = localStorage.getItem('accessToken');
        const username = localStorage.getItem('username');
        
        // If no token or username is found, redirect to login page
        if (!accessToken || !username) {
            console.log('User not authenticated. Redirecting to login page...');
            // For read-only access, we can continue without redirection
            // Uncomment the next line to enforce login for all calendar access
            // window.location.href = 'login.html?redirect=calendar';
        } else {
            console.log('User authenticated:', username);
            // Add a login status indicator to the calendar page
            const filterContainer = document.querySelector('.filter-container');
            if (filterContainer) {
                const loginStatus = document.createElement('div');
                loginStatus.className = 'login-status';
                loginStatus.innerHTML = `<span>Logged in as: ${username}</span>`;
                filterContainer.appendChild(loginStatus);
            }
        }
    }
    
    // Initialize FullCalendar
    function initializeCalendar(events) {
        var calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth'
            },
            events: events,
            eventClick: function(info) {
                showEventDetails(info.event);
            },
            eventDidMount: function(info) {
                applyEventStyling(info);
            },
            dayMaxEvents: true, // Allow "more" link when too many events
            height: 'auto',
            themeSystem: 'bootstrap',
            dateClick: function(info) {
                // Only handle date click if user is authenticated
                const accessToken = localStorage.getItem('accessToken');
                if (accessToken) {
                    // Set the selected date in the event form
                    document.getElementById('eventStartDateInput').value = info.dateStr;
                    document.getElementById('eventEndDateInput').value = info.dateStr;
                    
                    // Open the add event modal
                    $('#addEventModal').modal('show');
                }
            }
        });
        
        calendar.render();
        calendarInstance = calendar;
        return calendar;
    }
    
    // Load calendar data from API
    function loadCalendarData() {
        // Check if we have an access token for authenticated requests
        const accessToken = localStorage.getItem('accessToken');
        
        // Try to fetch real data from the API if user is authenticated
        if (accessToken) {
            console.log('Fetching calendar data from API...');
            fetch('https://api.menteecollege.com/api/calendar-events/', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                }
            })
            .then(response => {
                console.log('Calendar data response status:', response.status);
                
                if (!response.ok) {
                    console.warn('Failed to fetch calendar data from API (status: ' + response.status + '). Using sample data instead.');
                    loadSampleData();
                    return null;
                }
                
                // Handle successful response
                return response.text().then(text => {
                    try {
                        return JSON.parse(text);
                    } catch (e) {
                        console.warn('Server returned non-JSON response for calendar data:', text);
                        loadSampleData();
                        return null;
                    }
                });
            })
            .then(data => {
                if (data) {
                    console.log('Successfully loaded calendar data from API:', data.length + ' events');
                    initializeCalendarWithData(data);
                }
            })
            .catch(error => {
                console.error('Error fetching calendar data:', error);
                loadSampleData();
            });
            
            // Load categories for the create form
            loadCategoriesForForm();
        } else {
            // Not authenticated, load sample data
            console.log('No authentication token available. Using sample data.');
            loadSampleData();
        }
    }
    
    // Load categories for the create form dropdown
    function loadCategoriesForForm() {
        const accessToken = localStorage.getItem('accessToken');
        
        if (accessToken) {
            console.log('Fetching calendar categories from API...');
            fetch('https://api.menteecollege.com/api/calendar-categories/', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                }
            })
            .then(response => {
                console.log('Categories response status:', response.status);
                
                if (!response.ok) {
                    console.warn('Failed to fetch calendar categories (status: ' + response.status + ')');
                    return null;
                }
                
                // Handle successful response
                return response.text().then(text => {
                    try {
                        return JSON.parse(text);
                    } catch (e) {
                        console.warn('Server returned non-JSON response for categories:', text);
                        return null;
                    }
                });
            })
            .then(data => {
                if (data) {
                    console.log('Successfully loaded calendar categories:', data.length + ' categories');
                    populateCategoryDropdown(data);
                }
            })
            .catch(error => {
                console.error('Error fetching calendar categories:', error);
            });
        }
    }
    
    // Populate the category dropdown in the form
    function populateCategoryDropdown(categories) {
        const categorySelect = document.getElementById('eventCategoryInput');
        
        // Clear existing options except the first one
        while (categorySelect.options.length > 1) {
            categorySelect.remove(1);
        }
        
        // Group categories by organization
        const categoriesByOrg = {};
        categories.forEach(category => {
            if (!categoriesByOrg[category.organization]) {
                categoriesByOrg[category.organization] = [];
            }
            categoriesByOrg[category.organization].push(category);
        });
        
        // Add categories as optgroups
        for (const org in categoriesByOrg) {
            const optgroup = document.createElement('optgroup');
            optgroup.label = org;
            
            categoriesByOrg[org].forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.text = category.name;
                option.setAttribute('data-org', org);
                option.setAttribute('data-org-id', category.organization_id || '');
                optgroup.appendChild(option);
            });
            
            categorySelect.appendChild(optgroup);
        }
        
        // Log for debugging
        console.log('Populated categories dropdown with', Object.keys(categoriesByOrg).length, 'organizations');
        for (const org in categoriesByOrg) {
            console.log(`- ${org}: ${categoriesByOrg[org].length} categories`);
        }
    }
    
    // Set up the event creation form
    function setupEventForm() {
        // Handle organization selection change to filter categories
        const orgSelect = document.getElementById('eventOrganizationInput');
        const categorySelect = document.getElementById('eventCategoryInput');
        
        if (orgSelect) {
            orgSelect.addEventListener('change', function() {
                const selectedOrg = this.value;
                const selectedOption = this.options[this.selectedIndex];
                const selectedOrgName = selectedOption ? selectedOption.text : '';
                
                // Skip if no org is selected or no categories are loaded yet
                if (!selectedOrg || categorySelect.options.length <= 1) return;
                
                console.log('Selected organization:', selectedOrgName, 'ID:', selectedOrg);
                
                // Show only categories for the selected organization
                // First, show all options to reset
                Array.from(categorySelect.options).forEach(option => {
                    option.style.display = '';
                });
                
                // Filter optgroups if they exist
                const optgroups = categorySelect.querySelectorAll('optgroup');
                if (optgroups.length > 0) {
                    optgroups.forEach(optgroup => {
                        if (optgroup.label === selectedOrgName) {
                            optgroup.style.display = '';
                        } else {
                            optgroup.style.display = 'none';
                        }
                    });
                } else {
                    // Filter individual options by data-org attribute
                    Array.from(categorySelect.options).forEach(option => {
                        if (option.value === "" || option.getAttribute('data-org') === selectedOrgName) {
                            option.style.display = '';
                        } else {
                            option.style.display = 'none';
                        }
                    });
                }
                
                // Reset category selection
                categorySelect.value = "";
            });
        }
        
        // Handle all-day checkbox
        const allDayCheckbox = document.getElementById('eventAllDayInput');
        const startTimeInput = document.getElementById('eventStartTimeInput');
        const endTimeInput = document.getElementById('eventEndTimeInput');
        
        if (allDayCheckbox) {
            allDayCheckbox.addEventListener('change', function() {
                if (this.checked) {
                    startTimeInput.disabled = true;
                    endTimeInput.disabled = true;
                } else {
                    startTimeInput.disabled = false;
                    endTimeInput.disabled = false;
                }
            });
        }
        
        // Handle save button click
        const saveButton = document.getElementById('saveEventButton');
        if (saveButton) {
            saveButton.addEventListener('click', function() {
                const eventId = document.getElementById('eventIdInput').value;
                if (eventId) {
                    // Editing existing event
                    updateEvent(eventId);
                } else {
                    // Creating new event
                    saveEvent();
                }
            });
        }
    }
    
    // Save a new event
    function saveEvent() {
        const accessToken = localStorage.getItem('accessToken');
        const username = localStorage.getItem('username');
        
        if (!accessToken) {
            alert('You must be logged in to create events');
            window.location.href = 'login.html?redirect=calendar';
            return;
        }
        
        // Validate required fields
        const title = document.getElementById('eventTitleInput').value;
        const organization = document.getElementById('eventOrganizationInput').value;
        const category = document.getElementById('eventCategoryInput').value;
        const startDate = document.getElementById('eventStartDateInput').value;
        
        if (!title || !organization || !category || !startDate) {
            alert('Please fill in all required fields (Title, Organization, Category, Start Date)');
            return;
        }
        
        // Get form values
        const isAllDay = document.getElementById('eventAllDayInput').checked;
        const startTime = isAllDay ? '00:00' : document.getElementById('eventStartTimeInput').value || '00:00';
        const endDate = document.getElementById('eventEndDateInput').value || startDate;
        const endTime = isAllDay ? '23:59' : document.getElementById('eventEndTimeInput').value || startTime;
        
        const startDateTime = `${startDate}T${startTime}`;
        const endDateTime = `${endDate}T${endTime}`;
        
        // Get organization ID if possible
        let organizationValue = organization;
        // If the organization select has data-id attributes, use that instead of the name
        const orgSelect = document.getElementById('eventOrganizationInput');
        const selectedOption = orgSelect.options[orgSelect.selectedIndex];
        if (selectedOption && selectedOption.getAttribute('data-id')) {
            organizationValue = selectedOption.getAttribute('data-id');
        }
        
        // Create event data object
        const eventData = {
            title: title,
            organization: organizationValue,
            category: category, // This should already be the category ID from the form
            start_datetime: startDateTime,
            end_datetime: endDateTime,
            all_day: isAllDay,
            location: document.getElementById('eventLocationInput').value,
            event_type: document.getElementById('eventTypeInput').value,
            priority: document.getElementById('eventPriorityInput').value,
            status: document.getElementById('eventStatusInput').value,
            description: document.getElementById('eventDescriptionInput').value,
            created_by: username // Add the username as created_by
        };
        
        // Log the payload for debugging
        console.log('Sending calendar event data:', eventData);
        
        // Send to API
        fetch('https://api.menteecollege.com/api/calendar-events/create/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify(eventData)
        })
        .then(response => {
            console.log('Response status:', response.status);
            // Store the response clone to check the text if JSON parsing fails
            const responseClone = response.clone();
            
            if (!response.ok) {
                // Try to parse as JSON, but have a fallback for text/html responses
                return response.text().then(text => {
                    try {
                        // Try to parse as JSON
                        const data = JSON.parse(text);
                        console.error('Server returned error JSON:', data);
                        return Promise.reject(new Error(`Failed to create event: ${JSON.stringify(data)}`));
                    } catch (e) {
                        // If it's not JSON, log the HTML/text and create a user-friendly error
                        console.error('Server returned non-JSON error:', text);
                        // Extract a meaningful message if possible
                        let errorMessage = 'Server error';
                        if (text.includes('<!DOCTYPE')) {
                            errorMessage = `Server returned HTML error page (status ${response.status})`;
                        }
                        return Promise.reject(new Error(errorMessage));
                    }
                });
            }
            
            // Handle successful response
            return response.text().then(text => {
                try {
                    return JSON.parse(text);
                } catch (e) {
                    console.warn('Server returned non-JSON success response:', text);
                    return { message: 'Event created, but response was not valid JSON' };
                }
            });
        })
        .then(data => {
            console.log('Event created successfully:', data);
            alert('Event created successfully!');
            
            // Close the modal
            $('#addEventModal').modal('hide');
            
            // Reset the form
            document.getElementById('addEventForm').reset();
            
            // Reload calendar data
            loadCalendarData();
        })
        .catch(error => {
            console.error('Error creating event:', error);
            alert('Error creating event: ' + error.message);
        });
    }
    
    // Load calendar with sample data
    function loadSampleData() {
        // Sample events data
        var sampleEvents = [
            {
                id: '1',
                title: 'Nursing Assistant Certification Exam',
                start: '2023-09-15T09:00:00',
                end: '2023-09-15T12:00:00',
                extendedProps: {
                    organization: 'MenteeCollege',
                    category: 'Exams',
                    location: 'Room 101',
                    event_type: 'exam',
                    priority: 'high',
                    status: 'planned',
                    description: 'Final certification exam for Nursing Assistant program.'
                }
            },
            {
                id: '2',
                title: 'Student Orientation',
                start: '2023-09-10',
                allDay: true,
                extendedProps: {
                    organization: 'MenteeCollege',
                    category: 'Academic',
                    location: 'Main Auditorium',
                    event_type: 'meeting',
                    priority: 'medium',
                    status: 'planned',
                    description: 'Orientation for new students starting in Fall semester.'
                }
            },
            {
                id: '3',
                title: 'Recruitment Drive',
                start: '2023-09-20T10:00:00',
                end: '2023-09-22T16:00:00',
                extendedProps: {
                    organization: 'NursesAndCompanions',
                    category: 'Recruiting',
                    location: 'Atlanta Convention Center',
                    event_type: 'other',
                    priority: 'high',
                    status: 'planned',
                    description: 'Annual recruitment drive for new healthcare workers.'
                }
            },
            {
                id: '4',
                title: 'Financial Aid Deadline',
                start: '2023-09-30',
                allDay: true,
                extendedProps: {
                    organization: 'MenteeCollege',
                    category: 'Financial',
                    location: '',
                    event_type: 'deadline',
                    priority: 'critical',
                    status: 'planned',
                    description: 'Last day to submit financial aid applications for the upcoming semester.'
                }
            },
            {
                id: '5',
                title: 'Ultrasound Course Milestone',
                start: '2023-09-18',
                allDay: true,
                extendedProps: {
                    organization: 'MenteeCollege',
                    category: 'Academic',
                    location: 'Lab 3',
                    event_type: 'checkpoint',
                    priority: 'medium',
                    status: 'planned',
                    description: 'Students must demonstrate mastery of basic ultrasound techniques.'
                }
            }
        ];
        
        // Dummy categories for the filter
        var sampleCategories = [
            { id: '1', name: 'Academic', organization: 'MenteeCollege' },
            { id: '2', name: 'Financial', organization: 'MenteeCollege' },
            { id: '3', name: 'Exams', organization: 'MenteeCollege' },
            { id: '4', name: 'Recruiting', organization: 'NursesAndCompanions' }
        ];
        
        // Load the dummy categories into the filter
        loadCategories(sampleCategories);
        
        // Initialize calendar with sample events
        initializeCalendarWithData(sampleEvents);
    }
    
    // Initialize calendar with provided data
    function initializeCalendarWithData(events) {
        var calendar = initializeCalendar(events);
        setupFilters(calendar, events);
    }
    
    // Load categories from API or sample data
    function loadCategories(categories) {
        var categorySelect = document.getElementById('categoryFilter');
        
        // Clear existing options except the first one
        while (categorySelect.options.length > 1) {
            categorySelect.remove(1);
        }
        
        // Add new category options
        categories.forEach(function(category) {
            var option = document.createElement('option');
            option.value = category.name;
            option.text = category.name;
            categorySelect.appendChild(option);
        });
    }
    
    // Set up the filter functionality
    function setupFilters(calendar, events) {
        document.getElementById('organizationFilter').addEventListener('change', applyFilters);
        document.getElementById('categoryFilter').addEventListener('change', applyFilters);
        document.getElementById('priorityFilter').addEventListener('change', applyFilters);
        document.getElementById('statusFilter').addEventListener('change', applyFilters);
        
        function applyFilters() {
            var organization = document.getElementById('organizationFilter').value;
            var category = document.getElementById('categoryFilter').value;
            var priority = document.getElementById('priorityFilter').value;
            var status = document.getElementById('statusFilter').value;
            
            var filteredEvents = events.filter(function(event) {
                if (organization !== 'all' && event.extendedProps.organization !== organization) {
                    return false;
                }
                
                if (category !== 'all' && event.extendedProps.category !== category) {
                    return false;
                }
                
                if (priority !== 'all' && event.extendedProps.priority !== priority) {
                    return false;
                }
                
                if (status !== 'all' && event.extendedProps.status !== status) {
                    return false;
                }
                
                return true;
            });
            
            // Re-render with filtered events
            calendar.removeAllEvents();
            calendar.addEventSource(filteredEvents);
        }
    }
    
    // Show event details in the modal
    function showEventDetails(event) {
        document.getElementById('eventTitle').textContent = event.title;
        document.getElementById('eventOrganization').textContent = event.extendedProps.organization || 'N/A';
        document.getElementById('eventCategory').textContent = event.extendedProps.category || 'N/A';
        
        var dateText = event.start ? event.start.toLocaleDateString() : 'N/A';
        if (event.end) {
            dateText += ' to ' + event.end.toLocaleDateString();
        }
        document.getElementById('eventDate').textContent = dateText;
        
        var timeText = 'All day';
        if (!event.allDay && event.start) {
            timeText = formatTime(event.start);
            if (event.end) {
                timeText += ' - ' + formatTime(event.end);
            }
        }
        document.getElementById('eventTime').textContent = timeText;
        
        document.getElementById('eventLocation').textContent = event.extendedProps.location || 'N/A';
        document.getElementById('eventType').textContent = formatEventType(event.extendedProps.event_type) || 'N/A';
        document.getElementById('eventPriority').textContent = formatPriority(event.extendedProps.priority) || 'N/A';
        document.getElementById('eventStatus').textContent = formatStatus(event.extendedProps.status) || 'N/A';
        document.getElementById('eventDescription').textContent = event.extendedProps.description || 'No description available';
        
        // Add edit/delete buttons if user is authenticated
        const accessToken = localStorage.getItem('accessToken');
        const modalFooter = document.querySelector('#eventModal .modal-footer');
        
        // Remove any existing edit/delete buttons
        const existingEditBtn = document.getElementById('editEventBtn');
        const existingDeleteBtn = document.getElementById('deleteEventBtn');
        if (existingEditBtn) existingEditBtn.remove();
        if (existingDeleteBtn) existingDeleteBtn.remove();
        
        // Add edit/delete buttons if authenticated
        if (accessToken) {
            // Add edit button
            const editBtn = document.createElement('button');
            editBtn.type = 'button';
            editBtn.className = 'btn btn-primary';
            editBtn.id = 'editEventBtn';
            editBtn.textContent = 'Edit';
            editBtn.addEventListener('click', function() {
                // Populate the edit form with the event data
                populateEditForm(event);
                // Hide details modal and show edit modal
                $('#eventModal').modal('hide');
                $('#addEventModal').modal('show');
            });
            
            // Add delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.type = 'button';
            deleteBtn.className = 'btn btn-danger';
            deleteBtn.id = 'deleteEventBtn';
            deleteBtn.textContent = 'Delete';
            deleteBtn.addEventListener('click', function() {
                if (confirm('Are you sure you want to delete this event?')) {
                    deleteEvent(event.id);
                }
            });
            
            // Insert the buttons before the close button
            modalFooter.insertBefore(editBtn, modalFooter.firstChild);
            modalFooter.insertBefore(deleteBtn, modalFooter.firstChild);
        }
        
        // Show the modal
        $('#eventModal').modal('show');
    }
    
    // Populate the edit form with event data
    function populateEditForm(event) {
        // Set event ID in a hidden field (we'll add this to the form)
        document.getElementById('eventIdInput').value = event.id;
        
        // Set the form title to indicate we're editing
        document.getElementById('addEventModalLabel').textContent = 'Edit Event';
        
        // Set form fields with event data
        document.getElementById('eventTitleInput').value = event.title;
        
        // Get the organization ID if possible
        let organizationId = null;
        if (event.extendedProps.organizationId) {
            organizationId = event.extendedProps.organizationId;
        }
        
        // Set organization
        const orgSelect = document.getElementById('eventOrganizationInput');
        // First try to select by ID
        if (organizationId) {
            for (let i = 0; i < orgSelect.options.length; i++) {
                if (orgSelect.options[i].value === organizationId || 
                    orgSelect.options[i].getAttribute('data-id') === organizationId) {
                    orgSelect.selectedIndex = i;
                    break;
                }
            }
        } else {
            // Fall back to selecting by name
            for (let i = 0; i < orgSelect.options.length; i++) {
                if (orgSelect.options[i].text === event.extendedProps.organization) {
                    orgSelect.selectedIndex = i;
                    break;
                }
            }
        }
        
        // Trigger change event to load the proper categories
        const changeEvent = new Event('change');
        orgSelect.dispatchEvent(changeEvent);
        
        // Set category (wait a moment for categories to load if needed)
        setTimeout(() => {
            const catSelect = document.getElementById('eventCategoryInput');
            // First try by ID if we have it
            const categoryId = event.extendedProps.categoryId;
            
            if (categoryId) {
                for (let i = 0; i < catSelect.options.length; i++) {
                    if (catSelect.options[i].value === categoryId) {
                        catSelect.selectedIndex = i;
                        break;
                    }
                }
            } else {
                // Fall back to selection by name
                for (let i = 0; i < catSelect.options.length; i++) {
                    if (catSelect.options[i].text === event.extendedProps.category) {
                        catSelect.selectedIndex = i;
                        break;
                    }
                }
            }
        }, 500);
        
        // Set dates and times
        if (event.start) {
            const startDate = event.start.toISOString().split('T')[0];
            document.getElementById('eventStartDateInput').value = startDate;
            
            if (!event.allDay) {
                const startTime = event.start.toISOString().split('T')[1].substring(0, 5);
                document.getElementById('eventStartTimeInput').value = startTime;
            }
        }
        
        if (event.end) {
            const endDate = event.end.toISOString().split('T')[0];
            document.getElementById('eventEndDateInput').value = endDate;
            
            if (!event.allDay) {
                const endTime = event.end.toISOString().split('T')[1].substring(0, 5);
                document.getElementById('eventEndTimeInput').value = endTime;
            }
        }
        
        // Set all day
        document.getElementById('eventAllDayInput').checked = event.allDay;
        document.getElementById('eventStartTimeInput').disabled = event.allDay;
        document.getElementById('eventEndTimeInput').disabled = event.allDay;
        
        // Set other fields
        document.getElementById('eventLocationInput').value = event.extendedProps.location || '';
        
        const eventTypeSelect = document.getElementById('eventTypeInput');
        if (event.extendedProps.event_type) {
            eventTypeSelect.value = event.extendedProps.event_type;
        }
        
        const prioritySelect = document.getElementById('eventPriorityInput');
        if (event.extendedProps.priority) {
            prioritySelect.value = event.extendedProps.priority;
        }
        
        const statusSelect = document.getElementById('eventStatusInput');
        if (event.extendedProps.status) {
            statusSelect.value = event.extendedProps.status;
        }
        
        document.getElementById('eventDescriptionInput').value = event.extendedProps.description || '';
        
        // Update save button text (but don't change onclick handler)
        const saveButton = document.getElementById('saveEventButton');
        saveButton.textContent = 'Update Event';
    }
    
    // Reset the form when the modal is hidden (clicked close or cancel)
    $('#addEventModal').on('hidden.bs.modal', function() {
        // Reset form
        document.getElementById('addEventForm').reset();
        document.getElementById('eventIdInput').value = '';
        
        // Reset form title
        document.getElementById('addEventModalLabel').textContent = 'Add New Event';
        
        // Reset save button text
        const saveButton = document.getElementById('saveEventButton');
        saveButton.textContent = 'Save Event';
    });
    
    // Delete an event
    function deleteEvent(eventId) {
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
            alert('You must be logged in to delete events');
            window.location.href = 'login.html?redirect=calendar';
            return;
        }
        
        fetch(`https://api.menteecollege.com/api/calendar-events/delete/${eventId}/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            }
        })
        .then(response => {
            console.log('Delete response status:', response.status);
            
            if (!response.ok) {
                // Try to parse as JSON, but have a fallback for text/html responses
                return response.text().then(text => {
                    try {
                        // Try to parse as JSON
                        const data = JSON.parse(text);
                        console.error('Server returned error JSON:', data);
                        return Promise.reject(new Error(`Failed to delete event: ${JSON.stringify(data)}`));
                    } catch (e) {
                        // If it's not JSON, log the HTML/text and create a user-friendly error
                        console.error('Server returned non-JSON error:', text);
                        // Extract a meaningful message if possible
                        let errorMessage = 'Server error';
                        if (text.includes('<!DOCTYPE')) {
                            errorMessage = `Server returned HTML error page (status ${response.status})`;
                        }
                        return Promise.reject(new Error(errorMessage));
                    }
                });
            }
            
            // Handle successful response
            return response.text().then(text => {
                try {
                    return JSON.parse(text);
                } catch (e) {
                    console.warn('Server returned non-JSON success response:', text);
                    return { message: 'Event deleted, but response was not valid JSON' };
                }
            });
        })
        .then(data => {
            alert('Event deleted successfully');
            // Close the modal
            $('#eventModal').modal('hide');
            // Reload calendar data
            loadCalendarData();
        })
        .catch(error => {
            console.error('Error deleting event:', error);
            alert('Error deleting event: ' + error.message);
        });
    }
    
    // Update an existing event
    function updateEvent(eventId) {
        const accessToken = localStorage.getItem('accessToken');
        const username = localStorage.getItem('username');
        
        if (!accessToken) {
            alert('You must be logged in to update events');
            window.location.href = 'login.html?redirect=calendar';
            return;
        }
        
        // Validate required fields
        const title = document.getElementById('eventTitleInput').value;
        const organization = document.getElementById('eventOrganizationInput').value;
        const category = document.getElementById('eventCategoryInput').value;
        const startDate = document.getElementById('eventStartDateInput').value;
        
        if (!title || !organization || !category || !startDate) {
            alert('Please fill in all required fields (Title, Organization, Category, Start Date)');
            return;
        }
        
        // Get form values
        const isAllDay = document.getElementById('eventAllDayInput').checked;
        const startTime = isAllDay ? '00:00' : document.getElementById('eventStartTimeInput').value || '00:00';
        const endDate = document.getElementById('eventEndDateInput').value || startDate;
        const endTime = isAllDay ? '23:59' : document.getElementById('eventEndTimeInput').value || startTime;
        
        const startDateTime = `${startDate}T${startTime}`;
        const endDateTime = `${endDate}T${endTime}`;
        
        // Get organization ID if possible
        let organizationValue = organization;
        // If the organization select has data-id attributes, use that instead of the name
        const orgSelect = document.getElementById('eventOrganizationInput');
        const selectedOption = orgSelect.options[orgSelect.selectedIndex];
        if (selectedOption && selectedOption.getAttribute('data-id')) {
            organizationValue = selectedOption.getAttribute('data-id');
        }
        
        // Create event data object
        const eventData = {
            title: title,
            organization: organizationValue,
            category: category, // This should already be the category ID from the form
            start_datetime: startDateTime,
            end_datetime: endDateTime,
            all_day: isAllDay,
            location: document.getElementById('eventLocationInput').value,
            event_type: document.getElementById('eventTypeInput').value,
            priority: document.getElementById('eventPriorityInput').value,
            status: document.getElementById('eventStatusInput').value,
            description: document.getElementById('eventDescriptionInput').value,
            created_by: username // Add the username as created_by
        };
        
        // Log the payload for debugging
        console.log('Updating calendar event:', eventId);
        console.log('Event data:', eventData);
        
        // Send to API
        fetch(`https://api.menteecollege.com/api/calendar-events/update/${eventId}/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify(eventData)
        })
        .then(response => {
            console.log('Update response status:', response.status);
            // Store the response clone to check the text if JSON parsing fails
            const responseClone = response.clone();
            
            if (!response.ok) {
                // Try to parse as JSON, but have a fallback for text/html responses
                return response.text().then(text => {
                    try {
                        // Try to parse as JSON
                        const data = JSON.parse(text);
                        console.error('Server returned error JSON:', data);
                        return Promise.reject(new Error(`Failed to update event: ${JSON.stringify(data)}`));
                    } catch (e) {
                        // If it's not JSON, log the HTML/text and create a user-friendly error
                        console.error('Server returned non-JSON error:', text);
                        // Extract a meaningful message if possible
                        let errorMessage = 'Server error';
                        if (text.includes('<!DOCTYPE')) {
                            errorMessage = `Server returned HTML error page (status ${response.status})`;
                        }
                        return Promise.reject(new Error(errorMessage));
                    }
                });
            }
            
            // Handle successful response
            return response.text().then(text => {
                try {
                    return JSON.parse(text);
                } catch (e) {
                    console.warn('Server returned non-JSON success response:', text);
                    return { message: 'Event updated, but response was not valid JSON' };
                }
            });
        })
        .then(data => {
            console.log('Event updated successfully:', data);
            alert('Event updated successfully!');
            
            // Close the modal
            $('#addEventModal').modal('hide');
            
            // Reload calendar data
            loadCalendarData();
        })
        .catch(error => {
            console.error('Error updating event:', error);
            alert('Error updating event: ' + error.message);
        });
    }
    
    // Apply styling to events based on priority
    function applyEventStyling(info) {
        if (info.event.extendedProps.priority) {
            info.el.classList.add('priority-' + info.event.extendedProps.priority);
        }
        
        // Add status indicator
        if (info.event.extendedProps.status) {
            var statusIndicator = document.createElement('div');
            statusIndicator.className = 'status-indicator status-' + info.event.extendedProps.status;
            info.el.appendChild(statusIndicator);
        }
    }
    
    // Format functions for display
    function formatTime(date) {
        return date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }
    
    function formatEventType(type) {
        if (!type) return 'Other';
        
        var typeMap = {
            'goal': 'Goal',
            'checkpoint': 'Checkpoint',
            'deadline': 'Deadline',
            'meeting': 'Meeting',
            'class': 'Class',
            'exam': 'Exam',
            'other': 'Other'
        };
        
        return typeMap[type] || type.charAt(0).toUpperCase() + type.slice(1);
    }
    
    function formatPriority(priority) {
        if (!priority) return 'Medium';
        
        var priorityMap = {
            'low': 'Low',
            'medium': 'Medium',
            'high': 'High',
            'critical': 'Critical'
        };
        
        return priorityMap[priority] || priority.charAt(0).toUpperCase() + priority.slice(1);
    }
    
    function formatStatus(status) {
        if (!status) return 'Planned';
        
        var statusMap = {
            'planned': 'Planned',
            'in_progress': 'In Progress',
            'completed': 'Completed',
            'delayed': 'Delayed',
            'cancelled': 'Cancelled'
        };
        
        return statusMap[status] || status.charAt(0).toUpperCase() + status.slice(1);
    }

    // Load organizations from API
    function loadOrganizations() {
        // Check if we have an access token for authenticated requests
        const accessToken = localStorage.getItem('accessToken');
        
        // Try to fetch organizations from the API
        console.log('Fetching organizations from API...');
        fetch('https://api.menteecollege.com/api/organizations/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': accessToken ? `Bearer ${accessToken}` : ''
            }
        })
        .then(response => {
            console.log('Organizations response status:', response.status);
            
            if (!response.ok) {
                console.warn('Failed to fetch organizations from API (status: ' + response.status + '). Using default organizations.');
                useDefaultOrganizations();
                return null;
            }
            
            // Handle successful response
            return response.text().then(text => {
                try {
                    return JSON.parse(text);
                } catch (e) {
                    console.warn('Server returned non-JSON response for organizations:', text);
                    useDefaultOrganizations();
                    return null;
                }
            });
        })
        .then(data => {
            if (data && data.length > 0) {
                console.log('Successfully loaded organizations from API:', data.length + ' organizations');
                populateOrganizationDropdowns(data);
            } else {
                // Use default organizations if API returns empty
                console.warn('API returned empty organizations array. Using default organizations.');
                useDefaultOrganizations();
            }
        })
        .catch(error => {
            console.error('Error fetching organizations:', error);
            // Use default organizations if API fails
            useDefaultOrganizations();
        });
    }

    function useDefaultOrganizations() {
        const defaultOrgs = [
            { id: '00000000-0000-0000-0000-000000000001', name: 'MenteeCollege', description: 'Mentee College Organization' },
            { id: '00000000-0000-0000-0000-000000000002', name: 'NursesAndCompanions', description: 'Nurses And Companions Organization' }
        ];
        console.log('Using default organizations:', defaultOrgs);
        populateOrganizationDropdowns(defaultOrgs);
    }

    // Populate organization dropdowns with data from API
    function populateOrganizationDropdowns(organizations) {
        // Populate the filter dropdown
        const filterDropdown = document.getElementById('organizationFilter');
        if (filterDropdown) {
            // Keep the "All Organizations" option
            while (filterDropdown.options.length > 1) {
                filterDropdown.remove(1);
            }
            
            // Add organizations to the filter dropdown
            organizations.forEach(org => {
                const option = document.createElement('option');
                option.value = org.name;
                option.text = org.name;
                option.setAttribute('data-id', org.id);
                filterDropdown.appendChild(option);
            });
        }
        
        // Populate the event form dropdown
        const formDropdown = document.getElementById('eventOrganizationInput');
        if (formDropdown) {
            // Keep the "Select Organization" option
            while (formDropdown.options.length > 1) {
                formDropdown.remove(1);
            }
            
            // Add organizations to the form dropdown
            organizations.forEach(org => {
                const option = document.createElement('option');
                option.value = org.id; // Use id as the value
                option.text = org.name;
                option.setAttribute('data-id', org.id); // Add data-id attribute
                formDropdown.appendChild(option);
            });
        }
    }
}); 