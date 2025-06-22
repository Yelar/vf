import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUserByEmail } from '@/lib/auth-db';
import { sendVerificationEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();

    // Validate input
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create user with verification token
    const user = await createUser(email, password, name, verificationToken);
    if (!user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Create verification URL
    const baseUrl = process.env.NEXTAUTH_URL || `${req.nextUrl.protocol}//${req.nextUrl.host}`;
    const verificationUrl = `${baseUrl}/auth/verify-email?token=${verificationToken}`;

    try {
      // Send verification email
      await sendVerificationEmail({
        to: user.email,
        name: user.name,
        verificationUrl,
      });

      console.log(`✅ User created and verification email sent to: ${user.email}`);

      // Return success (don't include password in response)
      return NextResponse.json({
        message: 'User created successfully. Please check your email to verify your account.',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          emailVerified: false,
        },
        emailSent: true,
      });
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      
      // User was created but email failed - still return success but mention email issue
      return NextResponse.json({
        message: 'User created successfully, but failed to send verification email. You can request a new verification email.',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          emailVerified: false,
        },
        emailSent: false,
        emailError: 'Failed to send verification email',
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}