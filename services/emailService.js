const nodemailer = require('nodemailer');

// Initialize email transporter
// For testing, use Gmail or configure your email service
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'your-app-password'
  }
});

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
  }
};

module.exports = emailService;
