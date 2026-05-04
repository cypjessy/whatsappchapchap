#!/usr/bin/env python3
"""
Fix JSX structure - properly wrap footer in fragment within showCart conditional
"""

def fix_jsx():
    file_path = r'c:\Users\jiji\Documents\whatsapp-chap-chap\src\app\order\page.tsx'
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    print("Reading file...")
    
    # The issue is clear now:
    # Line ~1456: </div>{/* End Desktop Grid */}
    # Line ~1458: {/* Footer Actions */}
    # ...footer buttons...
    # Line ~1502: </div> (footer close)
    # Line ~1504: <style>{`
    
    # We need to add <> before footer and </> )} after footer but before style
    
    lines = content.split('\n')
    
    # Find the EXACT markers we need
    desktop_grid_end_idx = None
    footer_comment_idx = None
    main_style_tag_idx = None
    
    for i, line in enumerate(lines):
        if '</div>{/* End Desktop Grid */}' in line:
            desktop_grid_end_idx = i
            print(f"✓ Desktop grid end: line {i+1}")
        
        if '{/* Footer Actions */}' in line and i > 1400:  # Only the main footer, not others
            footer_comment_idx = i
            print(f"✓ Footer comment: line {i+1}")
        
        if '<style>{`' in line and i > 1400:  # Only the main style tag
            main_style_tag_idx = i
            print(f"✓ Main style tag: line {i+1}")
    
    if not all([desktop_grid_end_idx, footer_comment_idx, main_style_tag_idx]):
        print("ERROR: Could not find all markers!")
        return False
    
    # Now reconstruct the file with proper wrapping
    new_lines = []
    
    for i, line in enumerate(lines):
        new_lines.append(line)
        
        # After desktop grid end, add fragment open BEFORE the empty line and footer comment
        if i == desktop_grid_end_idx:
            # Add fragment open
            new_lines.append('        <>')
            print(f"  → Added fragment open after line {i+1}")
        
        # Before main style tag, add fragment close and conditional close
        if i == main_style_tag_idx - 1:
            new_lines.append('        </>')
            new_lines.append('        )}')
            print(f"  → Added fragment close and conditional close before line {i+2}")
    
    # Write back
    new_content = '\n'.join(new_lines)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print("\n✓ File updated successfully!")
    print(f"  - Fragment open added after line {desktop_grid_end_idx + 1}")
    print(f"  - Fragment close + conditional close added before line {main_style_tag_idx + 1}")
    
    return True

if __name__ == '__main__':
    success = fix_jsx()
    if success:
        print("\n🎉 Structure fixed! Ready to build.")
    else:
        print("\n❌ Failed to fix structure")
