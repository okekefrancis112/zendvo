/**
 * Honeypot validation for bot detection.
 *
 * The frontend includes a hidden field (`website`) that is invisible to human
 * users but gets auto-filled by bots. If the field has any value, the request
 * is flagged as a bot.
 */
export function validateHoneypot(body: Record<string, unknown>): boolean {
  const honeypotValue = body.website;
  return (
    honeypotValue === undefined ||
    honeypotValue === null ||
    honeypotValue === ""
  );
}
