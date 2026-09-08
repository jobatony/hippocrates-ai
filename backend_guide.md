# Hippocrates AI — Backend Implementation Guide
## Document Parsing & Containerization

> **Scope:** This guide covers everything up to and including the document ingestion pipeline.  
> It does **not** cover: Celery/Redis async tasks, Django Channels/WebSockets, or frontend API integration.  
> Superuser: `jobatony23@gmail.com` / `Caleb080#`

---

## Phase 0: Environment & Project Scaffolding

### Step 0.1 — Prerequisites
Ensure the following are installed on your machine:
- Python `3.11+`
- Docker Desktop (for PostgreSQL container)
- `pip` and `venv`

---

### Step 0.2 — Create the Django Project

```bash
# From inside the `Distinction AI` root folder
mkdir backend && cd backend

python -m venv venv
venv\Scripts\activate          # Windows

pip install django djangorestframework python-docx Pillow psycopg2-binary python-decouple django-cors-headers
```

```bash
django-admin startproject hippocrates .
python manage.py startapp documents
```

Your folder structure should look like:
```
backend/
├── hippocrates/          # Django project config
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── documents/            # The core app
│   ├── models.py
│   ├── views.py
│   ├── serializers.py
│   ├── urls.py
│   └── parser.py         # (you'll create this)
├── manage.py
└── requirements.txt
```

---

### Step 0.3 — Create `requirements.txt`

```txt
django>=4.2
djangorestframework>=3.15
python-docx>=1.1
Pillow>=10.0
psycopg2-binary>=2.9
python-decouple>=3.8
django-cors-headers>=4.3
```

Save and run:
```bash
pip install -r requirements.txt
```

---

## Phase 1: Database — PostgreSQL via Docker

### Step 1.1 — Create `docker-compose.yml` in the `backend/` root

```yaml
version: "3.9"

services:
  db:
    image: postgres:15
    container_name: hippocrates_db
    restart: always
    environment:
      POSTGRES_DB: hippocrates
      POSTGRES_USER: hippo_user
      POSTGRES_PASSWORD: hippo_pass
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

```bash
# Start the database
docker-compose up -d db
```

> Verify it's running: `docker ps` — you should see `hippocrates_db` listed.

---

### Step 1.2 — Create `.env` file in `backend/`

```env
SECRET_KEY=your-long-random-secret-key-here
DEBUG=True
DB_NAME=hippocrates
DB_USER=hippo_user
DB_PASSWORD=hippo_pass
DB_HOST=localhost
DB_PORT=5432
```

> Generate a secret key with:
> ```bash
> python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
> ```

---

### Step 1.3 — Configure `settings.py`

Replace the relevant sections of `hippocrates/settings.py`:

```python
from decouple import config

SECRET_KEY = config('SECRET_KEY')
DEBUG = config('DEBUG', default=False, cast=bool)
ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third party
    'rest_framework',
    'corsheaders',
    # Local
    'documents',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',   # must be FIRST
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('DB_NAME'),
        'USER': config('DB_USER'),
        'PASSWORD': config('DB_PASSWORD'),
        'HOST': config('DB_HOST', default='localhost'),
        'PORT': config('DB_PORT', default='5432'),
    }
}

# Media files (uploaded .docx files)
import os
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# CORS — allow the React dev server
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://localhost:5174',
]

# DRF defaults
REST_FRAMEWORK = {
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.MultiPartParser',   # for file uploads
        'rest_framework.parsers.JSONParser',
    ],
}
```

---

## Phase 2: Data Models

### Step 2.1 — Design

We use an **adjacency list** for the Block tree. Each Block has:
- `material` — FK to the parent `Material`
- `parent` — self-referential FK (null for root blocks)
- `order` — integer for sibling ordering
- `block_type` — heading_1 / heading_2 / heading_3 / paragraph / list_item
- `text` — the raw text content

> **Why adjacency list and not MPTT?** Documents are small, shallow trees. The complex subtree-query optimizations of MPTT aren't needed. Adjacency lists are simpler to write, read, and migrate.

### Step 2.2 — Write `documents/models.py`

```python
import uuid
from django.db import models


