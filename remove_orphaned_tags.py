#!/usr/bin/env python3
"""
Remove orphaned JSX closing tags from cart choice modal section
"""

def remove_orphaned_tags():
    file_path = r'c:\Users\jiji\Documents\whatsapp-chap-chap\src\app\order\page.tsx'
    
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    print(f"Total lines: {len(lines)}")
    
    # Find and remove orphaned </> and )} around line 641-642
    new_lines = []
    skip_count = 0
    
    for i, line in enumerate(lines):
        # Skip the orphaned tags after loading div close
        if i == 640 and lines[i].strip() == '</>':
            print(f"Skipping orphaned </> at line {i+1}")
            skip_count += 1
            continue
        
        if i == 641 and lines[i].strip() == ')}':
            print(f"Skipping orphaned closing at line {i+1}")
            skip_count += 1
            continue
        
        new_lines.append(line)
    
    # Write back
    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    
    print(f"\n✓ Removed {skip_count} orphaned tags!")
    print(f"New total: {len(new_lines)} lines")
    return True

if __name__ == '__main__':
    remove_orphaned_tags()
