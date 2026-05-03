#!/usr/bin/env python3
import re

# Read the file
with open('src/app/order/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Define the old pattern to find
old_pattern = r"""        if \(pm\?\.mpesa\?\.enabled\) \{
          console\.log\('📊 Order Page - M-Pesa enabled'\);
          // Build M-Pesa details from all three payment types
          const mpesaDetails: string\[\] = \[\];
          
          if \(pm\.mpesa\.buyGoods\?\.tillNumber\) \{
            console\.log\('📊 Order Page - Buy Goods has tillNumber:', pm\.mpesa\.buyGoods\.tillNumber\);
            mpesaDetails\.push\(`Buy Goods: \$\{pm\.mpesa\.buyGoods\.tillNumber\}\$\{pm\.mpesa\.buyGoods\.businessName \? ` \(\$\{pm\.mpesa\.buyGoods\.businessName\}\)` : ''\}`\);
          \}
          
          if \(pm\.mpesa\.paybill\?\.paybillNumber\) \{
            console\.log\(' Order Page - Paybill has paybillNumber:', pm\.mpesa\.paybill\.paybillNumber\);
            mpesaDetails\.push\(`Paybill: \$\{pm\.mpesa\.paybill\.paybillNumber\}\$\{pm\.mpesa\.paybill\.accountNumber \? ` \(Acc: \$\{pm\.mpesa\.paybill\.accountNumber\}\)` : ''\}\$\{pm\.mpesa\.paybill\.businessName \? ` \(\$\{pm\.mpesa\.paybill\.businessName\}\)` : ''\}`\);
          \}
          
          if \(pm\.mpesa\.personal\?\.phoneNumber\) \{
            console\.log\('📊 Order Page - Personal has phoneNumber:', pm\.mpesa\.personal\.phoneNumber\);
            mpesaDetails\.push\(`Send Money: \$\{pm\.mpesa\.personal\.phoneNumber\}\$\{pm\.mpesa\.personal\.accountName \? ` \(\$\{pm\.mpesa\.personal\.accountName\}\)` : ''\}`\);
          \}
          
          if \(mpesaDetails\.length > 0\) \{
            paymentMethodsArray\.push\(\{
              id: "mpesa",
              name: "M-Pesa",
              details: mpesaDetails\.join\('\\n'\),
            \}\);
          \}
        \}"""

# Define the replacement
new_code = """        if (pm?.mpesa?.enabled) {
          console.log('📊 Order Page - M-Pesa enabled');
          
          // Each M-Pesa subtype becomes its own payment card
          if (pm.mpesa.buyGoods?.tillNumber) {
            console.log('📊 Order Page - Buy Goods has tillNumber:', pm.mpesa.buyGoods.tillNumber);
            paymentMethodsArray.push({
              id: "mpesa-buygoods",
              name: "M-Pesa Buy Goods",
              details: `Till Number: ${pm.mpesa.buyGoods.tillNumber}${pm.mpesa.buyGoods.businessName ? ` (${pm.mpesa.buyGoods.businessName})` : ''}`,
              icon: "fa-store",
              color: "#00A650"
            });
          }
          
          if (pm.mpesa.paybill?.paybillNumber) {
            console.log('📊 Order Page - Paybill has paybillNumber:', pm.mpesa.paybill.paybillNumber);
            paymentMethodsArray.push({
              id: "mpesa-paybill",
              name: "M-Pesa Paybill",
              details: `Paybill: ${pm.mpesa.paybill.paybillNumber}${pm.mpesa.paybill.accountNumber ? ` (Acc: ${pm.mpesa.paybill.accountNumber})` : ''}${pm.mpesa.paybill.businessName ? ` (${pm.mpesa.paybill.businessName})` : ''}`,
              icon: "fa-building",
              color: "#059669"
            });
          }
          
          if (pm.mpesa.personal?.phoneNumber) {
            console.log(' Order Page - Personal has phoneNumber:', pm.mpesa.personal.phoneNumber);
            paymentMethodsArray.push({
              id: "mpesa-personal",
              name: "M-Pesa Send Money",
              details: `Phone: ${pm.mpesa.personal.phoneNumber}${pm.mpesa.personal.accountName ? ` (${pm.mpesa.personal.accountName})` : ''}`,
              icon: "fa-user",
              color: "#10b981"
            });
          }
        }"""

# Replace
content = re.sub(old_pattern, new_code, content)

# Write back
with open('src/app/order/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("✓ Successfully replaced M-Pesa payment methods section")
