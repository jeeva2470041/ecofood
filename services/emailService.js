const nodemailer = require('nodemailer');

// Check if email credentials are configured
const isEmailConfigured = process.env.EMAIL_USER &&
  process.env.EMAIL_PASSWORD &&
  process.env.EMAIL_USER !== 'your-email@gmail.com';

// Initialize email transporter
// For Gmail, you need to use an App Password (not your regular password)
// Enable 2FA on your Google account, then create an App Password at:
// https://myaccount.google.com/apppasswords
let transporter = null;

if (isEmailConfigured) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
  console.log('📧 Email service configured with:', process.env.EMAIL_USER);
} else {
  console.log('⚠️ Email credentials not configured. OTPs will be logged to console (dev mode).');
  console.log('   To enable email, set EMAIL_USER and EMAIL_PASSWORD in backend/.env');
  console.log('   For Gmail, use an App Password: https://myaccount.google.com/apppasswords');
}

const emailService = {
  /**
   * Send food posted notification email to nearby NGOs
   */
  sendFoodPostedEmail: async (ngo, food, donor) => {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER || 'noreply@ecofood.com',
        to: ngo.email,
        subject: `🍱 New Food Available: ${food.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0;">
              <h2 style="margin: 0;">🍱 New Food Donation Available</h2>
            </div>
            <div style="padding: 20px; background: #f9f9f9;">
              <p><strong>Food Name:</strong> ${food.name}</p>
              <p><strong>Type:</strong> ${food.type}</p>
              <p><strong>Quantity:</strong> ${food.quantity}</p>
              ${food.servings ? `<p><strong>Servings:</strong> ${food.servings}</p>` : ''}
              <p><strong>Expires At:</strong> ${new Date(food.expiryAt).toLocaleString()}</p>
              ${food.description ? `<p><strong>Description:</strong> ${food.description}</p>` : ''}
              
              <div style="background: white; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0;">
                <p style="margin: 0; color: #666;"><strong>Donor:</strong> ${donor.name}</p>
                <p style="margin: 5px 0 0 0; color: #999; font-size: 0.9em;">Posted just now</p>
              </div>
              
              <p style="color: #666; margin-top: 20px;">
                This food is available for pickup at the donor's location. 
                Log in to the EcoFood app to claim this donation.
              </p>
            </div>
            <div style="padding: 15px; background: #f0f0f0; border-radius: 0 0 10px 10px; text-align: center; font-size: 0.85em; color: #999;">
              <p>© EcoFood - Reducing Food Waste, Feeding Communities</p>
            </div>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log(`📧 Food posted notification sent to ${ngo.email}`);
    } catch (err) {
      console.error('❌ Error sending food posted email:', err.message);
      // Don't throw - email failure shouldn't break the flow
    }
  },

  /**
   * Send food claimed notification email to donor with OTP
   */
  sendFoodClaimedEmail: async (donor, food, ngo, otp) => {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER || 'noreply@ecofood.com',
        to: donor.email,
        subject: `✅ Your Food Has Been Claimed!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #4caf50 0%, #45a049 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0;">
              <h2 style="margin: 0;">✅ Food Claimed!</h2>
            </div>
            <div style="padding: 20px; background: #f9f9f9;">
              <p>Great news! Your donation has been claimed by an NGO.</p>
              
              <div style="background: white; padding: 15px; border-left: 4px solid #4caf50; margin: 20px 0;">
                <p style="margin: 0;"><strong>🏢 Organization:</strong> ${ngo.organizationName}</p>
                <p style="margin: 5px 0 0 0;"><strong>👤 Contact:</strong> ${ngo.name}</p>
                <p style="margin: 5px 0 0 0;"><strong>📞 Phone:</strong> ${ngo.phone || 'Not provided'}</p>
              </div>

              <p style="margin-top: 20px;">When the NGO arrives for pickup, they will provide you with a verification code:</p>
              
              <div style="background: #667eea; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                <p style="margin: 0; font-size: 0.85em; color: rgba(255,255,255,0.9);">Your Verification Code</p>
                <p style="margin: 10px 0 0 0; font-size: 2em; font-weight: bold; letter-spacing: 5px;">
                  <span style="font-family: 'Courier New', monospace;">${otp}</span>
                </p>
              </div>

              <p style="color: #666;">
                <strong>Next Steps:</strong>
              </p>
              <ol style="color: #666;">
                <li>The NGO will visit your location with the verification code above</li>
                <li>They will tell you the code verbally</li>
                <li>Enter this code in your EcoFood dashboard to confirm the pickup</li>
                <li>Your donation will be marked as completed</li>
              </ol>

              <p style="color: #999; font-size: 0.9em; margin-top: 20px;">
                This code is valid for 2 hours from now.
              </p>
            </div>
            <div style="padding: 15px; background: #f0f0f0; border-radius: 0 0 10px 10px; text-align: center; font-size: 0.85em; color: #999;">
              <p>© EcoFood - Reducing Food Waste, Feeding Communities</p>
            </div>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log(`📧 Food claimed notification sent to ${donor.email}`);
    } catch (err) {
      console.error('❌ Error sending food claimed email:', err.message);
    }
  },

  /**
   * Send pickup completed notification email to NGO
   */
  sendPickupCompletedEmail: async (ngo, food, donor) => {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER || 'noreply@ecofood.com',
        to: ngo.email,
        subject: `✅ Pickup Confirmed - ${food.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #4caf50 0%, #45a049 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0;">
              <h2 style="margin: 0;">✅ Pickup Completed!</h2>
            </div>
            <div style="padding: 20px; background: #f9f9f9;">
              <p>The donor has verified the pickup of your claimed food.</p>
              
              <div style="background: white; padding: 15px; border-left: 4px solid #4caf50; margin: 20px 0;">
                <p style="margin: 0;"><strong>🍱 Food:</strong> ${food.name}</p>
                <p style="margin: 5px 0 0 0;"><strong>📦 Quantity:</strong> ${food.quantity}</p>
                <p style="margin: 5px 0 0 0;"><strong>👤 From:</strong> ${donor.name}</p>
              </div>

              <p style="color: #666; margin-top: 20px;">
                Thank you for reducing food waste and helping communities in need! 
                Your impact matters.
              </p>
            </div>
            <div style="padding: 15px; background: #f0f0f0; border-radius: 0 0 10px 10px; text-align: center; font-size: 0.85em; color: #999;">
              <p>© EcoFood - Reducing Food Waste, Feeding Communities</p>
            </div>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log(`📧 Pickup completed notification sent to ${ngo.email}`);
    } catch (err) {
      console.error('❌ Error sending pickup completed email:', err.message);
    }
  },

  /**
   * Send password reset OTP email
   */
  sendPasswordResetOTP: async (user, otp) => {
    // Development mode - log OTP to console
    if (!transporter) {
      console.log('');
      console.log('╔═══════════════════════════════════════════════════════════╗');
      console.log('║              🔐 PASSWORD RESET OTP (DEV MODE)              ║');
      console.log('╠═══════════════════════════════════════════════════════════╣');
      console.log(`║  Email: ${user.email.padEnd(49)}║`);
      console.log(`║  OTP: ${otp.padEnd(51)}║`);
      console.log(`║  Valid for: 10 minutes                                    ║`);
      console.log('╚═══════════════════════════════════════════════════════════╝');
      console.log('');
      return true; // Return success for dev mode
    }

    try {
      const mailOptions = {
        from: process.env.EMAIL_USER || 'noreply@ecofood.com',
        to: user.email,
        subject: `🔐 Password Reset OTP - EcoFood`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #13ec37 0%, #0a8030 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
              <h2 style="margin: 0;">🔐 Password Reset Request</h2>
            </div>
            <div style="padding: 30px; background: #f9f9f9;">
              <p style="color: #333;">Hello <strong>${user.name}</strong>,</p>
              <p style="color: #666;">We received a request to reset your password for your EcoFood account.</p>
              
              <div style="background: linear-gradient(135deg, #13ec37 0%, #0a8030 100%); color: white; padding: 25px; border-radius: 12px; text-align: center; margin: 25px 0;">
                <p style="margin: 0; font-size: 0.9em; color: rgba(255,255,255,0.9);">Your One-Time Password (OTP)</p>
                <p style="margin: 15px 0 0 0; font-size: 2.5em; font-weight: bold; letter-spacing: 8px;">
                  <span style="font-family: 'Courier New', monospace;">${otp}</span>
                </p>
              </div>

              <div style="background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; color: #856404; font-size: 0.9em;">
                  ⏰ <strong>This OTP is valid for 10 minutes only.</strong>
                </p>
              </div>

              <p style="color: #666; margin-top: 20px;">
                If you didn't request a password reset, please ignore this email or contact support if you have concerns.
              </p>
              
              <p style="color: #999; font-size: 0.85em; margin-top: 25px;">
                For security reasons, never share this OTP with anyone. EcoFood staff will never ask for your OTP.
              </p>
            </div>
            <div style="padding: 15px; background: #f0f0f0; border-radius: 0 0 10px 10px; text-align: center; font-size: 0.85em; color: #999;">
              <p>© EcoFood - Reducing Food Waste, Feeding Communities</p>
            </div>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log(`📧 Password reset OTP sent to ${user.email}`);
      return true;
    } catch (err) {
      console.error('❌ Error sending password reset OTP email:', err.message);
      // Fallback: Log OTP to console even if email fails
      console.log('');
      console.log('╔═══════════════════════════════════════════════════════════╗');
      console.log('║         🔐 PASSWORD RESET OTP (EMAIL FAILED)              ║');
      console.log('╠═══════════════════════════════════════════════════════════╣');
      console.log(`║  Email: ${user.email.padEnd(49)}║`);
      console.log(`║  OTP: ${otp.padEnd(51)}║`);
      console.log(`║  Valid for: 10 minutes                                    ║`);
      console.log('╚═══════════════════════════════════════════════════════════╝');
      console.log('');
      return true; // Still return true so user can use OTP from console
    }
  }
};

module.exports = emailService;
