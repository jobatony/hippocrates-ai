from documents.models import Block, Material

def build_heading2_context(block):
    """
    Given a Block, finds the *immediate* nearest heading (H1, H2, or H3)
    to build a localized, tightly-scoped context string.
    Returns: (context_string, heading_2_block)
    (heading_2_block is still returned for database legacy grouping)
    """
    # 1. Find the nearest heading for localized context (H1, H2, or H3)
    current = block
    nearest_heading = None
    
    while current:
        if current.block_type in [Block.BlockType.HEADING_1, Block.BlockType.HEADING_2, Block.BlockType.HEADING_3]:
            nearest_heading = current
            break
        current = current.parent
        
    if not nearest_heading:
        nearest_heading = block

    # 2. Find the traditional H2 root for the database field (so we don't break Question grouping)
    current = block
    h2_root = None
    while current:
        if current.block_type == Block.BlockType.HEADING_2:
            h2_root = current
            break
        current = current.parent
        
    if not h2_root:
        # Fallback to H1
        current = block
        while current:
            if current.block_type == Block.BlockType.HEADING_1:
                h2_root = current
                break
            current = current.parent
            
    if not h2_root:
        h2_root = block
        
    # 3. Collect only the descendants of the *nearest* heading
    def collect_descendants(node):
        descendants = []
        children = node.children.all().order_by('order')
        for child in children:
            descendants.append(child)
            descendants.extend(collect_descendants(child))
        return descendants
        
    all_blocks = [nearest_heading] + collect_descendants(nearest_heading)
    all_blocks.sort(key=lambda b: b.order)  # Ensure global order
    
    # Prepend ancestor headings so the AI understands full topic scope
    context_lines = []
    
    if nearest_heading.block_type != Block.BlockType.HEADING_1:
        # Always prepend the H1 (disease / topic name)
        h1 = block
        while h1 and h1.block_type != Block.BlockType.HEADING_1:
            h1 = h1.parent
        if h1:
            context_lines.append(f"[HEADING 1] {h1.text}")
            
    # NEW: If nearest heading is H3, also prepend the parent H2 title
    # (we only want the title, NOT all its content)
    if nearest_heading.block_type == Block.BlockType.HEADING_3:
        h2 = nearest_heading.parent
        while h2 and h2.block_type != Block.BlockType.HEADING_2:
            h2 = h2.parent
        if h2:
            context_lines.append(f"[HEADING 2] {h2.text}")
    
    # 4. Serialize
    for b in all_blocks:
        prefix = ""
        if b.block_type == Block.BlockType.HEADING_1:
            prefix = "[HEADING 1]"
        elif b.block_type == Block.BlockType.HEADING_2:
            prefix = "[HEADING 2]"
        elif b.block_type == Block.BlockType.HEADING_3:
            prefix = "[HEADING 3]"
        elif b.block_type == Block.BlockType.LIST_ITEM:
            prefix = "[LIST ITEM]"
        else:
            prefix = "[TEXT]"
            
        context_lines.append(f"{prefix} {b.text}")
        
    context_string = "\n".join(context_lines)

    # 5. Cap context length to the new strict 1000 characters limit
    MAX_CONTEXT_CHARS = 1000
    if len(context_string) > MAX_CONTEXT_CHARS:
        context_string = context_string[:MAX_CONTEXT_CHARS] + "\n... [context truncated to 1000 chars]"

    return context_string, h2_root
