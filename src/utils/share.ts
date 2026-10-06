/**
 * Generates the public share URL for friends to join.
 * When in Google AI Studio Dev environment (ais-dev-), converts to
 * the public Shared App URL (ais-pre-) so friends can access without 403 error.
 */
export function getShareUrl(roomId?: string): string {
  let origin = window.location.origin;

  // Convert AI Studio development URL to public shared URL
  if (origin.includes('ais-dev-')) {
    origin = origin.replace('ais-dev-', 'ais-pre-');
  }

  return origin + (roomId ? `?room=${roomId}` : '');
}
