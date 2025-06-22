import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailVerificationData {
  to: string;
  name: string;
  verificationUrl: string;
}

export async function sendVerificationEmail({ to, name, verificationUrl }: EmailVerificationData) {
  try {
    console.log(`📧 Sending verification email to: ${to}`);
    
    const { data, error } = await resend.emails.send({
      from: 'VFS Studio <onboarding@hintcode.top>',
      to,
      subject: '✨ Verify your VFS Studio account',
      html: getVerificationEmailHTML(name, verificationUrl),
      text: getVerificationEmailText(name, verificationUrl),
    });

    if (error) {
      console.error('❌ Resend email error:', error);
      throw new Error(`Failed to send verification email: ${error.message}`);
    }

    console.log('✅ Verification email sent successfully:', data?.id);
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('❌ Email sending error:', error);
    throw error;
  }
}

function getVerificationEmailHTML(name: string, verificationUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email - VFS Studio</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f8fafc; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 700;">🎬 VFS Studio</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">AI-Powered Video Creation Platform</p>
        </div>
        
        <div style="padding: 40px 30px;">
          <h2 style="color: #1a202c; font-size: 24px; margin-bottom: 20px;">Hi ${name}! 👋</h2>
          
          <p style="color: #4a5568; font-size: 16px; margin-bottom: 20px;">Welcome to VFS Studio! We're excited to have you join our community of creators who are building amazing AI-powered videos.</p>
          
          <p style="color: #4a5568; font-size: 16px; margin-bottom: 20px;">To get started and access all the powerful features, please verify your email address by clicking the button below:</p>
          
          <div style="text-align: center;">
            <a href="${verificationUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 20px 0;">
              ✨ Verify My Email Address
            </a>
          </div>
          
          <div style="background-color: #f7fafc; padding: 20px; border-radius: 8px; margin: 30px 0;">
            <h3 style="margin-top: 0; color: #1a202c;">What you'll get access to:</h3>
            <p style="margin: 5px 0; color: #4a5568;">🤖 AI-powered content generation with multiple templates</p>
            <p style="margin: 5px 0; color: #4a5568;">🎤 Premium voice synthesis with 6 different AI voices</p>
            <p style="margin: 5px 0; color: #4a5568;">🎬 Professional video rendering at 1080x1920 (60 FPS)</p>
            <p style="margin: 5px 0; color: #4a5568;">🖼️ Smart image overlays from Unsplash</p>
            <p style="margin: 5px 0; color: #4a5568;">💾 Personal video library with cloud storage</p>
          </div>
          
          <p style="color: #4a5568; font-size: 16px;"><strong>This verification link will expire in 24 hours</strong> for security reasons.</p>
          
          <div style="background-color: #f7fafc; padding: 20px; border-radius: 8px; margin-top: 30px; text-align: center; border: 1px solid #e2e8f0;">
            <p style="margin: 0; font-size: 14px; color: #718096;">If the button doesn't work, copy and paste this link into your browser:</p>
            <a href="${verificationUrl}" style="color: #667eea; text-decoration: none; word-break: break-all;">${verificationUrl}</a>
          </div>
        </div>
        
        <div style="background-color: #1a202c; color: #a0aec0; padding: 30px; text-align: center; font-size: 14px;">
          <p>If you didn't create an account with VFS Studio, you can safely ignore this email.</p>
          <p style="margin-top: 20px;"><strong>VFS Studio</strong><br>Making AI video creation accessible to everyone</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function getVerificationEmailText(name: string, verificationUrl: string): string {
  return `
Hi ${name}!

Welcome to VFS Studio! Please verify your email address by visiting this link:

${verificationUrl}

This link will expire in 24 hours.

What you'll get access to:
• AI-powered content generation
• Premium voice synthesis  
• Professional video rendering
• Smart image overlays
• Personal video library

If you didn't create an account with VFS Studio, you can safely ignore this email.

Best regards,
The VFS Studio Team
  `;
}

export async function sendWelcomeEmail({ to, name }: { to: string; name: string }) {
  try {
    console.log(`🎉 Sending welcome email to: ${to}`);
    
    const { data, error } = await resend.emails.send({
      from: 'VFS Studio <hello@hintcode.top>', // Update this to your verified domain
      to,
      subject: '🎉 Welcome to VFS Studio - Start Creating!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to VFS Studio!</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f8fafc;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .get-started-button {
              display: inline-block;
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: white;
              text-decoration: none;
              padding: 16px 32px;
              border-radius: 8px;
              font-weight: 600;
              font-size: 16px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to VFS Studio!</h1>
              <p>Your AI video creation journey starts now</p>
            </div>
            
            <div style="padding: 40px 30px;">
              <h2>Hi ${name}! 🚀</h2>
              
              <p>Congratulations! Your email has been verified and your VFS Studio account is now active.</p>
              
              <p>You're now ready to create stunning AI-powered videos with just a few clicks. Our platform makes it easy to generate viral content for YouTube Shorts, Instagram Reels, and TikTok.</p>
              
              <div style="text-align: center;">
                <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard" class="get-started-button">
                  🎬 Start Creating Videos
                </a>
              </div>
              
              <h3>Quick Start Guide:</h3>
              <ol>
                <li><strong>Choose a Template:</strong> Pick from Educational, Drama, Comedy, and more</li>
                <li><strong>Add Your Topic:</strong> Type or speak your content idea</li>
                <li><strong>Generate Content:</strong> Let AI create engaging text for you</li>
                <li><strong>Choose Voice:</strong> Select from 6 premium AI voices</li>
                <li><strong>Style Your Video:</strong> Customize fonts, colors, and effects</li>
                <li><strong>Add Visuals:</strong> Upload backgrounds or use our smart image features</li>
                <li><strong>Generate & Share:</strong> Create your video and download instantly</li>
              </ol>
              
              <p>Happy creating!</p>
              <p>The VFS Studio Team 💜</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Hi ${name}!

Welcome to VFS Studio! Your email has been verified and your account is now active.

Start creating AI-powered videos at: ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard

Quick Start:
1. Choose a Template
2. Add Your Topic  
3. Generate Content
4. Choose Voice
5. Style Your Video
6. Add Visuals
7. Generate & Share

Happy creating!
The VFS Studio Team
      `,
    });

    if (error) {
      console.error('❌ Welcome email error:', error);
      throw new Error(`Failed to send welcome email: ${error.message}`);
    }

    console.log('✅ Welcome email sent successfully:', data?.id);
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('❌ Welcome email error:', error);
    throw error;
  }
}

export interface VideoCompletionData {
  to: string;
  name: string;
  videoTitle: string;
  videoDuration: number;
  libraryUrl: string;
  videoUrl?: string;
}

export async function sendVideoCompletionEmail({ to, name, videoTitle, videoDuration, libraryUrl, videoUrl }: VideoCompletionData) {
  try {
    console.log(`🎬 Sending video completion email to: ${to} for video: ${videoTitle}`);
    
    const { data, error } = await resend.emails.send({
      from: 'VFS Studio <notifications@hintcode.top>',
      to,
      subject: `🎉 Your video "${videoTitle}" is ready!`,
      html: getVideoCompletionEmailHTML(name, videoTitle, videoDuration, libraryUrl, videoUrl),
      text: getVideoCompletionEmailText(name, videoTitle, videoDuration, libraryUrl, videoUrl),
    });

    if (error) {
      console.error('❌ Video completion email error:', error);
      throw new Error(`Failed to send video completion email: ${error.message}`);
    }

    console.log('✅ Video completion email sent successfully:', data?.id);
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('❌ Video completion email error:', error);
    throw error;
  }
}

function getVideoCompletionEmailHTML(name: string, videoTitle: string, videoDuration: number, libraryUrl: string, videoUrl?: string): string {
  const minutes = Math.floor(videoDuration / 60);
  const seconds = Math.floor(videoDuration % 60);
  const durationText = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Video is Ready - VFS Studio</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f8fafc; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 700;">🎬 VFS Studio</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">Your Video is Ready!</p>
        </div>
        
        <div style="padding: 40px 30px;">
          <h2 style="color: #1a202c; font-size: 24px; margin-bottom: 20px;">Hi ${name}! 🎉</h2>
          
          <p style="color: #4a5568; font-size: 16px; margin-bottom: 20px;">Great news! Your AI-generated video is now ready for download and sharing.</p>
          
          <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <h3 style="margin-top: 0; color: #065f46; font-size: 18px;">📹 "${videoTitle}"</h3>
            <p style="margin: 5px 0; color: #047857;"><strong>Duration:</strong> ${durationText}</p>
            <p style="margin: 5px 0; color: #047857;"><strong>Status:</strong> ✅ Ready for download</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${libraryUrl}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 10px;">
              📚 View in Library
            </a>
            ${videoUrl ? `<br><a href="${videoUrl}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 10px;">📥 Download Video</a>` : ''}
          </div>
          
          <div style="background-color: #f7fafc; padding: 20px; border-radius: 8px; margin: 30px 0;">
            <h3 style="margin-top: 0; color: #1a202c;">What's next?</h3>
            <p style="margin: 5px 0; color: #4a5568;">📱 Share on social media platforms</p>
            <p style="margin: 5px 0; color: #4a5568;">📹 Create more videos with different styles</p>
            <p style="margin: 5px 0; color: #4a5568;">🎨 Experiment with new templates and voices</p>
            <p style="margin: 5px 0; color: #4a5568;">📊 Track your video library growth</p>
          </div>
          
          <p style="color: #4a5568; font-size: 16px;">Ready to create your next masterpiece?</p>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 500; font-size: 14px;">
              🚀 Create Another Video
            </a>
          </div>
        </div>
        
        <div style="background-color: #1a202c; color: #a0aec0; padding: 30px; text-align: center; font-size: 14px;">
          <p>This video was generated using VFS Studio's AI-powered video creation platform.</p>
          <p style="margin-top: 20px;"><strong>VFS Studio</strong><br>Making AI video creation accessible to everyone</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function getVideoCompletionEmailText(name: string, videoTitle: string, videoDuration: number, libraryUrl: string, videoUrl?: string): string {
  const minutes = Math.floor(videoDuration / 60);
  const seconds = Math.floor(videoDuration % 60);
  const durationText = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

  return `
Hi ${name}!

Great news! Your AI-generated video is now ready.

Video Details:
• Title: "${videoTitle}"
• Duration: ${durationText}
• Status: Ready for download

View your video: ${libraryUrl}
${videoUrl ? `Download directly: ${videoUrl}` : ''}

What's next?
• Share on social media platforms
• Create more videos with different styles
• Experiment with new templates and voices

Create another video: ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard

Best regards,
The VFS Studio Team
  `;
} 