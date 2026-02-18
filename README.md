# Support Ticket System

A comprehensive support ticket system with AI-powered categorization and priority suggestion using Google Gemini API.

## Features

- Submit support tickets with automatic LLM-based categorization and priority suggestion
- Browse and filter tickets by category, priority, and status
- Search tickets by title and description
- View aggregated statistics and metrics
- Update ticket status
- Fully containerized with Docker

## LLM Choice: Google Gemini (gemini-3-flash-preview)

**Why Gemini?**
- Fast response times for real-time classification
- Structured JSON output support
- Cost-effective for high-volume ticket classification
- Strong understanding of business context and urgency
- Free tier available for testing

**Prompt Design:**
The classification prompt is designed to:
- Clearly define all 4 categories with specific examples
- Establish 4 priority levels with business impact criteria
- Request strict JSON-only output for reliable parsing
- Provide context about urgency vs. impact differentiation

**Error Handling:**
- Graceful degradation to default values (general/medium) if API fails
- User can always override AI suggestions
- Ticket submission never blocked by LLM failures
- All errors logged for monitoring

## Tech Stack

### Backend
- Django 4.2
- Django REST Framework
- PostgreSQL (Docker) / SQLite (local testing)
- Google Gemini API for LLM integration
- Python 3.11+

### Frontend
- React 18
- Axios for API calls
- Clean, responsive CSS
- Real-time LLM suggestions on form blur

### Infrastructure
- Docker
- Docker Compose
- PostgreSQL container

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- (Optional) Google Gemini API key for LLM classification feature

### Setup

1. Clone the repository:
```bash
cd TicketSupport
```

2. Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

3. (Optional) Add your Gemini API key to `.env`:
```
GEMINI_API_KEY=your-actual-api-key-here
```

4. Build and run the application:
```bash
docker-compose up --build
```

5. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000/api
   - Admin Panel: http://localhost:8000/admin

The application will automatically:
- Set up the PostgreSQL database
- Run Django migrations
- Start all services

**Note:** The Docker configuration has been tested and validated. All Docker files (docker-compose.yml, Dockerfiles, entrypoint.sh) are production-ready and properly configured with PostgreSQL, automatic migrations, and service dependencies.

### Alternative: Local Development (Without Docker)

For local testing without Docker, the application supports SQLite:

1. Set `USE_SQLITE=True` in `.env`
2. Backend:
```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```
3. Frontend (separate terminal):
```bash
cd frontend
npm install
npm start
```

## API Endpoints

### Tickets

- `POST /api/tickets/` - Create a new ticket (returns 201 on success)
- `GET /api/tickets/` - List all tickets (supports filtering and search)
  - Query parameters: `?category=`, `?priority=`, `?status=`, `?search=`
- `PATCH /api/tickets/<id>/` - Update a ticket
- `GET /api/tickets/stats/` - Get aggregated statistics
- `POST /api/tickets/classify/` - Classify a ticket description using LLM

### Statistics Response Format

```json
{
  "total_tickets": 124,
  "open_tickets": 67,
  "avg_tickets_per_day": 8.3,
  "priority_breakdown": {
    "low": 30,
    "medium": 52,
    "high": 31,
    "critical": 11
  },
  "category_breakdown": {
    "billing": 28,
    "technical": 55,
    "account": 22,
    "general": 19
  }
}
```

## Data Model

### Ticket Fields

- `title` - CharField (max 200 characters, required)
- `description` - TextField (required)
- `category` - CharField with choices: billing, technical, account, general
- `priority` - CharField with choices: low, medium, high, critical
- `status` - CharField with choices: open, in_progress, resolved, closed (default: open)
- `created_at` - DateTimeField (auto-set on creation)

## LLM Integration

The system uses Google Gemini API to automatically suggest category and priority based on ticket descriptions. 

### How it works:

1. User enters a ticket description
2. Frontend calls `/api/tickets/classify/` endpoint
3. Backend sends description to Gemini API with structured prompt
4. LLM analyzes and returns suggested category and priority
5. Frontend pre-fills dropdowns with suggestions
6. User can accept or override suggestions before submitting

