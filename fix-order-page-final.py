#!/usr/bin/env python3
"""
Final fix: Move footer inside the conditional rendering
"""

file_path = r"c:\Users\jiji\Documents\whatsapp-chap-chap\src\app\order\page.tsx"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

print("Analyzing structure...")

# The problem: Footer is AFTER the )} closing the cart conditional
# It should be INSIDE the product view section (inside the <>)

# Find the pattern:
# 1. ")}" that closes the cart conditional (after Desktop Grid)
# 2. Then footer
# 3. Then </>

# We need to move the footer BEFORE the ")}" and "</>"

# Current structure (WRONG):
# Desktop Grid
# )}
# </>
# Footer
# </>
# )}
# <style>

# Correct structure:
# Desktop Grid
# Footer
# </>
# )}
# <style>

# Find and fix
# Pattern: "</div>{/* End Desktop Grid */}\n\n        )}\n\n        {/* Footer Actions */}"
wrong_pattern = "</div>{/* End Desktop Grid */}\n\n        )}\n\n        {/* Footer Actions */}"

if wrong_pattern in content:
    print("✅ Found wrong pattern")
    # Replace with footer first, then closing
    correct_pattern = "</div>{/* End Desktop Grid */}\n\n        {/* Footer Actions */}"
    content = content.replace(wrong_pattern, correct_pattern, 1)
    print("✅ Fixed pattern 1")

# Now find the duplicate </> and )} at the end
# Pattern: "</div>\n\n        </>\n\n        )}\n\n        <style>"
wrong_pattern2 = "</div>\n\n        </>\n\n        )}\n\n        <style>"

if wrong_pattern2 in content:
    print("✅ Found wrong pattern 2")
    # Replace with just </> then )}
    correct_pattern2 = "</div>\n\n        </>\n\n        )}\n\n        <style>"
    # This is actually correct! The issue is we need to move the footer before these
    
    # Let's look for: Footer ... </div> ... </> ... )}
    # And change to: Footer ... </div> ... </> ... )}
    # Actually the footer is already in the right place after our first fix
    
print("\nVerifying structure...")

# Count occurrences
cart_opens = content.count('{showCart ? (')
cart_closes = content.count(') : (')
fragment_opens = content.count('<>')
fragment_closes = content.count('</>')

print(f"Cart conditional: {cart_opens} opens, {cart_closes} closes")
print(f"Fragments: {fragment_opens} opens, {fragment_closes} closes")

# Write fixed content
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("\n✅ File saved!")
