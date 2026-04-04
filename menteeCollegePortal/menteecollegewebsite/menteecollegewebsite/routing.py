from django.urls import path

#consumers is essentially views
from .consumersgpt import * 
from .consumers2 import *

websocket_urlpatterns = [

    path("ws/gptchatroom/", GPTChatroomConsumer.as_asgi()),
    path("ws/chatroom/", ChatroomConsumer.as_asgi()),

]