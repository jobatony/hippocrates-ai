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
    list_display   = ['title', 'status', 'block_count', 'created_at']
    list_filter    = ['status']
    search_fields  = ['title']
    readonly_fields = ['id', 'created_at', 'updated_at']
    inlines        = [BlockInline]

    def block_count(self, obj):
        return obj.blocks.count()
    block_count.short_description = 'Blocks'


@admin.register(Block)
class BlockAdmin(admin.ModelAdmin):
    list_display   = ['short_text', 'block_type', 'material', 'parent', 'order']
    list_filter    = ['block_type', 'material']
    search_fields  = ['text']
    readonly_fields = ['id', 'created_at']

    def short_text(self, obj):
        return obj.text[:80]
    short_text.short_description = 'Text'
