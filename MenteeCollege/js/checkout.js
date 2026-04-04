// This is your test publishable API key for Stripe.
const stripe = Stripe("pk_live_51OYUmeLYZVs4AvpzzN1H64gsNGZYLLIzJeomzcS4BhLcoGsBa1XMUKd8StPIukXnyeCMv3tvaNrpFtEUtBTTMEB9009BUITLfD");

let elements; // Declare elements variable at a higher scope

document.addEventListener('DOMContentLoaded', async () => {
    await fetchStudentInformation();
    checkStatus();
});

document.querySelector("#payment-form").addEventListener("submit", handleSubmit);

async function fetchStudentInformation() {
    const username = localStorage.getItem('username');
    if (!username) {
        console.error('No user information found. Redirecting to login...');
        window.location.href = '/login.html';
        return;
    }

    try {
        const studentInfoResponse = await fetch(`https://api.menteecollege.com/api/students/${username}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem('accessToken')}`
            },
        });

        if (!studentInfoResponse.ok) {
            throw new Error(`Failed to fetch student information for username: ${username}`);
        }

        const studentInfo = await studentInfoResponse.json();
        console.log("Student information fetched successfully:", studentInfo);

        document.getElementById('greeting').innerText = `Hello, ${studentInfo.first_name}`;

        const { combinedTotalDue, combinedTotalPaid } = calculateCombinedTotals(studentInfo.payment_details);
        document.getElementById('totalAmountDue').innerText = `Total Amount Due: $${combinedTotalDue}`;
        document.getElementById('totalAmountPaid').innerText = `Total Amount Paid: $${combinedTotalPaid}`;

        const courseListElement = document.getElementById('courseList');
        courseListElement.innerHTML = '';
        studentInfo.course_enrollment_names.forEach(courseName => {
            const listItem = document.createElement('li');
            listItem.innerText = `Enrolled in ${courseName}`;
            courseListElement.appendChild(listItem);
        });

        initialize(combinedTotalDue, studentInfo);
    } catch (error) {
        console.error('Error fetching student information:', error);
        showMessage('Unable to load student information. Please refresh the page or try again later.');
    }
}

function calculateCombinedTotals(paymentDetails) {
    let combinedTotalDue = 0;
    let combinedTotalPaid = 0;

    ['associate_programs', 'certificate_courses', 'diploma_programs'].forEach(type => {
        paymentDetails[type].forEach(program => {
            combinedTotalDue += program.total_due;
            combinedTotalPaid += program.total_paid;
        });
    });

    return { combinedTotalDue, combinedTotalPaid };
}

async function initialize(totalCost, studentInfo) {
    const username = localStorage.getItem('username');
    const accessToken = localStorage.getItem('accessToken');
        // Extracting relevant student information
    const studentData = {
            studentId: studentInfo.id, // Assuming studentInfo contains an 'id' field
            firstName: studentInfo.first_name,
            lastName: studentInfo.last_name,
            // Add any other relevant student fields
        };
    if (!accessToken) {
        console.error('Access token not found. User might not be logged in.');
        return;
    }

    try {
        const response = await fetch("https://api.menteecollege.com/api/create-payment-intent", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ totalCost, username, studentData }),
        });

        if (!response.ok) {
            throw new Error('Failed to create payment intent');
        }

        const { clientSecret } = await response.json();
        const appearance = { theme: 'stripe' };
        elements = stripe.elements({ appearance, clientSecret }); // Assign elements here
        const paymentElement = elements.create("payment", { layout: "tabs" });
        paymentElement.mount("#payment-element");
    } catch (error) {
        console.error('Error during Stripe initialization:', error);
        showMessage('Payment processing is currently unavailable. Please try again later.');
        document.querySelector("#submit").disabled = true;
    }
}

async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: "http://menteecollege.com/Success_payment.html" },
    });

    if (error) {
        showMessage(error.message);
    } else {
        // Payment succeeded or further action required
    }

    setLoading(false);
}

async function checkStatus() {
    const clientSecret = new URLSearchParams(window.location.search).get("payment_intent_client_secret");
    if (!clientSecret) return;

    const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret);
    switch (paymentIntent.status) {
        case "succeeded": showMessage("Payment succeeded!"); break;
        case "processing": showMessage("Your payment is processing."); break;
        case "requires_payment_method": showMessage("Your payment was not successful, please try again."); break;
        default: showMessage("Something went wrong."); break;
    }
}

function showMessage(messageText) {
    const messageContainer = document.querySelector("#payment-message");
    messageContainer.textContent = messageText;
    messageContainer.classList.remove("hidden");
    setTimeout(() => { messageContainer.classList.add("hidden"); }, 4000);
}

function setLoading(isLoading) {
    const submitButton = document.querySelector("#submit");
    const spinner = document.querySelector("#spinner");
    const buttonText = document.querySelector("#button-text");

    if (isLoading) {
        submitButton.disabled = true;
        spinner.classList.remove("hidden");
        buttonText.classList.add("hidden");
    } else {
        submitButton.disabled = false;
        spinner.classList.add("hidden");
        buttonText.classList.remove("hidden");
    }
}
