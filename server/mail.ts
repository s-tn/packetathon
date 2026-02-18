import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config({ path: './sendgrid.env' });

if (!process.env.SENDGRID_API_KEY) {
  throw new Error('SENDGRID_API_KEY is not set');
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const SEND_EMAIL = 'support@bthackathon.com';
export { sgMail };
