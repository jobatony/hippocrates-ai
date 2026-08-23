"""
documents/parser.py

Parses a .docx file and writes Block rows into the database.
Call: parse_docx(material_instance)
"""

from docx import Document as DocxDocument
from docx.oxml.ns import qn

from .models import Block, Material


# Map python-docx style names to our BlockType choices
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
    """
    Determine the block type of a python-docx paragraph.
    """
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

    Tree rules
    ----------
    - H1 blocks are root nodes (parent=None).
    - H2 blocks are children of the most recent H1.
    - H3 blocks are children of the most recent H2 (or H1 if none).
    - Paragraphs and list items are children of the most recent heading.
    - If a paragraph appears before any heading it's treated as a root node.
    """

    docx = DocxDocument(material.file.path)

    # Track the most recently seen block at each heading level
    heading_stack: dict[int, Block | None] = {1: None, 2: None, 3: None}

    global_order = 0   # monotonically increasing order across all blocks
    blocks_created = 0
    last_block = None  # track the last created block to group consecutive paragraphs/lists

    for para in docx.paragraphs:
        text = para.text.strip()

        # Skip completely empty paragraphs
        if not text:
            continue

        block_type = _get_block_type(para)
        level = _heading_level(block_type)

        # Determine parent block
        if level == 1:
            parent = None
        elif level == 2:
            parent = heading_stack[1]   # child of last H1 (or root if none)
        elif level == 3:
            parent = heading_stack[2] or heading_stack[1]
        else:
            # Paragraph / list item — child of deepest recent heading
            parent = heading_stack[3] or heading_stack[2] or heading_stack[1]

        # Group consecutive paragraphs or list items under the same parent
        if level > 3 and last_block and last_block.block_type == block_type and last_block.parent == parent:
            separator = "\n" if block_type == Block.BlockType.LIST_ITEM else "\n\n"
            last_block.text += f"{separator}{text}"
            last_block.save(update_fields=['text'])
        else:
            block = Block.objects.create(
                material=material,
                parent=parent,
                order=global_order,
                block_type=block_type,
                text=text,
            )
            last_block = block

            # Update heading stack for subsequent blocks
            if level <= 3:
                heading_stack[level] = block
                # Invalidate deeper levels when a shallower heading appears
                for deeper in range(level + 1, 4):
                    heading_stack[deeper] = None

            global_order += 1
            blocks_created += 1

    return blocks_created
