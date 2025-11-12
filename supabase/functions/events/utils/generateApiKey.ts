/**
 * Generates a secure API key for an event
 * Format: evt_ prefix + UUID (without hyphens)
 * Example: evt_a1b2c3d4e5f67890a1b2c3d4e5f67890
 */
export function generateApiKey(): string {
  // Generate a UUID and remove hyphens for cleaner key
  const uuid = crypto.randomUUID().replace(/-/g, '');
  return `evt_${uuid}`;
}

