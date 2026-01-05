import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT || '1025'),
  secure: process.env.SMTP_SECURE === 'true'
})

export const emailService = {
  async sendOTP(email: string, otpCode: string): Promise<void> {
    console.log(`Sending OTP ${otpCode} to ${email}`)

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Код верификации - The Last of Guss</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333; text-align: center;">Код верификации</h2>
          <p>Здравствуйте!</p>
          <p>Ваш код для входа в игру <strong>The Last of Guss</strong>:</p>

          <div style="text-align: center; margin: 30px 0;">
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2563eb; background: #f8fafc; padding: 20px; border-radius: 8px; display: inline-block;">
              ${otpCode}
            </div>
          </div>

          <p style="color: #666; font-size: 14px;">
            Код действителен в течение <strong>1 минуты</strong>.
          </p>
          <p style="color: #666; font-size: 14px;">
            Если вы не запрашивали этот код, просто игнорируйте это письмо.
          </p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            The Last of Guss - Игра на выживание
          </p>
        </body>
      </html>
    `

    try {
      const result = await transporter.sendMail({
        from: process.env.FROM_EMAIL || 'noreply@guss-game.com',
        to: email,
        subject: 'Код верификации - The Last of Guss',
        html
      })
      console.log(`Email sent successfully:`, result)
    } catch (error) {
      console.error(`Failed to send email to ${email}:`, error)
      throw error
    }
  }
}
