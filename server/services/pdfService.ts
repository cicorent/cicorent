import fs from 'fs';
import path from 'path';
import { Booking, Vehicle } from '@shared/schema';

export async function generateContract(booking: Booking & { vehicle: Vehicle }): Promise<Buffer> {
  // Read the HTML template
  const templatePath = path.join(process.cwd(), 'server/contracts/template.html');
  let template = fs.readFileSync(templatePath, 'utf8');

  // Replace placeholders with actual data
  const replacements = {
    '{{bookingCode}}': booking.bookingCode,
    '{{customerName}}': `${booking.customerFirstName} ${booking.customerLastName}`,
    '{{customerBirthDate}}': booking.customerBirthDate,
    '{{customerPhone}}': booking.customerPhone,
    '{{customerEmail}}': booking.customerEmail,
    '{{driverLicenseNo}}': booking.driverLicenseNo,
    '{{vehicleName}}': booking.vehicle.name,
    '{{startDate}}': booking.startDate,
    '{{endDate}}': booking.endDate,
    '{{daysCount}}': booking.daysCount.toString(),
    '{{totalPrice}}': `€${booking.totalPrice}`,
    '{{coverage}}': booking.coverage === 'BASE' ? 'Base' : 'Parziale',
    '{{kmPlan}}': booking.kmPlan === 'KM_100' ? '100 km/giorno' : booking.kmPlan === 'KM_200' ? '200 km/giorno' : 'Illimitati',
    '{{additionalDriver}}': (booking.addFirstName && booking.addLastName) ? 
      `${booking.addFirstName} ${booking.addLastName} - Patente: ${booking.addDriverLicenseNo}` : 'Nessuno',
    '{{homeDelivery}}': booking.homeDelivery ? 'Sì' : 'No',
    '{{homePickup}}': booking.homePickup ? 'Sì' : 'No',
    '{{notes}}': booking.notes || 'Nessuna',
    '{{currentDate}}': new Date().toLocaleDateString('it-IT'),
  };

  for (const [placeholder, value] of Object.entries(replacements)) {
    template = template.replace(new RegExp(placeholder, 'g'), value);
  }

  // For now, return the HTML as buffer (in a real implementation, use Puppeteer)
  // TODO: Implement Puppeteer PDF generation
  return Buffer.from(template, 'utf8');
}
