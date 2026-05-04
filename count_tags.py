#!/usr/bin/env python3
"""
Count opening and closing tags to find mismatch
"""

def count_tags():
    file_path = r'c:\Users\jiji\Documents\whatsapp-chap-chap\src\app\order\page.tsx'
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Count from the return statement onwards (around line 759)
    lines = content.split('\n')
    
    # Start counting from line 759 where the main return is
    start_line = 758  # 0-indexed
    
    open_divs = 0
    close_divs = 0
    open_fragments = 0
    close_fragments = 0
    
    for i in range(start_line, len(lines)):
        line = lines[i]
        
        # Count <div openings (but not self-closing)
        import re
        open_divs += len(re.findall(r'<div[^>]*[^/]>', line))
        close_divs += len(re.findall(r'</div>', line))
        
        # Count fragment opens/closes
        open_fragments += len(re.findall(r'<>', line))
        close_fragments += len(re.findall(r'</>', line))
    
    print(f"From line {start_line + 1} to end:")
    print(f"  Opening <div>: {open_divs}")
    print(f"  Closing </div>: {close_divs}")
    print(f"  Difference: {open_divs - close_divs}")
    print()
    print(f"  Opening <>: {open_fragments}")
    print(f"  Closing </>: {close_fragments}")
    print(f"  Difference: {open_fragments - close_fragments}")
    
    if open_divs != close_divs:
        print(f"\n⚠️  MISMATCH: {open_divs - close_divs} unclosed <div> tags")
    if open_fragments != close_fragments:
        print(f"\n⚠️  MISMATCH: {open_fragments - close_fragments} unclosed <> fragments")

if __name__ == '__main__':
    count_tags()
