import { auth } from '@/lib/auth';

export async function verifyAuth() {
  try {
    // Get the session from the request
    const session = await auth();
    
    if (!session?.user) {
      return { authorized: false, user: null };
    }

    return { authorized: true, user: session.user };
  } catch (error) {
    console.error('Auth verification error:', error);
    return { authorized: false, user: null };
  }
}

export function createUnauthorizedResponse() {
  return Response.json(
    { 
      error: 'Unauthorized', 
      message: 'You must be authenticated to access this resource' 
    },
    { status: 401 }
  );
} 