import logging

from drf_yasg.utils import swagger_auto_schema
from rest_framework import generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView


from rest_framework.permissions import IsAuthenticated, AllowAny

from .models import Webhook, WebhookAction
from .serializers import WebhookSerializer


class WebhookListAPI(generics.ListCreateAPIView):
    queryset = Webhook.objects.all()
    serializer_class = WebhookSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Webhook.objects.filter(organization=self.request.user.active_organization)

    def perform_create(self, serializer):
        serializer.save(organization=self.request.user.active_organization)

    @swagger_auto_schema(
        tags=['Webhooks'],
        operation_summary='List of webhooks',
        operation_description="List of webhooks of user's active organization."
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @swagger_auto_schema(
        tags=['Webhooks'],
        operation_summary='Create a webhook',
        operation_description="Create a webhook for user's active organization."
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


class WebhookAPI(generics.RetrieveUpdateDestroyAPIView):
    queryset = Webhook.objects.all()
    serializer_class = WebhookSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Webhook.objects.filter(organization=self.request.user.active_organization)

    @swagger_auto_schema(tags=['Webhooks'], operation_summary='Get webhook info')
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @swagger_auto_schema(tags=['Webhooks'], operation_summary='Save webhook info')
    def put(self, request, *args, **kwargs):
        return super().put(request, *args, **kwargs)

    @swagger_auto_schema(tags=['Webhooks'], operation_summary='Update webhook info')
    def patch(self, request, *args, **kwargs):
        return super().patch(request, *args, **kwargs)

    @swagger_auto_schema(tags=['Webhooks'], operation_summary='Delete webhook info')
    def delete(self, request, *args, **kwargs):
        return super().delete(request, *args, **kwargs)


class WebhookInfoAPI(APIView):
    permission_classes = [AllowAny]

    @swagger_auto_schema(tags=['Webhooks'],
                         operation_summary='Returns description of all webhook actions',
                         operation_description='Use this information to setup webhooks.',
                         responses={"200": "Object with description data."},)
    def get(self, request, *args, **kwargs):
        result = {
            key: {
                'name': value['name'],
                'description': value['description'],
                'key': value['key'],
            }
            for key, value in WebhookAction.ACTIONS.items()
        }
        return Response(
            data=result
        )