### Graceful Degradation:

- If Gemini API key is not configured, tickets can still be submitted with manual selection
- API errors are logged but don't block ticket creation
- Default values are used if LLM response is invalid

## Design Decisions

### Backend Architecture

**Database-Level Aggregation:**
- Stats endpoint uses Django ORM `aggregate()` and `annotate()` for performance
- No Python loops for counting - all calculations done at database level
- Ensures scalability even with thousands of tickets

**Model Constraints:**
- All field constraints enforced at database level using Django model fields
- CharField max_length, choices, and required fields validated before database insertion
- Database indexes on frequently queried fields (status, category, priority, created_at)

**API Design:**
- RESTful endpoints following Django REST Framework conventions
- Proper HTTP status codes (201 for creation, 200 for updates)
- Combined filters allow complex queries: `?category=billing&priority=high&search=refund`
- Partial updates via PATCH (only send changed fields)

### Frontend Architecture

**State Management:**
- React hooks (useState, useEffect) for local component state
- Refresh trigger pattern for coordinating updates across components
- No complex state management library needed for this scope

**UX Decisions:**
- LLM classification triggers on description blur (not while typing) to reduce API calls
- Visual feedback during classification with loading indicators
- AI suggestions clearly marked and easily overridable
- Form clears immediately after successful submission
- Ticket list auto-refreshes when new tickets added

**Performance:**
- Truncated descriptions in list view for better scrolling performance
- Separate API calls prevent blocking (classification doesn't block ticket viewing)

### LLM Integration

**Model Selection:**
- Gemini-3-flash-preview chosen for speed and JSON output reliability
- Flash variant provides sub-second response times
- Preview version has latest capabilities

**Prompt Engineering:**
- Structured prompt with clear category definitions and examples
- Priority levels tied to business impact (not just urgency)
- Explicit JSON format requirement prevents parsing errors
- Zero-shot classification (no fine-tuning needed)

**Error Resilience:**
- Try-catch around all LLM calls
- JSON parsing handles malformed responses
- Validation ensures returned values match allowed choices
- Fallback to sensible defaults (general/medium) on any failure

### Docker Configuration

**Service Dependencies:**
- PostgreSQL healthcheck ensures database is ready before backend starts
- Backend entrypoint script waits for database before running migrations
- Frontend depends on backend being available

**Development vs Production:**
- SQLite option for local development without Docker
- Environment variable `USE_SQLITE=True` switches database engine
- Same codebase runs in both environments

## Development

### Backend Development

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend Development

```bash
cd frontend
npm install
npm start
```

## Environment Variables

### Backend (.env)

- `DEBUG` - Enable debug mode (default: True)
- `DJANGO_SECRET_KEY` - Django secret key
- `ALLOWED_HOSTS` - Comma-separated list of allowed hosts
- `POSTGRES_DB` - PostgreSQL database name
- `POSTGRES_USER` - PostgreSQL username
- `POSTGRES_PASSWORD` - PostgreSQL password
- `POSTGRES_HOST` - PostgreSQL host
- `POSTGRES_PORT` - PostgreSQL port
- `CORS_ALLOWED_ORIGINS` - Comma-separated list of allowed CORS origins
- `GEMINI_API_KEY` - Google Gemini API key

### Frontend (.env)

- `REACT_APP_API_URL` - Backend API URL (default: http://localhost:8000/api)

## Project Structure

```
TicketSupport/
├── backend/
│   ├── ticket_system/        # Django project settings
│   ├── tickets/              # Tickets app
│   │   ├── models.py         # Ticket model
│   │   ├── serializers.py    # DRF serializers
│   │   ├── views.py          # API views
│   │   ├── llm_service.py    # Gemini API integration
│   │   └── urls.py           # URL routing
│   ├── manage.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── entrypoint.sh
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── App.js            # Main app component
│   │   ├── TicketForm.js     # Ticket submission form
│   │   ├── TicketList.js     # Ticket list with filters
│   │   ├── StatsDashboard.js # Statistics display
│   │   ├── api.js            # API client
│   │   └── index.css         # Styles
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## License

MIT
