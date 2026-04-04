import os
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from openai import OpenAI, ChatCompletion, AsyncOpenAI
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from mentee_college_online_school.models import GroupMessage, ChatGroup
from datetime import datetime

# Initialize the OpenAI client using the environment variable for the API key
API_KEY = os.environ.get('OPENAI_API_KEY', '')

# Initialize the OpenAI client globally
openai_client = AsyncOpenAI(api_key=API_KEY)

class GPTChatroomConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Extract room_name from the URL route (if it's passed as a kwarg)
        self.room_name = self.scope['url_route']['kwargs'].get('room_name', 'default_room')
        
        # Log for debugging
        print(f"WebSocket connection established for room: {self.room_name}")

        # Add the WebSocket connection to the group (room)
        await self.channel_layer.group_add(
            self.room_name,
            self.channel_name
        )
        
        # Accept the WebSocket connection
        await self.accept()

           # Create or update a ChatGroup object based on the room_name
        chat_group, created = await self.get_or_create_chat_group(self.room_name)

        if created:
            print(f"New ChatGroup created: {self.room_name}")
        else:
            print(f"ChatGroup {self.room_name} already exists.")

        # Send a welcome message to the client
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': f'You are connected to {self.room_name}!'
        }))
     

    
    async def disconnect(self, close_code):
        # Log the disconnection with the close code
        print(f"WebSocket disconnected from room {self.room_name} with close code: {close_code}")

        # Remove the WebSocket connection from the group
        await self.channel_layer.group_discard(
            self.room_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        # Handle messages sent by the client
        data = json.loads(text_data)
        user_message = data.get('message', '')

        print(f"Received message: {user_message} in room: {self.room_name}")

        # Get the OpenAI response (this is an async function call)
        openai_response = await self.get_openai_response(user_message)
       # ada = "Ada"
        # Store the message in the database
        await self.create_group_message(self.room_name, user_message)
        #await self.create_group_message(ada, self.room_name, openai_response)
        try:
            # Send the OpenAI response directly back to the client using self.send
            await self.send(text_data=json.dumps({
                'type': 'openai_response',  # Message type to distinguish OpenAI responses
                'message': openai_response  # The response message from OpenAI
            }))
            print(f"Sent OpenAI response to frontend: {openai_response}")  # Confirm it's sent
        except Exception as e:
            print(f"Failed to send message to frontend: {e}")

    async def get_openai_response(self, user_message):
        """
        This method interacts with the OpenAI API and returns the response.
        """
        try:
            # Make an API call to OpenAI's ChatCompletion
            completion = await openai_client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are a sales representative for a school named Mentee College your job is to close deals and get client information smoothly encourage them to sign up for our school by saying the benefits of becoming a CNA or EKG, Begin by asking their information give them the reason that if the message box disappears you want to be able to send a representative to further assist you. please be as concise as possible"},
                    {"role": "user", "content": user_message}
                ]
            )

            # Extract the message content from the OpenAI response
            response_message = completion.choices[0].message.content
            print(response_message)
            return response_message

        except Exception as e:
            print(f"Failed to get OpenAI response: {e}")
            return "Sorry, I encountered an issue while processing your request."
        
    async def chat_message(self, event):
        # This method gets called when a message is broadcast to the group

        # Only send the message if the current client didn't send it
        if event['sender_channel_name'] != self.channel_name:
            await self.send(text_data=json.dumps({
                'type': 'message',
                'message': event['message']
            }))

    @database_sync_to_async
    def get_or_create_chat_group(self, room_name):
        # Wrap the database call with database_sync_to_async to handle it in an async context
        return ChatGroup.objects.get_or_create(group_name=room_name)

    @database_sync_to_async
    def create_group_message(sel, group_name, message_body):
        # Retrieve the ChatGroup instance based on the group_name
        chat_group, _ = ChatGroup.objects.get_or_create(group_name=group_name)

        GroupMessage.objects.create(
                group=chat_group,  # Use the group instance here
                body=message_body,
                created=datetime.now()
            )



# A dictionary to track waiting students and available tutors (should be replaced with persistent storage for production)
waiting_students = []
available_tutors = []

class TutorChatroomConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Get the role (student or tutor) and username from the URL parameters or headers
        self.role = self.scope['url_route']['kwargs'].get('role', 'student')
        self.username = self.scope['url_route']['kwargs'].get('username', 'anonymous')
        self.room_name = "waiting_room"  # Default room for waiting

        if self.role == 'student':
            # Add the student to the waiting list
            waiting_students.append(self.username)
            print(f"Student {self.username} is waiting for a tutor.")

            # Notify the student that they are in the waiting room
            await self.send(text_data=json.dumps({
                'type': 'waiting_room',
                'message': 'You are in the waiting room, waiting for a tutor.'
            }))
        
        elif self.role == 'tutor':
            # Add the tutor to the available list
            available_tutors.append(self.username)
            print(f"Tutor {self.username} is available for students.")

            # Check if there are any waiting students and pair them
            if waiting_students:
                # Get the first waiting student
                student_username = waiting_students.pop(0)
                
                # Create a unique room name for the student-tutor pair
                self.room_name = f"{student_username}_{self.username}_room"

                # Inform the tutor of the pairing
                await self.send(text_data=json.dumps({
                    'type': 'paired',
                    'message': f'You have been paired with {student_username}.'
                }))

                # Inform the student of the pairing (simulated here, but should be through the student's WebSocket)
                await self.channel_layer.group_add(
                    self.room_name,
                    self.channel_name
                )
                
                await self.channel_layer.group_send(
                    "waiting_room",  # Replace with the student's WebSocket group if implemented separately
                    {
                        'type': 'student_paired',
                        'message': f'You have been paired with tutor {self.username}.',
                        'room_name': self.room_name
                    }
                )
            else:
                # Notify the tutor that there are no students waiting
                await self.send(text_data=json.dumps({
                    'type': 'waiting_room',
                    'message': 'There are currently no students waiting. Please wait.'
                }))

        # Add the WebSocket connection to the room (either waiting room or a paired room)
        await self.channel_layer.group_add(
            self.room_name,
            self.channel_name
        )

        # Accept the WebSocket connection
        await self.accept()

    async def disconnect(self, close_code):
        # Remove the WebSocket connection from the room
        await self.channel_layer.group_discard(
            self.room_name,
            self.channel_name
        )

        # Remove the user from the waiting lists if they disconnect
        if self.role == 'student' and self.username in waiting_students:
            waiting_students.remove(self.username)
        elif self.role == 'tutor' and self.username in available_tutors:
            available_tutors.remove(self.username)
        print(f"{self.role.capitalize()} {self.username} disconnected with code {close_code}.")

    async def receive(self, text_data):
        # Handle messages sent by the client
        data = json.loads(text_data)
        message = data.get('message', '')

        # Send the message to the group (broadcast to all in the room)
        await self.channel_layer.group_send(
            self.room_name,
            {
                'type': 'chat_message',
                'message': message
            }
        )

    async def chat_message(self, event):
        # Send the message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'message',
            'message': event['message']
        }))

   
