'use server';

import nodemailer from 'nodemailer';
import {
  renderOtpEmail,
  renderPasswordResetEmail,
  renderShopInviteTemplate,
  renderShopStatusChangeEmail,
} from '@/components/email-template';
import { env } from '@/lib/env';

const webName = env.NEXT_PUBLIC_WEB_NAME;

function createTransporter() {
  const host = env.EMAIL_SMTP_HOST;
  const port = env.EMAIL_SMTP_PORT ? Number(env.EMAIL_SMTP_PORT) : undefined;
  const user = env.EMAIL_SMTP_USER;
  const pass = env.EMAIL_SMTP_PASS;

  if (!host || !port || !user || !pass) {
    throw new Error('SMTP configuration is missing');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function sendVerificationEmail(to: string, otp: string) {
  if (process.env.NODE_ENV === 'development') {
    console.log('----------------------------------------------');
    console.log(`📧 MOCK EMAIL TO: ${to}`);
    console.log(`🔑 OTP CODE: ${otp}`);
    console.log('----------------------------------------------');
    return;
  }
  const transporter = createTransporter();
  const fromAddress = `${webName} <no-reply@localhost>`;
  const html = renderOtpEmail(otp);

  try {
    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject: `${webName} - Verify your email`,
      html,
    });

    if (info.accepted.includes(to)) {
      console.log(`✅ Email sent successfully. Message ID: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } else {
      console.warn(`⚠️ Email sent but not accepted by: ${to}`);
      return { success: false, error: 'Recipient rejected by SMTP server' };
    }
  } catch (err) {
    console.error('Error sending email via SMTP:', err);
    throw new Error('Error sending email');
  }
}

export async function sendPasswordResetEmail(
  to: string,
  resetLink: string,
  userName?: string
) {
  if (process.env.NODE_ENV === 'development') {
    console.log('----------------------------------------------');
    console.log(`📧 MOCK PASSWORD RESET EMAIL TO: ${to}`);
    console.log(`👤 USER: ${userName || 'Unknown'}`);
    console.log(`🔗 RESET LINK: ${resetLink}`);
    console.log('----------------------------------------------');
    return;
  }

  const transporter = createTransporter();
  const fromAddress = `${webName} <no-reply@localhost>`;
  const html = renderPasswordResetEmail(resetLink, userName);

  try {
    await transporter.sendMail({
      from: fromAddress,
      to,
      subject: `${webName} - Reset Your Password`,
      html,
    });
  } catch (err) {
    console.error('Error sending password reset email:', err);
    throw new Error('Error sending password reset email');
  }
}

export async function sendShopInvitationEmail(
  to: string,
  shopName: string,
  inviterName: string,
  invitationLink: string
) {
  if (process.env.NODE_ENV === 'development') {
    console.log('----------------------------------------------');
    console.log(`📧 MOCK SHOP INVITATION EMAIL TO: ${to}`);
    console.log(`🏪 SHOP: ${shopName}`);
    console.log(`👤 INVITER: ${inviterName}`);
    console.log(`🔗 LINK: ${invitationLink}`);
    console.log('----------------------------------------------');
    return;
  }

  const transporter = createTransporter();
  const fromAddress = `${webName} <no-reply@localhost>`;
  const html = renderShopInviteTemplate(shopName, inviterName, invitationLink);

  try {
    await transporter.sendMail({
      from: fromAddress,
      to,
      subject: `${webName} - You've been invited to join ${shopName}`,
      html,
    });
  } catch (err) {
    console.error('Error sending shop invitation email:', err);
    throw new Error('Error sending shop invitation email');
  }
}

export async function sendShopStatusChangeEmail(
  to: string,
  shopName: string,
  ownerName: string,
  newStatus: string
) {
  if (process.env.NODE_ENV === 'development') {
    console.log('----------------------------------------------');
    console.log(`📧 MOCK SHOP STATUS CHANGE EMAIL TO: ${to}`);
    console.log(`🏪 SHOP: ${shopName}`);
    console.log(`👤 OWNER: ${ownerName}`);
    console.log(`📊 NEW STATUS: ${newStatus}`);
    console.log('----------------------------------------------');
    return;
  }

  const transporter = createTransporter();
  const fromAddress = `${webName} <no-reply@localhost>`;
  const html = renderShopStatusChangeEmail(shopName, ownerName, newStatus);

  try {
    await transporter.sendMail({
      from: fromAddress,
      to,
      subject: `${webName} - Shop Status Updated: ${shopName}`,
      html,
    });
  } catch (err) {
    console.error('Error sending shop status change email:', err);
    throw new Error('Error sending shop status change email');
  }
}
