#!/usr/bin/env python3
"""
Precise fix for order page JSX structure
"""

file_path = r"c:\Users\jiji\Documents\whatsapp-chap-chap\src\app\order\page.tsx"

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f"Total lines: {len(lines)}")

# Find and remove the duplicate/orphaned closing tags
issues_found = []

# Issue 1: Line 1460 has orphaned </> after )}
# Issue 2: Line 1505 has duplicate </>
# Issue 3: Line 1509 has orphaned )}

# Let's find the exact lines
for i, line in enumerate(lines, 1):
    if i == 1460 and '</>' in line:
        print(f"Line {i}: Found orphaned </>: {line.rstrip()}")
        issues_found.append(i)
    elif i == 1505 and '</>' in line:
        print(f"Line {i}: Found duplicate </>: {line.rstrip()}")
        issues_found.append(i)
    elif i == 1509 and (')}' in line or line.strip() == ')}'):
        print(f"Line {i}: Found orphaned closing: {line.rstrip()}")
        issues_found.append(i)

# Fix: Remove lines 1460, 1505, and 1509
# But we need to be more careful - let's use content-based matching

content = ''.join(lines)

# Pattern 1: Remove the orphaned </> after line 1458's )}
# Looking for: ")}\n\n        </>\n\n        {/* Footer Actions */}"
pattern1 = ")}\n\n        </>\n\n        {/* Footer Actions */}"
if pattern1 in content:
    print("\n✅ Found pattern 1 - removing orphaned </>")
    content = content.replace(pattern1, ")}\n\n        {/* Footer Actions */}", 1)

# Pattern 2: Remove the duplicate </> and orphaned )} at the end
# Looking for: "</div>\n\n        \n\n        </>\n\n        )}\n\n        <style>"
pattern2 = "</div>\n\n        \n\n        </>\n\n        )}\n\n        <style>"
if pattern2 in content:
    print("✅ Found pattern 2 - removing duplicate tags")
    content = content.replace(pattern2, "</div>\n\n        <style>", 1)

# Write fixed content
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("\n✅ File saved!")
print("\nNow checking fragment balance...")

# Re-read and check
with open(file_path, 'r', encoding='utf-8') as f:
    new_content = f.read()

fragment_opens = new_content.count('<>')
fragment_closes = new_content.count('</>')
print(f"Fragment opens: {fragment_opens}, closes: {fragment_closes}")

if fragment_opens == fragment_closes:
    print("✅ Fragment count matches!")
else:
    print(f"⚠️  Still mismatched: {fragment_opens} opens vs {fragment_closes} closes")
