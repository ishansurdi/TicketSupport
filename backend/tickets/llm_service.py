"""
LLM Service for ticket classification using Google Gemini API.

This service analyzes ticket descriptions and suggests:
- Category: billing, technical, account, or general
- Priority: low, medium, high, or critical
"""

import google.generativeai as genai
from django.conf import settings
import logging
import json

logger = logging.getLogger(__name__)

# Configure Gemini API
if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)


CLASSIFICATION_PROMPT = """You are a support ticket classification assistant. Analyze the following support ticket description and classify it into appropriate category and priority.

**Categories:**
- billing: Issues related to payments, invoices, refunds, subscriptions, pricing
- technical: Technical problems, bugs, errors, performance issues, features not working
- account: Account access, login issues, password resets, profile settings, permissions
- general: General inquiries, questions, feature requests, feedback

**Priority Levels:**
- low: Minor issues, general questions, no immediate impact
- medium: Moderate issues affecting some functionality, non-urgent
- high: Significant issues affecting core functionality, needs prompt attention
- critical: System down, major security issues, complete service disruption, revenue impact

**Ticket Description:**
{description}

**Instructions:**
Respond ONLY with a valid JSON object in this exact format (no additional text):
{{"category": "billing|technical|account|general", "priority": "low|medium|high|critical"}}

Analyze the description carefully and provide the most appropriate category and priority based on the severity and nature of the issue.
"""


def classify_ticket(description: str) -> dict:
    """
    Classify a ticket description using Gemini API.
    
    Args:
        description: The ticket description text
    
    Returns:
        dict: Contains 'suggested_category' and 'suggested_priority'
              Falls back to defaults if classification fails
    """
    # Default fallback values
    default_result = {
        'suggested_category': 'general',
        'suggested_priority': 'medium'
    }
    
    # Check if API key is configured
    if not settings.GEMINI_API_KEY:
        logger.warning("Gemini API key not configured. Using default classification.")
        return default_result
    
    try:
        # Initialize the model
        model = genai.GenerativeModel('gemini-3-flash-preview')
        
        # Format the prompt with the description
        prompt = CLASSIFICATION_PROMPT.format(description=description)
        
        # Generate classification
        response = model.generate_content(prompt)
        
        if not response or not response.text:
            logger.error("Empty response from Gemini API")
            return default_result
        
        # Parse the JSON response
        response_text = response.text.strip()
        
        # Remove markdown code blocks if present
        if response_text.startswith('```'):
            lines = response_text.split('\n')
            response_text = '\n'.join(lines[1:-1])
        
        # Parse JSON
        classification = json.loads(response_text)
        
        # Validate the response structure
        category = classification.get('category', 'general')
        priority = classification.get('priority', 'medium')
        
        # Validate category
        valid_categories = ['billing', 'technical', 'account', 'general']
        if category not in valid_categories:
            logger.warning(f"Invalid category '{category}' from LLM. Using default.")
            category = 'general'
        
        # Validate priority
        valid_priorities = ['low', 'medium', 'high', 'critical']
        if priority not in valid_priorities:
            logger.warning(f"Invalid priority '{priority}' from LLM. Using default.")
            priority = 'medium'
        
        return {
            'suggested_category': category,
            'suggested_priority': priority
        }
    
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse JSON from LLM response: {e}")
        return default_result
    
    except Exception as e:
        logger.error(f"Error during ticket classification: {type(e).__name__}: {str(e)}")
        return default_result
