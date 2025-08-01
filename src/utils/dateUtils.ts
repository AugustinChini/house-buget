/**
 * Convertit une date (Date ou string) en objet Date
 * @param date - La date à convertir (Date ou string ISO)
 * @returns Un objet Date
 */
export function ensureDate(date: Date | string): Date {
  if (date instanceof Date) {
    return date;
  }
  return new Date(date);
}

/**
 * Convertit une date en format ISO string pour les inputs de type date
 * @param date - La date à convertir (Date ou string ISO)
 * @returns Une chaîne au format YYYY-MM-DD
 */
export function toDateInputValue(date: Date | string): string {
  const dateObj = ensureDate(date);
  return dateObj.toISOString().split("T")[0];
}

/**
 * Formate une date pour l'affichage en français
 * @param date - La date à formater (Date ou string ISO)
 * @returns Une chaîne formatée (ex: "15/12/2023")
 */
export function formatDate(date: Date | string): string {
  const dateObj = ensureDate(date);
  return dateObj.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Formate une date avec l'heure pour l'affichage en français
 * @param date - La date à formater (Date ou string ISO)
 * @returns Une chaîne formatée (ex: "15/12/2023 à 14:30")
 */
export function formatDateTime(date: Date | string): string {
  const dateObj = ensureDate(date);
  return dateObj.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
} 