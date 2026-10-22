import crypto from 'crypto';

const SECRET = process.env.TICKET_SIGNING_SECRET!;

/**
 * Generate a unique ticket code like ATSC-XXXX-XXXX
 */
export function generateTicketCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars
  let code = 'ATSC';
  for (let i = 0; i < 2; i++) {
    code += '-';
    for (let j = 0; j < 4; j++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  return code;
}

/**
 * Sign a ticket code with HMAC-SHA256
 * Returns a token that can be embedded in a QR code
 */
export function signTicket(ticketId: string, code: string): string {
  const payload = `${ticketId}:${code}`;
  const hmac = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
  // Token format: base64(ticketId:code:hmac)
  const token = Buffer.from(`${payload}:${hmac}`).toString('base64url');
  return token;
}

/**
 * Verify a ticket token
 * Returns the ticket ID and code if valid, null otherwise
 */
export function verifyTicketToken(token: string): { ticketId: string; code: string } | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf-8');
    const parts = decoded.split(':');
    if (parts.length !== 3) return null;

    const [ticketId, code, providedHmac] = parts;
    const payload = `${ticketId}:${code}`;
    const expectedHmac = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');

    // Constant-time comparison to prevent timing attacks
    if (!crypto.timingSafeEqual(Buffer.from(providedHmac), Buffer.from(expectedHmac))) {
      return null;
    }

    return { ticketId, code };
  } catch {
    return null;
  }
}
