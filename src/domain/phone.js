/**
 * @param {string} phone
 * @returns {string}
 */
export function digitsOnly(phone) {
  return phone.replace(/\D/g, '');
}

/**
 * @param {string} phone
 * @returns {boolean}
 */
export function isValidWhatsAppNumber(phone) {
  const digits = digitsOnly(phone);
  return digits.length >= 10 && digits.length <= 15;
}

/**
 * @param {string} phone
 * @returns {string|null}
 */
export function buildWhatsAppLink(phone) {
  const digits = digitsOnly(phone);
  if (!isValidWhatsAppNumber(phone)) return null;
  return `https://wa.me/${digits}`;
}

/**
 * @param {string} phone
 * @returns {string}
 */
export function maskPhone(phone) {
  const digits = digitsOnly(phone);

  if (digits.length < 10) {
    const last4 = digits.slice(-4);
    return `••• ${last4}`;
  }

  const countryCode = digits.slice(0, 2);
  const nextTwo = digits.slice(2, 4);
  const lastFour = digits.slice(-4);

  return `+${countryCode} ${nextTwo} ••• ${lastFour}`;
}

/**
 * @param {string} phone
 * @returns {string}
 */
export function formatPhone(phone) {
  const digits = digitsOnly(phone);

  if (digits.length === 12) {
    const c1 = digits.slice(0, 2);
    const c2 = digits.slice(2, 4);
    const c3 = digits.slice(4, 8);
    const c4 = digits.slice(8, 12);
    return `+${c1} ${c2} ${c3} ${c4}`;
  }

  return `+${digits}`;
}