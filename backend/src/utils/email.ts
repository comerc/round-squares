// Simple email utility for demo purposes
// In production, replace with real email service like SendGrid, Mailgun, etc.

/**
 * Send OTP code to email (demo implementation)
 * Logs to console instead of sending real email
 */
export async function sendOtpEmail(email: string, otpCode: string): Promise<void> {
  // Demo implementation - log to console
  console.log(`📧 OTP for ${email}: ${otpCode}`)

  // In production, integrate with email service:
  // const transporter = nodemailer.createTransporter({...})
  // await transporter.sendMail({
  //   from: 'noreply@example.com',
  //   to: email,
  //   subject: 'Your OTP Code',
  //   text: `Your OTP code is: ${otpCode}. It expires in 5 minutes.`,
  // })

  return Promise.resolve()
}