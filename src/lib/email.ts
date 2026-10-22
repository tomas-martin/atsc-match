import nodemailer from 'nodemailer';
import QRCode from 'qrcode';
import type { Match } from './types';

interface TicketInfo {
  id: string;
  code: string;
  token: string;
  typeName: string;
}

interface SendTicketEmailParams {
  to: string;
  buyerName: string;
  match: Match;
  tickets: TicketInfo[];
  orderId: string;
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendTicketEmail({
  to,
  buyerName,
  match,
  tickets,
  orderId,
}: SendTicketEmailParams) {
  // Generate QR codes as base64 data URIs
  const ticketHtmlParts = await Promise.all(
    tickets.map(async (ticket) => {
      const qrDataUrl = await QRCode.toDataURL(ticket.token, {
        width: 200,
        margin: 2,
        color: { dark: '#0A1230', light: '#FFFFFF' },
      });

      const matchDate = new Date(match.date);
      const dateStr = matchDate.toLocaleDateString('es-AR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      const timeStr = matchDate.toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      return `
        <div style="background: #ffffff; border-radius: 12px; overflow: hidden; margin-bottom: 20px; border: 1px solid #e5e7eb;">
          <div style="background: linear-gradient(135deg, #1C2E7A 0%, #0A1230 100%); color: white; padding: 16px 20px; text-align: center;">
            <div style="font-size: 11px; letter-spacing: 2px; opacity: 0.8; margin-bottom: 4px;">ANDES TALLERES FUTSAL</div>
            <div style="font-size: 18px; font-weight: 800;">vs ${match.rival}</div>
            <div style="font-size: 13px; margin-top: 4px; opacity: 0.9;">${dateStr} · ${timeStr} hs</div>
            <div style="font-size: 12px; margin-top: 2px; opacity: 0.7;">${match.venue}</div>
          </div>
          <div style="padding: 20px; text-align: center;">
            <div style="font-size: 12px; color: #6B7AA0; letter-spacing: 1px; margin-bottom: 4px;">${ticket.typeName.toUpperCase()}</div>
            <img src="${qrDataUrl}" alt="QR Code" style="width: 180px; height: 180px; margin: 12px auto;" />
            <div style="font-family: monospace; font-size: 16px; font-weight: 800; color: #0A1230; letter-spacing: 2px;">
              ${ticket.code}
            </div>
          </div>
        </div>
      `;
    })
  );

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background: #0A1230; font-family: 'Montserrat', Arial, sans-serif;">
      <div style="max-width: 480px; margin: 0 auto; padding: 20px;">
        <!-- Header -->
        <div style="text-align: center; padding: 20px 0;">
          <div style="font-size: 20px; font-weight: 900; color: white;">ANDES TALLERES</div>
          <div style="font-size: 11px; font-weight: 700; color: #9AA6C8; letter-spacing: 3px;">FUTSAL</div>
        </div>

        <!-- Greeting -->
        <div style="color: white; text-align: center; margin-bottom: 24px;">
          <div style="font-size: 22px; font-weight: 800; margin-bottom: 8px;">¡Tus entradas están listas!</div>
          <div style="font-size: 14px; color: #9AA6C8;">
            Hola ${buyerName}, acá tenés tus entradas. Mostrá el QR en la puerta del estadio.
          </div>
        </div>

        <!-- Tickets -->
        ${ticketHtmlParts.join('')}

        <!-- Info -->
        <div style="color: #9AA6C8; font-size: 12px; text-align: center; margin-top: 16px; line-height: 1.6;">
          <p>Orden: ${orderId}</p>
          <p>También podés ver tus entradas en la web buscando con tu email y DNI.</p>
        </div>

        <!-- Footer -->
        <div style="text-align: center; padding: 20px 0; margin-top: 20px; border-top: 1px solid rgba(28,46,122,0.3);">
          <div style="font-size: 12px; font-weight: 700; color: #D01F2E; letter-spacing: 1px;">
            #SomosTalleres #SomosFamilia
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: process.env.MAIL_FROM || '"Andes Talleres Futsal" <entradas@andestalleres.com>',
    to,
    subject: `🎫 Tus entradas: Talleres vs ${match.rival}`,
    html,
  });
}
