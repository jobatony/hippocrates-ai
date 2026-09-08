# AI Document Structuring Prompt

*Use this prompt in ChatGPT, Claude, or any other AI assistant to perfectly format messy text or notes before bringing them into Hippocrates AI.*

***

**Copy the text below:**

```text
You are a document structuring assistant helping me prepare a medical or academic 
study document for a learning application called Hippocrates AI. 

The application parses .docx files using a strict structural system. Your job is 
to take the text I give you and reformat it into a clearly structured document 
following the exact rules below. Output the result as cleanly formatted text that 
I can paste into Microsoft Word.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STRUCTURAL RULES YOU MUST FOLLOW:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

HEADING LEVELS:
- Use "Heading 1" for the main topic or chapter title (only 1–2 per document).
  Example: Diabetes Mellitus
- Use "Heading 2" for major sections or subtopics within the main topic.
  Example: Pathophysiology, Epidemiology, Clinical Features
- Use "Heading 3" for sub-sections within a major section.
  Example: Insulin Resistance, Beta Cell Dysfunction
- Do NOT go deeper than Heading 3. If you need more depth, use a paragraph 
  with a bold introductory phrase instead.

PARAGRAPHS:
- Write paragraphs in plain, flowing prose under the relevant heading.
- Each paragraph should cover ONE idea or concept clearly.
- Do NOT number your paragraphs.
- Keep paragraphs under the heading they belong to — do not orphan text without 
  a heading above it.
- If multiple paragraphs cover the same topic under a heading, keep them 
  consecutive (back-to-back with no heading in between), as the system will 
  group them automatically into one contextual block.

LISTS:
- Use bullet lists (•) or numbered lists ONLY for:
    - Enumerating discrete items (e.g., risk factors, symptoms, drugs)
    - Step-by-step processes
    - Comparative features
- Do NOT use lists for prose explanations — those should be paragraphs.
- Keep all list items under the same heading consecutive 
  (back-to-back). Do not separate list items with headings in between.
- Each list item should be a short, standalone fact or phrase.
  Bad:  "Insulin resistance occurs when cells stop responding properly 
         to insulin due to various metabolic changes"
  Good: "Insulin resistance — reduced cellular response to insulin"

HIERARCHY INTEGRITY:
- Everything under a Heading 2 must be directly relevant to its parent Heading 1.
- Everything under a Heading 3 must be directly relevant to its parent Heading 2.
- Never put a Heading 3 before its corresponding Heading 2 has been introduced.
- Never put a Heading 2 before its corresponding Heading 1 has been introduced.

WHAT TO AVOID:
- Do NOT use bold or italic text as a substitute for proper headings.
- Do NOT use ALL CAPS text as section titles.
- Do NOT include tables (tables are not supported yet).
- Do NOT include images or figures.
- Do NOT leave long blocks of unbroken text with no paragraph breaks.
- Do NOT mix list items and prose in the same block — separate them clearly.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXAMPLE OF CORRECT OUTPUT FORMAT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Heading 1] Diabetes Mellitus Type 2

[Heading 2] Definition and Overview

[Paragraph] Type 2 diabetes mellitus is a chronic metabolic disorder 
characterised by hyperglycaemia resulting from insulin resistance and relative 
insulin deficiency. Unlike Type 1, it does not involve autoimmune beta cell 
destruction.

[Paragraph] The condition typically develops gradually over many years and is 
strongly associated with lifestyle and genetic factors.

[Heading 2] Pathophysiology

[Heading 3] Insulin Resistance

[Paragraph] Insulin resistance refers to the reduced ability of peripheral 
tissues — particularly skeletal muscle, liver, and adipose tissue — to respond 
to insulin signalling.

[Heading 3] Beta Cell Dysfunction

[Paragraph] To compensate for peripheral resistance, pancreatic beta cells 
initially increase insulin output. Over time, however, beta cell exhaustion leads 
to declining insulin production and worsening hyperglycaemia.

[Heading 2] Risk Factors

[List]
• Obesity, particularly central (visceral) adiposity
• Physical inactivity and sedentary lifestyle
• Family history and genetic predisposition
• Age over 45 years
• History of gestational diabetes

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOUR TASK:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Please take the following text and restructure it according to all the rules 
above. Identify and create appropriate Heading 1, Heading 2, and Heading 3 
sections. Group related prose into paragraphs. Convert enumerable items into 
clean bullet lists. Fix any structural problems in the original.

If the text is ambiguous or poorly organised, make intelligent decisions about 
what belongs under which heading based on academic or medical context.

Here is the text to restructure:

[PASTE YOUR DOCUMENT TEXT OR NOTES HERE]
```

***

### How to use the output:
1. Copy the AI's response.
2. Paste it into Microsoft Word.
3. Select each `[Heading 1]` line and apply the actual **Heading 1** style from the Word Home ribbon. Do the same for Heading 2 and Heading 3.
4. Remove the brackets like `[Paragraph]` or `[List]` (the AI might format them away automatically, but if doesn't, just clean them up).
5. Save as `.docx` and upload to Hippocrates AI.
