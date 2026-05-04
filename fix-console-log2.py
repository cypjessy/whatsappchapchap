#!/usr/bin/env python3

# Read the file
with open('src/app/(app)/settings/page.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find and remove the console.log lines
new_lines = []
skip_next = False
for i, line in enumerate(lines):
    if skip_next:
        skip_next = False
        continue
    
    # Skip lines with console.log in JSX
    if "{console.log(" in line and "Shipping Tab Rendering" in line:
        continue
    
    new_lines.append(line)

# Write back
with open('src/app/(app)/settings/page.tsx', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print(f"✓ Removed console.log lines. Total lines: {len(lines)} -> {len(new_lines)}")
