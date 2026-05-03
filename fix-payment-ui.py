#!/usr/bin/env python3

# Read the file
with open('src/app/order/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the type annotation
content = content.replace(
    'businessSettings.paymentMethods.map((option: { id: string; name: string; details: string }) =>',
    'businessSettings.paymentMethods.map((option: { id: string; name: string; details: string; icon: string; color: string }) =>'
)

# Replace the icon background color logic
content = content.replace(
    'background: option.id === "mpesa" ? "#00A650" : option.id === "bank" ? "#64748b" : option.id === "card" ? "#3b82f6" : "#10b981"',
    'background: option.color || "#64748b"'
)

# Replace the icon class logic
content = content.replace(
    'className={`fas ${option.id === "mpesa" ? "fa-mobile-alt" : option.id === "bank" ? "fa-university" : option.id === "card" ? "fa-credit-card" : "fa-money-bill-wave"}`}',
    'className={`fas ${option.icon || "fa-money-bill-wave"}`}'
)

# Write back
with open('src/app/order/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("✓ Successfully updated UI rendering to use icon and color from data")
