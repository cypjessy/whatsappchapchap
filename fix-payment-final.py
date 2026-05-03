#!/usr/bin/env python3

# Read the file
with open('src/app/order/page.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find and replace the M-Pesa section
new_lines = []
skip_until_bank = False
i = 0

while i < len(lines):
    line = lines[i]
    
    # Skip old M-Pesa logic until we hit bank section
    if 'if (pm?.mpesa?.enabled)' in line and i < 200:
        # Write the new M-Pesa logic
        new_lines.append('        if (pm?.mpesa?.enabled) {\n')
        new_lines.append('          console.log(\'📊 Order Page - M-Pesa enabled\');\n')
        new_lines.append('          \n')
        new_lines.append('          // Each M-Pesa subtype becomes its own payment card\n')
        new_lines.append('          if (pm.mpesa.buyGoods?.tillNumber) {\n')
        new_lines.append('            console.log(\'📊 Order Page - Buy Goods has tillNumber:\', pm.mpesa.buyGoods.tillNumber);\n')
        new_lines.append('            paymentMethodsArray.push({\n')
        new_lines.append('              id: "mpesa-buygoods",\n')
        new_lines.append('              name: "M-Pesa Buy Goods",\n')
        new_lines.append('              details: `Till Number: ${pm.mpesa.buyGoods.tillNumber}${pm.mpesa.buyGoods.businessName ? ` (${pm.mpesa.buyGoods.businessName})` : \'\'}`,\n')
        new_lines.append('              icon: "fa-store",\n')
        new_lines.append('              color: "#00A650"\n')
        new_lines.append('            });\n')
        new_lines.append('          }\n')
        new_lines.append('          \n')
        new_lines.append('          if (pm.mpesa.paybill?.paybillNumber) {\n')
        new_lines.append('            console.log(\'📊 Order Page - Paybill has paybillNumber:\', pm.mpesa.paybill.paybillNumber);\n')
        new_lines.append('            paymentMethodsArray.push({\n')
        new_lines.append('              id: "mpesa-paybill",\n')
        new_lines.append('              name: "M-Pesa Paybill",\n')
        new_lines.append('              details: `Paybill: ${pm.mpesa.paybill.paybillNumber}${pm.mpesa.paybill.accountNumber ? ` (Acc: ${pm.mpesa.paybill.accountNumber})` : \'\'}}${pm.mpesa.paybill.businessName ? ` (${pm.mpesa.paybill.businessName})` : \'\'}`,\n')
        new_lines.append('              icon: "fa-building",\n')
        new_lines.append('              color: "#059669"\n')
        new_lines.append('            });\n')
        new_lines.append('          }\n')
        new_lines.append('          \n')
        new_lines.append('          if (pm.mpesa.personal?.phoneNumber) {\n')
        new_lines.append('            console.log(\' Order Page - Personal has phoneNumber:\', pm.mpesa.personal.phoneNumber);\n')
        new_lines.append('            paymentMethodsArray.push({\n')
        new_lines.append('              id: "mpesa-personal",\n')
        new_lines.append('              name: "M-Pesa Send Money",\n')
        new_lines.append('              details: `Phone: ${pm.mpesa.personal.phoneNumber}${pm.mpesa.personal.accountName ? ` (${pm.mpesa.personal.accountName})` : \'\'}`,\n')
        new_lines.append('              icon: "fa-user",\n')
        new_lines.append('              color: "#10b981"\n')
        new_lines.append('            });\n')
        new_lines.append('          }\n')
        new_lines.append('        }\n')
        new_lines.append('        \n')
        
        # Skip old lines until we find the bank section
        while i < len(lines) and 'if (pm?.bank?.enabled)' not in lines[i]:
            i += 1
        # Don't increment i here, we want to process the bank line next
        continue
    
    # Add icon and color to card payment
    if 'id: "card",' in line and i > 218 and i < 225:
        new_lines.append(line)
        i += 1
        new_lines.append(lines[i])  # name line
        i += 1
        new_lines.append(lines[i])  # details line
        # Add icon and color
        new_lines.append('            icon: "fa-credit-card",\n')
        new_lines.append('            color: "#3b82f6"\n')
        i += 1
        continue
    
    # Add icon and color to COD payment
    if 'id: "cod",' in line and i > 227 and i < 235:
        new_lines.append(line)
        i += 1
        new_lines.append(lines[i])  # name line
        i += 1
        new_lines.append(lines[i])  # details line
        # Add icon and color
        new_lines.append('            icon: "fa-money-bill-wave",\n')
        new_lines.append('            color: "#10b981"\n')
        i += 1
        continue
    
    new_lines.append(line)
    i += 1

# Write back
with open('src/app/order/page.tsx', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("✓ Successfully restructured payment methods with separate cards")
