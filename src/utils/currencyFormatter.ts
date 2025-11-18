// Currency formatting utility

/**
 * Converts large numbers to compact format (k for thousands, m for millions)
 * Handles extremely large numbers by converting to string to avoid scientific notation
 * @param amount - The number to format
 * @returns Formatted string with k or m suffix
 */
const formatCompactNumber = (amount: number): string => {
  // Convert to string to handle very large numbers without scientific notation
  let amountStr = amount.toString();
  
  // Check if it's already in scientific notation
  if (amountStr.includes('e') || amountStr.includes('E')) {
    // Parse scientific notation: base * 10^exponent
    const parts = amountStr.toLowerCase().split('e');
    const base = parseFloat(parts[0]);
    let exponent = parseInt(parts[1] || '0', 10);
    
    // Handle negative base
    const isNegative = base < 0;
    const absBase = Math.abs(base);
    
    // Calculate number of digits before decimal in base
    const baseDigits = absBase >= 1 
      ? Math.floor(Math.log10(absBase)) + 1 
      : absBase === 0 ? 0 : Math.ceil(Math.log10(1 / absBase));
    
    // Total number of digits in the number
    const totalDigits = baseDigits + exponent;
    
    if (totalDigits >= 7) {
      // Millions or more
      // Calculate millions: base * 10^(exponent - 6)
      const millionsExponent = exponent - 6;
      let millionsValue: number;
      
      if (millionsExponent >= 0) {
        millionsValue = absBase * Math.pow(10, millionsExponent);
      } else {
        millionsValue = absBase / Math.pow(10, -millionsExponent);
      }
      
      // Round to 1 decimal place, avoiding scientific notation
      let formatted: string;
      
      // Check if the value would result in scientific notation
      if (millionsValue >= 1e21 || millionsValue <= -1e21) {
        // For impossibly large numbers (data errors), cap at reasonable maximum
        formatted = isNegative ? '-999999' : '999999';
      } else {
        // Use toLocaleString to avoid scientific notation, then format
        const rounded = Math.round(millionsValue * 10) / 10;
        formatted = rounded.toLocaleString('en-US', {
          maximumFractionDigits: 1,
          minimumFractionDigits: 0,
          useGrouping: false
        });
        
        // Fallback if still in scientific notation
        if (formatted.includes('e') || formatted.includes('E')) {
          formatted = rounded.toFixed(1).replace(/\.?0+$/, '');
        }
      }
      
      return `${formatted}m`;
    } else if (totalDigits >= 4) {
      // Thousands
      const thousandsExponent = exponent - 3;
      let thousandsValue: number;
      
      if (thousandsExponent >= 0) {
        thousandsValue = absBase * Math.pow(10, thousandsExponent);
      } else {
        thousandsValue = absBase / Math.pow(10, -thousandsExponent);
      }
      
      let formatted: string;
      
      // Check if the value would result in scientific notation
      if (thousandsValue >= 1e21 || thousandsValue <= -1e21) {
        // For impossibly large numbers (data errors), cap at reasonable maximum
        formatted = isNegative ? '-999999' : '999999';
      } else {
        const rounded = Math.round(thousandsValue * 10) / 10;
        formatted = rounded.toLocaleString('en-US', {
          maximumFractionDigits: 1,
          minimumFractionDigits: 0,
          useGrouping: false
        });
        
        // Fallback if still in scientific notation
        if (formatted.includes('e') || formatted.includes('E')) {
          formatted = rounded.toFixed(1).replace(/\.?0+$/, '');
        }
      }
      
      return `${formatted}k`;
    }
    
    // For numbers less than 1000, try to format normally
    const normalValue = base * Math.pow(10, exponent);
    return Math.round(normalValue).toString();
  }
  
  // Handle normal numbers (not in scientific notation)
  const absAmount = Math.abs(amount);
  
  // For millions (>= 1,000,000)
  if (absAmount >= 1000000) {
    const millions = amount / 1000000;
    const millionsStr = millions.toString();
    
    // Check if result would be in scientific notation
    if (millionsStr.includes('e') || millionsStr.includes('E')) {
      // For very large numbers, use integer rounding
      return `${Math.round(millions)}m`;
    }
    
    // Show 1 decimal place for millions if it's not a whole number
    const rounded = Math.round(millions * 10) / 10;
    const formatted = rounded % 1 === 0 ? rounded.toString() : rounded.toFixed(1);
    
    // Double-check for scientific notation
    if (formatted.includes('e') || formatted.includes('E')) {
      return `${Math.round(millions)}m`;
    }
    
    return `${formatted}m`;
  }
  
  // For thousands (>= 1,000)
  if (absAmount >= 1000) {
    const thousands = amount / 1000;
    const thousandsStr = thousands.toString();
    
    // Check if result would be in scientific notation
    if (thousandsStr.includes('e') || thousandsStr.includes('E')) {
      return `${Math.round(thousands)}k`;
    }
    
    // Show 1 decimal place for thousands if it's not a whole number
    const rounded = Math.round(thousands * 10) / 10;
    const formatted = rounded % 1 === 0 ? rounded.toString() : rounded.toFixed(1);
    
    // Double-check for scientific notation
    if (formatted.includes('e') || formatted.includes('E')) {
      return `${Math.round(thousands)}k`;
    }
    
    return `${formatted}k`;
  }
  
  // For numbers less than 1000, return as is
  return Math.round(amount).toString();
};

