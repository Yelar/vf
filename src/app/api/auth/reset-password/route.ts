import { NextRequest, NextResponse } from 'next/server';
import { resetPassword, getUserByPasswordResetToken } from '@/lib/auth-db-mongo';

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    // Validate input
    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Verify token and get user
    const user = await getUserByPasswordResetToken(token);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Reset password
    const success = await resetPassword(token, password);
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to reset password. Token may be expired.' },
        { status: 400 }
      );
    }

    console.log(`✅ Password reset successful for user: ${user.email}`);

    return NextResponse.json({
      message: 'Password has been reset successfully. You can now sign in with your new password.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 