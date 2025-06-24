import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, updateVerificationToken } from '@/lib/auth-db-mongo';
import { sendVerificationEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await getUserByEmail(email);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is already verified
    if (user.email_verified) {
      return NextResponse.json(
        { 
          error: 'Email already verified',
          message: 'This email address is already verified. You can sign in directly.'
        },
        { status: 400 }
      );
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    // Update user with new verification token
    const success = await updateVerificationToken(user.id, verificationToken);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to generate verification token' },
        { status: 500 }
      );
    }

    // Create verification URL
    const baseUrl = process.env.NEXTAUTH_URL || `${request.nextUrl.protocol}//${request.nextUrl.host}`;
    const verificationUrl = `${baseUrl}/auth/verify-email?token=${verificationToken}`;

    // Send verification email
    await sendVerificationEmail({
      to: user.email,
      name: user.name,
      verificationUrl,
    });

    console.log(`📧 Verification email resent to: ${user.email}`);
    
    return NextResponse.json({
      message: 'Verification email sent successfully',
      email: user.email,
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to send verification email'
      },
      { status: 500 }
    );
  }
} 