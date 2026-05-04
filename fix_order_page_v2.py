#!/usr/bin/env python3
"""
Fix JSX structure - move footer inside showCart conditional
"""

def fix_jsx():
    file_path = r'c:\Users\jiji\Documents\whatsapp-chap-chap\src\app\order\page.tsx'
    
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    print(f"Total lines: {len(lines)}")
    
    # Find key line numbers
    desktop_grid_end = None  # Line with "</div>{/* End Desktop Grid */}"
    footer_start = None      # Line with "{/* Footer Actions */}"
    style_tag = None         # Line with "<style>"
    
    for i, line in enumerate(lines):
        if '</div>{/* End Desktop Grid */}' in line:
            desktop_grid_end = i
            print(f"Found desktop grid end at line {i+1}")
        if '{/* Footer Actions */}' in line and footer_start is None:
            footer_start = i
            print(f"Found footer start at line {i+1}")
        if '<style>{`' in line and style_tag is None:
            style_tag = i
            print(f"Found style tag at line {i+1}")
    
    if not all([desktop_grid_end, footer_start, style_tag]):
        print("ERROR: Missing markers!")
        return False
    
    # The structure should be:
    # Line ~1456: </div>{/* End Desktop Grid */}
    # Line ~1457: (empty)
    # Line ~1458: {/* Footer Actions */}
    # ...footer content...
    # Line ~1499: </div> (footer div close)
    # Line ~1500: (empty)
    # Line ~1501: <style>
    
    # We need to insert:
    # After line 1456 (desktop grid end): nothing
    # Before footer starts: <> (fragment open)
    # After footer ends (before style): </>) } (fragment close + conditional close)
    
    print(f"\nDesktop grid ends at: {desktop_grid_end + 1}")
    print(f"Footer starts at: {footer_start + 1}")
    print(f"Style tag at: {style_tag + 1}")
    
    # Insert fragment open after desktop grid end
    # Insert fragment close + conditional close before style tag
    
    new_lines = []
    
    for i, line in enumerate(lines):
        new_lines.append(line)
        
        # After desktop grid end, add fragment open
        if i == desktop_grid_end:
            # Check if next line is empty or footer comment
            if i + 1 < len(lines):
                next_line = lines[i + 1].strip()
                if next_line == '' or '{/* Footer Actions */}' in next_line:
                    new_lines.append('        <>\n')
                    print(f"Added fragment open after line {i+1}")
        
        # Before style tag, add fragment close and conditional close
        if i == style_tag - 1:
            # Previous line should be the footer closing </div>
            new_lines.append('        </>\n')
            new_lines.append('        )}\n')
            print(f"Added fragment close and conditional close before style tag at line {i+2}")
    
    # Write back
    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    
    print("\n✓ Structure fixed!")
    return True

if __name__ == '__main__':
    fix_jsx()
