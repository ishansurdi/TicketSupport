from rest_framework import serializers
from .models import Ticket


class TicketSerializer(serializers.ModelSerializer):
    """
    Serializer for the Ticket model.
    """
    
    class Meta:
        model = Ticket
        fields = [
            'id',
            'title',
            'description',
            'category',
            'priority',
            'status',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def validate_title(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Title cannot be empty.")
        if len(value) > 200:
            raise serializers.ValidationError("Title cannot exceed 200 characters.")
        return value.strip()
    
    def validate_description(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Description cannot be empty.")
        return value.strip()


class TicketUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating tickets (PATCH requests).
    """
    
    class Meta:
        model = Ticket
        fields = ['category', 'priority', 'status']
    
    def validate(self, attrs):
        # Allow partial updates
        return attrs


class ClassifyRequestSerializer(serializers.Serializer):
    """
    Serializer for the classify endpoint request.
    """
    description = serializers.CharField(required=True, allow_blank=False)
    
    def validate_description(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Description cannot be empty.")
        return value.strip()


class ClassifyResponseSerializer(serializers.Serializer):
    """
    Serializer for the classify endpoint response.
    """
    suggested_category = serializers.CharField()
    suggested_priority = serializers.CharField()
