<?php
// Enable error reporting
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Assigning posted values to variables.
    $first_name = $_POST['first_name'];
    $last_name = $_POST['last_name'];
    $DOB = $_POST['DOB'];
    $email = $_POST['email']; // added email variable
    $phone_number = $_POST['phone_number']; // added phone number variable
    $home_address = $_POST['home_address'];
    $city = $_POST['city'];
    $degrees_held = $_POST['degrees_held'];
    $how_did_you_hear_about_us = $_POST['how_did_you_hear_about_us'];
    $gender = $_POST['gender'];
    $medical_background = $_POST['medical_background'];
    $interest = $_POST['interest'];
    $disability_or_ailment = $_POST['disability_or_ailment'];
    $signature = $_POST['signature'];
    $diploma_program = $_POST['diploma_program'];

    // Define email addresses to send form data to
    $email1 = "andrewb.andrewslearning@gmail.com";
    $email2 = "Admissions@menteecollege.org";

    // Prepare email body
    $body = "First Name: $first_name\n".
            "Last Name: $last_name\n".
            "Date of Birth: $DOB\n".
            "Email: $email\n". // added email to the body
            "Phone Number: $phone_number\n". // added phone number to the body
            "Home Address: $home_address\n".
            "City: $city\n".
            "Degrees Held: $degrees_held\n".
            "How Did You Hear About Us: $how_did_you_hear_about_us\n".
            "Gender: $gender\n".
            "Medical Background: $medical_background\n".
            "Interest: $interest\n".
            "Disability or Ailment: $disability_or_ailment\n".
            "Signature: $signature\n".
            "Diploma Program: $diploma_program\n";

    // Send the email to email1
    $subject = "Diploma Application from $first_name $last_name";
    if (!mail($email1, $subject, $body)) {
        echo 'Mail to ' . $email1 . ' failed.<br>';
    }

    // Send the email to email2
    if (!mail($email2, $subject, $body)) {
        echo 'Mail to ' . $email2 . ' failed.<br>';
    }

    // Redirect to a thank you page
    header("Location: Success.html");
}
?>
