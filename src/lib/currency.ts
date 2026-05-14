export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-KE', { 
    style: 'currency', 
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatCurrencyWithCents = (amount: number): string => {
  return new Intl.NumberFormat('en-KE', { 
    style: 'currency', 
    currency: 'KES',
  }).format(amount);
};

export const CURRENCY_SYMBOL = "KES ";
export const CURRENCY_CODE = "KES";
