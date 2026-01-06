import nodemailer from 'nodemailer'

export class EmailService {
  private transporter: nodemailer.Transporter

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '1025', 10),
      secure: false, // true for 465, false for other ports
      auth: process.env.SMTP_USER
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
      tls: {
        rejectUnauthorized: false,
      },
    })
  }

  async sendOtp(email: string, otp: string) {
    const from = process.env.SMTP_FROM || 'noreply@roundsquares.com'
    await this.transporter.sendMail({
      from,
      to: email,
      subject: 'Your Login Verification Code',
      text: `Your verification code is: ${otp}. It expires in 1 minute.`,
      html: `<p>Your verification code is: <strong>${otp}</strong></p><p>It expires in 1 minute.</p>`,
    })
  }
}

export const emailService = new EmailService()
