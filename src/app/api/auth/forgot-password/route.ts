import { NextRequest, NextResponse } from 'next/server';
import { createPasswordResetToken, getUserByEmail } from '@/lib/auth-db-mongo';
import { sendPasswordResetEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    // Validate input
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await getUserByEmail(email);
    if (!user) {
      // For security, we don't reveal if the email exists or not
      return NextResponse.json({
        message: 'If an account with this email exists, you will receive a password reset link.',
      });
    }

    // Generate password reset token
    const resetToken = await createPasswordResetToken(email);
    if (!resetToken) {
      return NextResponse.json(
        { error: 'Failed to generate reset token' },
        { status: 500 }
      );
    }

    // Create reset URL
    const baseUrl = process.env.NEXTAUTH_URL || `${req.nextUrl.protocol}//${req.nextUrl.host}`;
    const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}`;

    try {
      // Send password reset email
      await sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        resetUrl,
      });

      console.log(`✅ Password reset email sent to: ${user.email}`);

      return NextResponse.json({
        message: 'If an account with this email exists, you will receive a password reset link.',
      });
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      
      return NextResponse.json(
        { error: 'Failed to send password reset email. Please try again.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 