class Material(models.Model):
    """
    Represents an uploaded study document.
    Once questions reference its blocks, the material is immutable —
    re-uploads create a new Material rather than mutating this one.
    """

    class Status(models.TextChoices):
        PENDING   = 'pending',   'Pending'
        PARSING   = 'parsing',   'Parsing'
        READY     = 'ready',     'Ready'
        FAILED    = 'failed',    'Failed'

    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title       = models.CharField(max_length=500)
    file        = models.FileField(upload_to='materials/')
    status      = models.CharField(
                    max_length=20,
                    choices=Status.choices,
                    default=Status.PENDING,
                  )
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class Block(models.Model):
    """
    One row per structural unit of a Material (heading, paragraph, list item).
    Stored as an adjacency list — reconstruct the tree on the frontend
    using parent_id references.
    """

    class BlockType(models.TextChoices):
        HEADING_1   = 'heading_1',   'Heading 1'
        HEADING_2   = 'heading_2',   'Heading 2'
        HEADING_3   = 'heading_3',   'Heading 3'
        PARAGRAPH   = 'paragraph',   'Paragraph'
        LIST_ITEM   = 'list_item',   'List Item'

    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    material    = models.ForeignKey(
                    Material,
                    on_delete=models.CASCADE,
                    related_name='blocks',
                  )
    parent      = models.ForeignKey(
                    'self',
                    null=True,
                    blank=True,
                    on_delete=models.CASCADE,
                    related_name='children',
                  )
    order       = models.PositiveIntegerField()
    block_type  = models.CharField(max_length=20, choices=BlockType.choices)
    text        = models.TextField(blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order']
        unique_together = [('material', 'parent', 'order')]

    def __str__(self):
        return f"[{self.block_type}] {self.text[:60]}"
```

---

### Step 2.3 — Run Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

---

### Step 2.4 — Create the Superuser

```bash
python manage.py createsuperuser
```

When prompted:
- **Username:** `jobatony`
- **Email:** `jobatony23@gmail.com`
- **Password:** `Caleb080#`

---

## Phase 3: The Document Parser

### Step 3.1 — Parsing Strategy

`python-docx` exposes a document's paragraphs in order. We map styles to block types:

| Word Style | BlockType |
|---|---|
| `Heading 1` | `heading_1` |
| `Heading 2` | `heading_2` |
| `Heading 3` | `heading_3` |
| `Normal` / `Body Text` | `paragraph` |
| `List Paragraph` / `List Bullet` / `List Number` | `list_item` |

**Tree construction rule:** Headings act as parents for content that follows them. H2 is a child of the most recent H1; H3 is a child of the most recent H2; paragraphs and list items are children of the deepest recent heading.

---

### Step 3.2 — Create `documents/parser.py`

```python
"""
documents/parser.py

Parses a .docx file and writes Block rows into the database.
Call: parse_docx(material_instance)
"""

from docx import Document as DocxDocument
from docx.oxml.ns import qn

from .models import Block, Material


HEADING_STYLE_MAP = {
    'Heading 1': Block.BlockType.HEADING_1,
    'heading 1': Block.BlockType.HEADING_1,
    'Heading 2': Block.BlockType.HEADING_2,
    'heading 2': Block.BlockType.HEADING_2,
    'Heading 3': Block.BlockType.HEADING_3,
    'heading 3': Block.BlockType.HEADING_3,
}

LIST_STYLES = {'List Paragraph', 'List Bullet', 'List Number'}


def _get_block_type(para) -> str:
    style_name = para.style.name if para.style else ''

    if style_name in HEADING_STYLE_MAP:
        return HEADING_STYLE_MAP[style_name]

    if style_name in LIST_STYLES:
        return Block.BlockType.LIST_ITEM

    # Detect list by XML numPr element (catches unstyled lists)
    if para._element.find(qn('w:numPr')) is not None:
        return Block.BlockType.LIST_ITEM

    return Block.BlockType.PARAGRAPH


def _heading_level(block_type: str) -> int:
    """Return numeric heading depth, or 99 for non-headings."""
    levels = {
        Block.BlockType.HEADING_1: 1,
        Block.BlockType.HEADING_2: 2,
        Block.BlockType.HEADING_3: 3,
    }
    return levels.get(block_type, 99)


def parse_docx(material: Material) -> int:
    """
    Parse the .docx file attached to `material`, create Block rows,
    and return the total number of blocks created.
    """
    docx = DocxDocument(material.file.path)

    heading_stack: dict[int, Block | None] = {1: None, 2: None, 3: None}
    global_order = 0
    blocks_created = 0

    for para in docx.paragraphs:
        text = para.text.strip()

        if not text:
            continue

        block_type = _get_block_type(para)
        level = _heading_level(block_type)

        # Determine parent block
        if level == 1:
            parent = None
        elif level == 2:
            parent = heading_stack[1]
        elif level == 3:
            parent = heading_stack[2] or heading_stack[1]
        else:
            # Paragraph / list item
            parent = heading_stack[3] or heading_stack[2] or heading_stack[1]

        block = Block.objects.create(
            material=material,
            parent=parent,
            order=global_order,
            block_type=block_type,
            text=text,
        )

        if level <= 3:
            heading_stack[level] = block
            # Invalidate deeper levels
            for deeper in range(level + 1, 4):
                heading_stack[deeper] = None

        global_order += 1
        blocks_created += 1

    return blocks_created
```

---

## Phase 4: DRF Serializers & Views

### Step 4.1 — Create `documents/serializers.py`

```python
from rest_framework import serializers
from .models import Material, Block


class BlockSerializer(serializers.ModelSerializer):
    """
    Flat serializer. Sends parent_id so React can reconstruct the
    tree client-side (parent_id -> children map).
    """
    parent_id = serializers.UUIDField(source='parent.id', allow_null=True, read_only=True)

    class Meta:
        model  = Block
        fields = ['id', 'parent_id', 'order', 'block_type', 'text']


class MaterialSerializer(serializers.ModelSerializer):
    """For listing materials (no blocks embedded)."""

    class Meta:
        model  = Material
        fields = ['id', 'title', 'status', 'created_at']
        read_only_fields = ['id', 'status', 'created_at']


class MaterialUploadSerializer(serializers.ModelSerializer):
    """For the POST /api/materials/ upload endpoint."""

    class Meta:
        model  = Material
        fields = ['id', 'title', 'file']
        read_only_fields = ['id']


class MaterialDetailSerializer(serializers.ModelSerializer):
    """
    Returns material metadata + all blocks as a flat ordered array.
    """
    blocks = BlockSerializer(many=True, read_only=True)

    class Meta:
        model  = Material
        fields = ['id', 'title', 'status', 'created_at', 'blocks']
```

---

### Step 4.2 — Create `documents/views.py`

```python
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, JSONParser

from .models import Material
from .serializers import (
    MaterialSerializer,
    MaterialUploadSerializer,
    MaterialDetailSerializer,
)
from .parser import parse_docx


class MaterialListCreateView(APIView):
    """
    GET  /api/materials/   → list all materials
    POST /api/materials/   → upload a .docx and trigger parsing
    """
    parser_classes = [MultiPartParser, JSONParser]

    def get(self, request):
        materials = Material.objects.all()
        serializer = MaterialSerializer(materials, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = MaterialUploadSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        material = serializer.save(status=Material.Status.PARSING)

        try:
            block_count = parse_docx(material)
            material.status = Material.Status.READY
            material.save(update_fields=['status'])
        except Exception as exc:
            material.status = Material.Status.FAILED
            material.save(update_fields=['status'])
            return Response(
                {'detail': f'Parsing failed: {exc}'},
                status=status.HTTP_422_UNPROCESSABLE_ENTITY,
            )

        return Response(
            {
                'id': str(material.id),
                'title': material.title,
                'status': material.status,
                'blocks_created': block_count,
            },
            status=status.HTTP_201_CREATED,
        )


class MaterialDetailView(APIView):
    """
    GET    /api/materials/<uuid>/  → material + flat block array
    DELETE /api/materials/<uuid>/  → delete material and all its blocks
    """

    def _get_material(self, pk):
        try:
            return Material.objects.get(pk=pk)
        except Material.DoesNotExist:
            return None

    def get(self, request, pk):
        material = self._get_material(pk)
        if not material:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = MaterialDetailSerializer(material)
        return Response(serializer.data)

    def delete(self, request, pk):
        material = self._get_material(pk)
        if not material:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        material.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
```

---

### Step 4.3 — Create `documents/urls.py`

```python
from django.urls import path
from .views import MaterialListCreateView, MaterialDetailView

urlpatterns = [
    path('materials/',           MaterialListCreateView.as_view(), name='material-list'),
    path('materials/<uuid:pk>/', MaterialDetailView.as_view(),    name='material-detail'),
]
```

---

### Step 4.4 — Wire into `hippocrates/urls.py`

```python
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('documents.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

---

## Phase 5: Django Admin

### Step 5.1 — `documents/admin.py`

```python
from django.contrib import admin
from .models import Material, Block


class BlockInline(admin.TabularInline):
    model = Block
    extra = 0
    readonly_fields = ['id', 'parent', 'order', 'block_type', 'text', 'created_at']
    can_delete = False
    show_change_link = True


@admin.register(Material)
class MaterialAdmin(admin.ModelAdmin):
    list_display    = ['title', 'status', 'block_count', 'created_at']
    list_filter     = ['status']
    search_fields   = ['title']
    readonly_fields = ['id', 'created_at', 'updated_at']
    inlines         = [BlockInline]

    def block_count(self, obj):
        return obj.blocks.count()
    block_count.short_description = 'Blocks'


@admin.register(Block)
class BlockAdmin(admin.ModelAdmin):
    list_display    = ['short_text', 'block_type', 'material', 'parent', 'order']
    list_filter     = ['block_type', 'material']
    search_fields   = ['text']
    readonly_fields = ['id', 'created_at']

    def short_text(self, obj):
        return obj.text[:80]
    short_text.short_description = 'Text'
```

---

## Phase 6: Test the Full Pipeline

### Step 6.1 — Start everything

```bash
# Terminal 1 — ensure the database is up
docker-compose up -d db

# Terminal 2 — start Django
python manage.py runserver
```

### Step 6.2 — Log into Django Admin

Navigate to `http://127.0.0.1:8000/admin/`

Login:
- **Username:** `jobatony`
- **Password:** `Caleb080#`

Confirm `Materials` and `Blocks` appear under the **Documents** section.

---

### Step 6.3 — Test the API Endpoints

**Upload a document:**
```bash
curl -X POST http://127.0.0.1:8000/api/materials/ \
  -F "title=Diabetes Mellitus Notes" \
  -F "file=@/path/to/your/notes.docx"
```

Expected response (`201 Created`):
```json
{
  "id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "title": "Diabetes Mellitus Notes",
  "status": "ready",
  "blocks_created": 42
}
```

**Retrieve the material with its flat block tree:**
```bash
curl http://127.0.0.1:8000/api/materials/<uuid>/
```

Expected structure:
```json
{
  "id": "...",
  "title": "Diabetes Mellitus Notes",
  "status": "ready",
  "created_at": "...",
  "blocks": [
    {
      "id": "block-uuid-1",
      "parent_id": null,
      "order": 0,
      "block_type": "heading_1",
      "text": "Chapter 1 — Pathophysiology"
    },
    {
      "id": "block-uuid-2",
      "parent_id": "block-uuid-1",
      "order": 1,
      "block_type": "paragraph",
      "text": "Type 2 DM is characterised by..."
    }
  ]
}
```

**List all materials:**
```bash
curl http://127.0.0.1:8000/api/materials/
```

**Delete a material:**
```bash
curl -X DELETE http://127.0.0.1:8000/api/materials/<uuid>/
```

---

## Phase 7: Commit to GitHub

```bash
# From the `Distinction AI` root
git add backend/
git commit -m "feat: Django backend — Material model, Block adjacency list, docx parser, DRF API"
git push origin main
```

---

## Summary

| Component | Done |
|---|---|
| Docker PostgreSQL container | ✅ |
| Django project & `documents` app | ✅ |
| `Material` model (upload + status lifecycle) | ✅ |
| `Block` model (adjacency list, UUID PKs) | ✅ |
| `parser.py` — `.docx` → Block rows in DB | ✅ |
| DRF serializers (flat block output for frontend) | ✅ |
| Upload, detail, list, delete API views | ✅ |
| Django admin with inline block viewer | ✅ |
| Superuser `jobatony23@gmail.com` / `Caleb080#` | ✅ |

---

## What Comes Next

- **Question model + Strategy Registry** — `TrueFalseStrategy`, `MCQStrategy`, `FillInGapStrategy`
- **Celery + Redis** — move parsing and LLM calls to background tasks
- **Django Channels + WebSockets** — push generated questions live to the React frontend
- **Frontend API connection** — wire the block array into the React `DocumentRenderer`
