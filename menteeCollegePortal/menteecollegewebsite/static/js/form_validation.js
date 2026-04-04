document.addEventListener("DOMContentLoaded", function() {
    // Get references to the forms and the PayPal buttons
    const forms = {
        certificate: {
            form: document.getElementById('certificateForm'),
            paypalButton: document.getElementById('paypal-button-container-certificate')
        },
        associates: {
            form: document.getElementById('associatesForm'),
            paypalButton: document.getElementById('paypal-button-container-associates')
        },
        diploma: {
            form: document.getElementById('diplomaForm'),
            paypalButton: document.getElementById('paypal-button-container-diploma')
        }
    }

    // Iterate over each form
    for (let key in forms) {
        let formObj = forms[key];

        // Add an event listener for the 'submit' event
        formObj.form.addEventListener('submit', function(e) {
            // Prevent the form from being submitted
            e.preventDefault();

            // Check if the form is valid
            if (this.checkValidity()) {
                // If the form is valid, then manually trigger the PayPal button's 'click' event
                formObj.paypalButton.querySelector('.paypal-button').click();
            } else {
                // If the form is not valid, display an error message
                alert('Please fill out all required fields.');
            }
        });
    }
});
