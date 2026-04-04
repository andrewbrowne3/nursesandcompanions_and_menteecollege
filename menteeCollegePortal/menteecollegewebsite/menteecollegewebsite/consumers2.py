import asyncio  # Add this import at the top of your file
import json
import logging
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.conf import settings
from django.core.mail import send_mail
from mentee_college_online_school.models import ChatGroup, GroupMessage
from twilio.rest import Client

# Define the list of questions in chronological order (only used if the user is interested)
questions = [
    "What is your name?",
    "What program are you most interested in?",
    "What is the best phone number our staff can reach you to help you begin your healthcare journey?",
]
guided_options = {
    "What is your name?": None,
    "What program are you most interested in?": [
        "Practical Nursing",
        "Nurse Aide (Certified Nursing Assistant)",
        "Medical Assistant",
        "CPR & BLS Certification",
    ],
    "What is the best phone number our staff can reach you to help you begin your healthcare journey?": None,
}
logger = logging.getLogger(__name__)


class ChatroomConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Extract room_name from the URL route (if it's passed as a kwarg)
        self.room_name = self.scope["url_route"]["kwargs"].get(
            "room_name", "default_room"
        )

        # Log for debugging
        print(f"WebSocket connection established for room: {self.room_name}")

        # Add the WebSocket connection to the group (room)
        await self.channel_layer.group_add(self.room_name, self.channel_name)
        self.lead_name = None
        # Accept the WebSocket connection
        await self.accept()

        # Create or update a ChatGroup object based on the room_name
        chat_group, created = await self.get_or_create_chat_group(self.room_name)

        if created:
            print(f"New ChatGroup created: {self.room_name}")
        else:
            print(f"ChatGroup {self.room_name} already exists.")

        # Initialize the conversation progress (starting with gauging interest)
        self.conversation_progress = (
            -1
        )  # Start with a value that indicates "not yet started"
        self.responses = {}  # Dictionary to store the user's responses

        # Start by asking if the user is interested in learning more
        await self.ask_initial_interest()

    async def disconnect(self, close_code):
        # Log the disconnection with the close code
        print(
            f"WebSocket disconnected from room {self.room_name} with close code: {close_code}"
        )

        # Remove the WebSocket connection from the group
        await self.channel_layer.group_discard(self.room_name, self.channel_name)

    async def receive(self, text_data):
        # Handle messages sent by the client
        data = json.loads(text_data)
        message = data.get("message", "").strip().lower()

        # Handle the initial interest question
        if self.conversation_progress == -1:
            if message in ["yes", "sure", "okay", "yeah"]:
                await asyncio.sleep(1)
                await self.send(
                    text_data=json.dumps(
                        {
                            "type": "bot_message",
                            "message": "Great! Let's gather some details to help you get started.",
                        }
                    )
                )
                self.conversation_progress = (
                    0  # Move to the first question in the detailed flow
                )
                await self.ask_next_question()
            else:
                await asyncio.sleep(1)
                await self.send(
                    text_data=json.dumps(
                        {
                            "type": "bot_message",
                            "message": "Thank you for your time! If you ever change your mind, feel free to reach out to us.",
                        }
                    )
                )
                return  # End the conversation if they don't want to continue

        # Store the user's answer to the previous question
        elif self.conversation_progress <= len(questions):
            if self.conversation_progress > 0:
                self.responses[questions[self.conversation_progress - 1]] = message
                print(
                    f"User response to {questions[self.conversation_progress - 1]}: {message}"
                )
                # Check if the user has provided their name
                if self.responses.get("What is your name?") is not None:
                    name = self.responses.get("What is your name?")

                    # Convert the name to a string, just in case
                    name = str(name)
                    self.lead_name = name

                    # Use the name as the author for the GroupMessage
                    await self.create_group_message(
                        self.room_name, message, author_username=name
                    )
                else:
                    # If no name is provided, use "Anonymous"
                    await self.create_group_message(
                        self.room_name, message, author_username="Anonymous"
                    )

            if self.conversation_progress >= len(questions):
                await self.conclude_conversation()
            else:
                # Otherwise, ask the next question
                await asyncio.sleep(1)
                await self.ask_next_question()

    async def ask_initial_interest(self):
        """Ask the initial question to gauge user interest."""
        await self.send(
            text_data=json.dumps(
                {
                    "type": "bot_message",
                    "message": "Would you like to learn more about our programs and get assistance getting started? Please reply Yes or No.",
                }
            )
        )

    async def ask_next_question(self):
        """Send the next question in the sequence to the client."""
        if self.conversation_progress < len(questions):
            await asyncio.sleep(1)  # Delay before sending the next question
            next_question = questions[self.conversation_progress]

            # Check if this question has guided response options
            if next_question in guided_options:
                print("test1")
                await self.send(
                    text_data=json.dumps(
                        {
                            "type": "bot_message",
                            "message": next_question,
                            "options": guided_options[
                                next_question
                            ],  # Include the options
                        }
                    )
                )
            else:
                print("test2")
                # If no guided options, send a regular text question
                await self.send(
                    text_data=json.dumps(
                        {
                            "type": "bot_message",
                            "message": next_question,
                        }
                    )
                )

        # Move to the next question in the flow
        self.conversation_progress += 1

    async def conclude_conversation(self):
        """Once all questions are answered, conclude the conversation."""
        # Here, you could log the responses or send them to a database for follow-up
        print("All questions have been answered.")
        print(f"Collected responses: {self.responses}")

        # Retrieve the user's name and program of interest from their responses
        name = self.responses.get("What is your name?", "there")
        program = self.responses.get(
            "What program are you most interested in?", "one of our programs"
        )

        # Send email notification if we have a phone number
        phone_number = self.responses.get(
            "What is the best phone number our staff can reach you to help you begin your healthcare journey?"
        )
        if phone_number:
            # Your phone number for receiving lead notifications
            my_phone = "+16783572186"  # Convert to string and add country code

            # Send SMS notification to yourself about the new lead
            sms_message = f"Hi! New lead: {name} wants to know more about our program. Their phone number is {phone_number}"

            success, result = await self.send_sms_async(my_phone, sms_message)

            if success:
                print("SMS notification sent successfully")
            else:
                print(f"Failed to send SMS notification: {result}")

            # Optional: Also send a confirmation SMS to the lead
            lead_message = f"Hi {name}! Thanks for your interest in our program. We'll be in touch soon!"
            success2, result2 = await self.send_sms_async(my_phone, lead_message)

            if success2:
                print("Confirmation SMS sent to lead")
            else:
                print(f"Failed to send confirmation SMS: {result2}")

            # Send email notification with comprehensive details
            subject = f"New Lead: {name} - Interested in {program}"

            # Build comprehensive email message with all conversation details
            message = f"""
New Lead Information
====================

LEAD SUMMARY:
-------------
Name: {name}
Program of Interest: {program}
Phone Number: {phone_number}
Session ID: {self.room_name}
Timestamp: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}

CONVERSATION DETAILS:
--------------------
Q: Would you like to learn more about our programs and get assistance getting started?
A: Yes (Lead showed interest)

Q: {questions[0]}
A: {self.responses.get(questions[0], "No response")}

Q: {questions[1]}
A: {self.responses.get(questions[1], "No response")}

Q: {questions[2]}
A: {self.responses.get(questions[2], "No response")}

ACTION REQUIRED:
---------------
Please contact this lead as soon as possible. They have expressed interest in {program} and are waiting for our response.

This is an automated message from the Mentee College chat system.
"""

            from_email = "Admissions@menteecollege.com"  # Fixed to match settings
            recipient_list = [
                "admissions@menteecollege.com",
                "andrewbrowne161@gmail.com",
                "erica.s.browne@gmail.com",
                "faron.wiseman@outlook.com",
            ]  # Add your recipient list here

            try:
                # Send email asynchronously
                loop = asyncio.get_event_loop()
                with ThreadPoolExecutor() as pool:
                    result = await loop.run_in_executor(
                        pool,
                        send_mail,
                        subject,
                        message,
                        from_email,
                        recipient_list,
                        False,  # fail_silently=False
                    )

                logger.info(f"Email sent successfully to {recipient_list}")

            except Exception as e:
                # Log the error
                logger.error(f"Failed to send email: {str(e)}")

                # Send error notification
                await self.send(
                    text_data=json.dumps(
                        {
                            "type": "error",
                            "message": f"Failed to send email: {str(e)}",
                        }
                    )
                )

        # Create a personalized closing message with the discount code
        closing_message = f"Thank you, {name}! We are excited to help you get started with {program}. You can apply now in the Application tab in the navigation bar! One of our staff will reach out to you to satisfy any additional inquiries that you may have"
        await asyncio.sleep(1)
        # Send the personalized message to the client
        await self.send(
            text_data=json.dumps({"type": "bot_message", "message": closing_message})
        )

    @database_sync_to_async
    def get_or_create_chat_group(self, room_name):
        # Wrap the database call with database_sync_to_async to handle it in an async context
        return ChatGroup.objects.get_or_create(group_name=room_name)

    @database_sync_to_async
    def create_group_message(
        self, group_name, message_body, author_username="Anonymous"
    ):
        # Retrieve the ChatGroup instance based on the group_name
        chat_group, _ = ChatGroup.objects.get_or_create(group_name=group_name)
        print("test")
        GroupMessage.objects.create(
            author=author_username,
            group=chat_group,  # Use the group instance here
            body=message_body,
            created=datetime.now(),
        )

    async def send_sms_async(self, to_phone, message_body):
        """
        Send SMS asynchronously using Twilio
        """
        try:
            # Create Twilio client
            client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)

            # Run the SMS sending in a thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            with ThreadPoolExecutor() as pool:
                message = await loop.run_in_executor(
                    pool,
                    lambda: client.messages.create(
                        body=message_body,
                        from_=settings.TWILIO_PHONE_NUMBER,
                        to=to_phone,
                    ),
                )

            logger.info(f"SMS sent successfully. SID: {message.sid}")
            return True, message.sid

        except Exception as e:
            logger.error(f"Failed to send SMS: {str(e)}")
            return False, str(e)
