export function validateLuhn(cardNumber) {
  const cleanNum = cardNumber.replace(/\s+/g, '');
  if (!/^\d{13,19}$/.test(cleanNum)) return false;

  let sum = 0;
  let shouldDouble = false;
  for (let i = cleanNum.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanNum.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

export function validateExpiryDate(expiry) {
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry.trim())) return false;
  const [monthStr, yearStr] = expiry.trim().split('/');
  const expMonth = parseInt(monthStr, 10);
  const expYear = 2000 + parseInt(yearStr, 10);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  if (expYear < currentYear) return false;
  if (expYear === currentYear && expMonth < currentMonth) return false;
  return true;
}

export function validateCVV(cvv) {
  return /^\d{3,4}$/.test(cvv.trim());
}
