#!/usr/bin/env python3

# Read the file
with open('src/app/(app)/settings/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the console.log lines from JSX
content = content.replace("""      {/* Shipping Tab */}
      {activeTab === "shipping" && (
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6">
          {console.log('🚚 Shipping Tab Rendering - shippingMethods:', shippingMethods)}
          {console.log('🎨 Shipping Tab Rendering - shippingMethods.length:', shippingMethods.length)}
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-green-50 to-teal-50 border-l-4 border-green-500">""",
"""      {/* Shipping Tab */}
      {activeTab === "shipping" && (
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6">
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-green-50 to-teal-50 border-l-4 border-green-500">""")

# Write back
with open('src/app/(app)/settings/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("✓ Removed console.log from JSX")
