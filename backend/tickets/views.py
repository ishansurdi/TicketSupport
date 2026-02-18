from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Count, Avg
from django.db.models.functions import TruncDate
from django.utils import timezone
from datetime import timedelta
from .models import Ticket
from .serializers import (
    TicketSerializer,
    TicketUpdateSerializer,
    ClassifyRequestSerializer,
    ClassifyResponseSerializer
)
from .llm_service import classify_ticket


class TicketViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing support tickets.
    
    Provides CRUD operations and filtering capabilities.
    """
    queryset = Ticket.objects.all()
    serializer_class = TicketSerializer
    
    def get_serializer_class(self):
        if self.action == 'partial_update':
            return TicketUpdateSerializer
        return TicketSerializer
    
    def get_queryset(self):
        """
        Filter tickets by category, priority, status, and search query.
        """
        queryset = Ticket.objects.all()
        
        # Filter by category
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(category=category)
        
        # Filter by priority
        priority = self.request.query_params.get('priority', None)
        if priority:
            queryset = queryset.filter(priority=priority)
        
        # Filter by status
        status_param = self.request.query_params.get('status', None)
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        # Search in title and description
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | Q(description__icontains=search)
            )
        
        return queryset.order_by('-created_at')
    
    def create(self, request, *args, **kwargs):
        """
        Create a new ticket. Returns 201 on success.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
            headers=headers
        )
    
    @action(detail=False, methods=['get'], url_path='stats')
    def stats(self, request):
        """
        Return aggregated statistics about tickets.
        Uses database-level aggregation (not Python loops).
        """
        # Total tickets
        total_tickets = Ticket.objects.count()
        
        # Open tickets (status = 'open')
        open_tickets = Ticket.objects.filter(status=Ticket.STATUS_OPEN).count()
        
        # Average tickets per day
        # Calculate from the first ticket created to now
        first_ticket = Ticket.objects.order_by('created_at').first()
        if first_ticket:
            days_diff = (timezone.now() - first_ticket.created_at).days
            if days_diff < 1:
                days_diff = 1  # Avoid division by zero
            avg_tickets_per_day = round(total_tickets / days_diff, 1)
        else:
            avg_tickets_per_day = 0.0
        
        # Priority breakdown - using database aggregation
        priority_breakdown = {
            'low': 0,
            'medium': 0,
            'high': 0,
            'critical': 0
        }
        priority_counts = Ticket.objects.values('priority').annotate(
            count=Count('id')
        )
        for item in priority_counts:
            priority_breakdown[item['priority']] = item['count']
        
        # Category breakdown - using database aggregation
        category_breakdown = {
            'billing': 0,
            'technical': 0,
            'account': 0,
            'general': 0
        }
        category_counts = Ticket.objects.values('category').annotate(
            count=Count('id')
        )
        for item in category_counts:
            category_breakdown[item['category']] = item['count']
        
        stats_data = {
            'total_tickets': total_tickets,
            'open_tickets': open_tickets,
            'avg_tickets_per_day': avg_tickets_per_day,
            'priority_breakdown': priority_breakdown,
            'category_breakdown': category_breakdown
        }
        
        return Response(stats_data)
    
    @action(detail=False, methods=['post'], url_path='classify')
    def classify(self, request):
        """
        Classify a ticket description using LLM.
        Returns suggested category and priority.
        """
        serializer = ClassifyRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        description = serializer.validated_data['description']
        
        # Call LLM service to classify
        result = classify_ticket(description)
        
        return Response(result)