export const formatCurrency = (amount: number, currency: string): string => {
  const currencyUpper = currency.toUpperCase();
  
  // Get currency symbol
  const currencySymbols: Record<string, string> = {
    'USD': '$',
    'JPY': '¥',
    'EUR': '€',
    'GBP': '£',
    'CNY': '¥',
    'KRW': '₩',
    'THB': '฿',
    'SGD': 'S$',
    'AUD': 'A$',
    'CAD': 'C$',
    'CHF': 'CHF',
    'HKD': 'HK$',
    'NZD': 'NZ$',
    'SEK': 'kr',
    'NOK': 'kr',
    'DKK': 'kr',
    'PLN': 'zł',
    'CZK': 'Kč',
    'HUF': 'Ft',
    'RUB': '₽',
    'TRY': '₺',
    'ZAR': 'R',
    'BRL': 'R$',
    'MXN': '$',
    'ARS': '$',
    'COP': '$'
  };
  
  const symbol = currencySymbols[currencyUpper] || currencyUpper;
  
  // Use compact format for large numbers (>= 1000)
  const absAmount = Math.abs(amount);
  if (absAmount >= 1000) {
    const compactNumber = formatCompactNumber(amount);
    // For JPY, symbol comes before amount with no space
    if (currencyUpper === 'JPY' || currencyUpper === 'CNY') {
      return `${symbol}${compactNumber}`;
    } else if (currencyUpper === 'KRW') {
      return `${symbol}${compactNumber}`;
    } else {
      return `${symbol}${compactNumber}`;
    }
  }
  
  // Format number with locale-specific formatting for smaller numbers
  // JPY and KRW don't use decimals
  const decimals = (currencyUpper === 'JPY' || currencyUpper === 'KRW') ? 0 : 2;
  
  const formattedAmount = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(amount);
  
  // Return formatted currency
  // For JPY, symbol comes before amount with no space
  // For most others, symbol comes before with space
  if (currencyUpper === 'JPY' || currencyUpper === 'CNY') {
    return `${symbol}${formattedAmount}`;
  } else if (currencyUpper === 'KRW') {
    return `${symbol}${formattedAmount}`;
  } else {
    return `${symbol}${formattedAmount}`;
  }
};

export const getCurrencySymbol = (currency: string): string => {
  const currencyUpper = currency.toUpperCase();
  const currencySymbols: Record<string, string> = {
    'USD': '$',
    'JPY': '¥',
    'EUR': '€',
    'GBP': '£',
    'CNY': '¥',
    'KRW': '₩',
    'THB': '฿',
    'SGD': 'S$',
    'AUD': 'A$',
    'CAD': 'C$',
    'CHF': 'CHF',
    'HKD': 'HK$',
    'NZD': 'NZ$',
    'SEK': 'kr',
    'NOK': 'kr',
    'DKK': 'kr',
    'PLN': 'zł',
    'CZK': 'Kč',
    'HUF': 'Ft',
    'RUB': '₽',
    'TRY': '₺',
    'ZAR': 'R',
    'BRL': 'R$',
    'MXN': '$',
    'ARS': '$',
    'COP': '$'
  };
  
  return currencySymbols[currencyUpper] || currencyUpper;
};

