/**
 * Converts a string to professional Title Case.
 * Example: "STAINLESS STEEL" -> "Stainless Steel"
 * Example: "FULLCAPS" -> "Fullcaps"
 * @param {string} str - The string to convert
 * @returns {string} The title cased string
 */
export const toTitleCase = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .filter(word => word.length > 0)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
