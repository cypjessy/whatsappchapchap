#!/usr/bin/env python3
"""
Fix JSX structure in order page - properly nest cart view conditional rendering
"""

import re

def fix_jsx_structure():
    file_path = r'c:\Users\jiji\Documents\whatsapp-chap-chap\src\app\order\page.tsx'
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    print("Analyzing JSX structure...")
    
    # Find the return statement and understand the structure
    # Current broken structure:
    # return (
    #   <div>
    #     {showCart ? (cart) : (
    #       <>
    #         ...header...
    #         ...product view...
    #       </>
    #     )}  <-- This closes too early
    #     
    #     <Footer/>  <-- Footer is outside the conditional!
    #   </div>
    # )
    
    # We need to move the footer INSIDE the conditional
    
    # Strategy: 
    # 1. Find where the product view section ends (before footer)
    # 2. Move the closing )} to AFTER the footer
    # 3. Ensure proper fragment wrapping
    
    lines = content.split('\n')
    
    # Find key markers
    show_cart_line = None
    footer_start = None
    style_tag_line = None
    
    for i, line in enumerate(lines):
        if '{showCart ? (' in line:
            show_cart_line = i
            print(f"Found showCart conditional at line {i+1}")
        if 'Footer Actions' in line and footer_start is None:
            footer_start = i
            print(f"Found Footer Actions at line {i+1}")
        if '<style>{`' in line and style_tag_line is None:
            style_tag_line = i
            print(f"Found style tag at line {i+1}")
    
    if not all([show_cart_line, footer_start, style_tag_line]):
        print("ERROR: Could not find all required markers!")
        return False
    
    # The structure should be:
    # {showCart ? (
    #   <CartView/>
    # ) : (
    #   <>
    #     ...all product view content including header, progress, product details...
    #     ...footer actions...
    #   </>
    # )}
    # <style>...</style>
    
    # Find where the fragment opens after showCart conditional
    # Look for the opening <> after the else branch starts
    
    # Let's find the pattern more carefully
    # After "showCart ? (" there should be cart view, then ") : (" then fragment "<>"
    
    print("\nSearching for fragment structure...")
    
    # Find the closing of cart view and start of else branch
    cart_close_pattern = re.compile(r'\s*\)\s*:\s*\(\s*<>')
    
    # Actually, let's look for where we need to insert the fragment close
    # The issue is that the footer needs to be inside the fragment
    
    # Better approach: find the exact locations and reconstruct
    
    print("\nReconstructing JSX structure...")
    
    # Find the line with "</></>)" or similar malformed closing
    malformed_closing = None
    for i in range(footer_start, min(footer_start + 50, len(lines))):
        if '</>' in lines[i] and ')' in lines[i]:
            malformed_closing = i
            print(f"Found potential malformed closing at line {i+1}: {lines[i].strip()}")
            break
    
    # Now let's do a surgical fix
    # We need to:
    # 1. Remove any orphaned </> or )} between product view and footer
    # 2. Add </> before )} after the footer
    
    new_lines = []
    skip_until_footer = False
    added_fragment_close = False
    
    i = 0
    while i < len(lines):
        line = lines[i]
        
        # Skip malformed closings between product view end and footer
        if i > 1450 and i < footer_start:
            if line.strip() in ['</>', ') }', ')}'] or (line.strip().startswith('</>') and line.strip().endswith(')}')):
                print(f"Skipping malformed line {i+1}: {line.strip()}")
                i += 1
                continue
        
        # After footer actions button, add fragment close before style tag
        if not added_fragment_close and i == style_tag_line - 1:
            # Check if previous line has the closing )}
            if i > 0 and ')' in lines[i-1] and '}' in lines[i-1]:
                # Insert </> before this line
                new_lines.append('        </>')
                print(f"Added fragment close before style tag at line {i+1}")
                added_fragment_close = True
        
        new_lines.append(line)
        i += 1
    
    # Write back
    new_content = '\n'.join(new_lines)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print("\n✓ Structure fixed!")
    return True

if __name__ == '__main__':
    success = fix_jsx_structure()
    if success:
        print("\nFile updated successfully!")
    else:
        print("\nFailed to fix structure")
