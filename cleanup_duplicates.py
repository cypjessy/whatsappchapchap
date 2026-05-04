#!/usr/bin/env python3
"""
Clean up duplicate fragment tags and fix JSX structure
"""

def clean_and_fix():
    file_path = r'c:\Users\jiji\Documents\whatsapp-chap-chap\src\app\order\page.tsx'
    
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    print(f"Total lines: {len(lines)}")
    
    # Find and remove duplicate <> tags around line 1459-1460
    new_lines = []
    skip_next = False
    
    for i, line in enumerate(lines):
        if skip_next:
            print(f"Skipping line {i+1}: {line.rstrip()}")
            skip_next = False
            continue
        
        # Check for duplicate <> tags
        if i > 1457 and i < 1462:
            stripped = line.strip()
            if stripped == '<>':
                # Check if next line is also <>
                if i + 1 < len(lines) and lines[i + 1].strip() == '<>':
                    print(f"Found duplicate <> at line {i+1}, keeping only one")
                    skip_next = True  # Skip this one, keep the next
        
        new_lines.append(line)
    
    # Write back
    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    
    print(f"\n✓ Cleaned up! New total: {len(new_lines)} lines")
    return True

if __name__ == '__main__':
    clean_and_fix()
