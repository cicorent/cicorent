import nodemailer from 'nodemailer';
import { Booking, Vehicle } from '@shared/schema';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtps.aruba.it',
  port: Number(process.env.SMTP_PORT) || 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER || 'info@cicorent.it',
    pass: process.env.SMTP_PASS || 'pswcicorent',
  },
});

const FROM = `"CICO Rent" <${process.env.SMTP_USER || 'info@cicorent.it'}>`;

export async function sendBookingConfirmationToCustomer(booking: Booking & { vehicle: Vehicle }) {
  const subject = `CICO Rent - Prenotazione ${booking.bookingCode} ricevuta`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Conferma Prenotazione</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { background: #1e40af; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .booking-details { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .footer { background: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>CICO Rent</h1>
            <p>Prenotazione Confermata</p>
        </div>
        
        <div class="content">
            <h2>Gentile ${booking.customerFirstName} ${booking.customerLastName},</h2>
            
            <p>La sua prenotazione è stata ricevuta con successo. Riceverà una chiamata da una nostra operatrice in giornata per la conferma definitiva.</p>
            
            <div class="booking-details">
                <h3>Dettagli Prenotazione</h3>
                <p><strong>Codice:</strong> ${booking.bookingCode}</p>
                <p><strong>Veicolo:</strong> ${booking.vehicle.name}</p>
                <p><strong>Periodo:</strong> dal ${booking.startDate} al ${booking.endDate}</p>
                <p><strong>Giorni:</strong> ${booking.daysCount}</p>
                <p><strong>Totale:</strong> €${booking.totalPrice}</p>
                <p><strong>Ritiro:</strong> Via Cristoforo Colombo 1778, 00127 Roma</p>
            </div>
            
            <p><strong>Assistenza:</strong> ${process.env.PHONE_NUMBER}</p>
            
            <p>Grazie per aver scelto CICO Rent!</p>
        </div>
        
        <div class="footer">
            <p>CICO Rent - FGS GAS SAS<br>
            Via Cristoforo Colombo 1778, 00127 Roma<br>
            P.IVA/CF 05855791009</p>
        </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: FROM,
    to: booking.customerEmail,
    subject,
    html,
  });
}

export async function sendBookingNotificationToAdmin(booking: Booking & { vehicle: Vehicle }) {
  const subject = `Nuova prenotazione ${booking.bookingCode}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Nuova Prenotazione</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { background: #1e40af; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .booking-details { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>CICO Rent - Admin</h1>
            <p>Nuova Prenotazione</p>
        </div>
        
        <div class="content">
            <h2>Nuova prenotazione ricevuta</h2>
            
            <div class="booking-details">
                <h3>Dettagli</h3>
                <p><strong>Codice:</strong> ${booking.bookingCode}</p>
                <p><strong>Cliente:</strong> ${booking.customerFirstName} ${booking.customerLastName}</p>
                <p><strong>Email:</strong> ${booking.customerEmail}</p>
                <p><strong>Telefono:</strong> ${booking.customerPhone}</p>
                <p><strong>Veicolo:</strong> ${booking.vehicle.name}</p>
                <p><strong>Periodo:</strong> dal ${booking.startDate} al ${booking.endDate}</p>
                <p><strong>Giorni:</strong> ${booking.daysCount}</p>
                <p><strong>Totale:</strong> €${booking.totalPrice}</p>
                ${booking.notes ? `<p><strong>Note:</strong> ${booking.notes}</p>` : ''}
            </div>
            
            <p>Accedi all'area admin per gestire la prenotazione.</p>
        </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: FROM,
    to: process.env.OP_EMAIL,
    subject,
    html,
  });
}
