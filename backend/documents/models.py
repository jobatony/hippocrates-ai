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
    file        = models.FileField(upload_to='materials/')   # stores the original .docx
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
        # Each block's order must be unique within its parent scope
        unique_together = [('material', 'parent', 'order')]

    def __str__(self):
        return f"[{self.block_type}] {self.text[:60]}"
