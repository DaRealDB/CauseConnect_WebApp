import nodemailer from 'nodemailer'
import { Resend } from 'resend'

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

const resendApiKey = process.env.RESEND_API_KEY
const resend = resendApiKey ? new Resend(resendApiKey) : null
const emailFrom = process.env.EMAIL_FROM || process.env.SMTP_USER || ''

export interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export const emailService = {
  /**
   * Send email using nodemailer
   */
  async sendEmail(options: SendEmailOptions): Promise<void> {
    try {
      // Prefer Resend HTTP API when configured
      if (resend && emailFrom) {
        console.log('[Email] Using Resend to send email...')
        await resend.emails.send({
          from: emailFrom,
          to: [options.to],
          subject: options.subject,
          html: options.html,
          text: options.text || options.html.replace(/<[^>]*>/g, ''),
        })
        console.log(`[Email] ✅ Resend email sent successfully to ${options.to}`)
        return
      }

      // Verify transporter configuration
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        const errorMsg = '[Email] SMTP credentials not configured. Email sending disabled. Set SMTP_USER and SMTP_PASS in .env to enable email sending.'
        console.error(errorMsg)
        console.error(`[Email] SMTP_USER: ${process.env.SMTP_USER ? 'SET' : 'NOT SET'}`)
        console.error(`[Email] SMTP_PASS: ${process.env.SMTP_PASS ? 'SET' : 'NOT SET'}`)
        throw new Error(errorMsg)
      }

      // Verify transporter connection
      console.log('[Email] Verifying SMTP connection...')
      await transporter.verify()
      console.log('[Email] SMTP connection verified successfully')
      
      const mailOptions = {
        from: `"CauseConnect" <${process.env.SMTP_USER}>`,
        to: options.to,
        subject: options.subject,
        text: options.text || options.html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
        html: options.html,
      }

      console.log(`[Email] Sending email to ${options.to}...`)
      const info = await transporter.sendMail(mailOptions)
      console.log(`[Email] ✅ Email sent successfully to ${options.to}: ${info.messageId}`)
    } catch (error: any) {
      console.error('[Email] ❌ Failed to send email:', error)
      console.error('[Email] Error details:', {
        message: error.message,
        code: error.code,
        response: error.response,
        command: error.command,
        responseCode: error.responseCode,
      })
      throw new Error(`Failed to send email: ${error.message}`)
    }
  },

  /**
   * Send verification code email
   */
  async sendVerificationCode(email: string, code: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email - CauseConnect</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">CauseConnect</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Verify Your Email Address</h2>
            <p>Thank you for signing up for CauseConnect! Please use the verification code below to complete your registration:</p>
            <div style="background: #fff; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
              <div style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: monospace;">
                ${code}
              </div>
            </div>
            <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes.</p>
            <p style="color: #666; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>&copy; ${new Date().getFullYear()} CauseConnect. All rights reserved.</p>
          </div>
        </body>
      </html>
    `

    await this.sendEmail({
      to: email,
      subject: 'Verify Your Email - CauseConnect',
      html,
    })
  },

  /**
   * Send password reset code email
   */
  async sendPasswordResetCode(email: string, code: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password - CauseConnect</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">CauseConnect</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Reset Your Password</h2>
            <p>You requested to reset your password. Please use the verification code below to continue:</p>
            <div style="background: #fff; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
              <div style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: monospace;">
                ${code}
              </div>
            </div>
            <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes.</p>
            <p style="color: #666; font-size: 14px;">If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>&copy; ${new Date().getFullYear()} CauseConnect. All rights reserved.</p>
          </div>
        </body>
      </html>
    `

    await this.sendEmail({
      to: email,
      subject: 'Reset Your Password - CauseConnect',
      html,
    })
  },
}




