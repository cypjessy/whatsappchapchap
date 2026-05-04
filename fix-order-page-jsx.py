#!/usr/bin/env python3
"""
Fix JSX structure issues in order page
Analyzes and fixes mismatched braces, fragments, and conditional rendering
"""

import re

def fix_jsx_structure(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    print("Analyzing JSX structure...")
    
    # Find the return statement section
    return_match = re.search(r'return\s*\(\s*<div.*?<div style=\{\{ width: "100%"', content, re.DOTALL)
    
    if not return_match:
        print("❌ Could not find return statement")
        return False
    
    # Find all problematic patterns
    issues = []
    
    # Pattern 1: Find </> followed by )} (wrong order)
    fragment_close_pattern = r'\s*</>\s*\)\}'
    matches = list(re.finditer(fragment_close_pattern, content))
    if matches:
        issues.append({
            'type': 'fragment_order',
            'matches': matches
        })
        print(f"Found {len(matches)} fragment closing issues")
    
    # Pattern 2: Find orphaned )} without matching {
    # Count braces in the cart view section
    cart_section_start = content.find('{showCart ? (')
    cart_section_end = content.find(') : (', cart_section_start)
    
    if cart_section_start != -1 and cart_section_end != -1:
        cart_view = content[cart_section_start:cart_section_end]
        open_braces = cart_view.count('{')
        close_braces = cart_view.count('}')
        
        print(f"Cart view section: {open_braces} open braces, {close_braces} close braces")
        
        if open_braces != close_braces:
            issues.append({
                'type': 'brace_mismatch',
                'location': 'cart_view',
                'open': open_braces,
                'close': close_braces
            })
    
    # Find the product section (after "): (")
    product_section_start = content.find(') : (', cart_section_start if cart_section_start != -1 else 0)
    if product_section_start != -1:
        # Find where product section ends (before footer or closing)
        next_major_close = content.find('</div>\n\n        </>', product_section_start)
        if next_major_close == -1:
            next_major_close = content.find('</>\n        )}', product_section_start)
        
        if next_major_close != -1:
            product_section = content[product_section_start:next_major_close]
            open_braces = product_section.count('{')
            close_braces = product_section.count('}')
            
            print(f"Product section: {open_braces} open braces, {close_braces} close braces")
            
            if open_braces != close_braces:
                issues.append({
                    'type': 'brace_mismatch',
                    'location': 'product_section',
                    'open': open_braces,
                    'close': close_braces
                })
    
    # Fix strategy: Restructure the return statement
    print("\n🔧 Applying fixes...")
    
    # Find the exact location to fix
    # We need to find: </div>{/* End Desktop Grid */}\n\n        </>\n        )}
    bad_pattern1 = r'(\s*</div>\{/\* End Desktop Grid \*/\})\s*\n\s*</>\s*\n\s*\)\}'
    
    match1 = re.search(bad_pattern1, content)
    if match1:
        print(f"Found bad pattern 1 at position {match1.start()}")
        # Replace with correct order: )}\n\n        </>
        correct_replacement = match1.group(1) + '\n\n        )}\n\n        </>'
        content = content[:match1.start()] + correct_replacement + content[match1.end():]
        print("✅ Fixed fragment closing order (pattern 1)")
    
    # Also fix the duplicate pattern at the footer
    bad_pattern2 = r'(\s*</div>\n\n        </>)\s*\n\s*\)\}'
    
    match2 = re.search(bad_pattern2, content)
    if match2:
        print(f"Found bad pattern 2 at position {match2.start()}")
        # This should be just </div> followed by </> and then )}
        correct_replacement2 = match2.group(1).replace('</>', '') + '\n\n        </>\n\n        )}'
        content = content[:match2.start()] + correct_replacement2 + content[match2.end():]
        print("✅ Fixed fragment closing order (pattern 2)")
    
    # Verify the fix
    print("\n📊 Verification:")
    
    # Check for remaining issues
    remaining_bad = re.findall(r'</>\s*\)\}', content)
    if remaining_bad:
        print(f"⚠️  Still found {len(remaining_bad)} incorrect patterns")
    else:
        print("✅ No incorrect fragment patterns found")
    
    # Count total fragments
    fragment_opens = content.count('<>')
    fragment_closes = content.count('</>')
    print(f"Fragment opens: {fragment_opens}, closes: {fragment_closes}")
    
    if fragment_opens != fragment_closes:
        print(f"⚠️  Mismatch: {fragment_opens} opens vs {fragment_closes} closes")
    else:
        print("✅ Fragment count matches")
    
    # Write fixed content
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("\n✅ File saved successfully!")
    return True

if __name__ == "__main__":
    file_path = r"c:\Users\jiji\Documents\whatsapp-chap-chap\src\app\order\page.tsx"
    success = fix_jsx_structure(file_path)
    
    if not success:
        print("\n❌ Failed to fix file")
        exit(1)
