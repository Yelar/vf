import { NextRequest, NextResponse } from 'next/server';
import { getUserByVerificationToken, verifyUserEmail } from '@/lib/auth-db-mongo';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    // Find user by verification token
    const user = await getUserByVerificationToken(token);
    
    if (!user) {
      return NextResponse.json(
        { 
          error: 'Invalid or expired verification token',
          message: 'The verification link is invalid or has expired. Please register again or request a new verification email.'
        },
        { status: 400 }
      );
    }

    // Verify the user's email
    const success = await verifyUserEmail(user.id);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to verify email' },
        { status: 500 }
      );
    }

    console.log(`✅ Email verified successfully for user: ${user.email}`);
    
    // Return success response
    return NextResponse.json({
      message: 'Email verified successfully',
      verified: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      }
    });

  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'An unexpected error occurred during email verification'
      },
      { status: 500 }
    );
  }
} 