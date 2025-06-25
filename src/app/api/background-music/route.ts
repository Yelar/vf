import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import BackgroundMusic from '@/lib/models/BackgroundMusic';

// GET /api/background-music - Get all background music
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const active = searchParams.get('active');

    // Build query
    const query: Record<string, unknown> = {};
    if (category && category !== 'all') {
      query.category = category;
    }
    if (active !== null) {
      query.is_active = active === 'true';
    }

    const music = await BackgroundMusic.find(query)
      .sort({ created_at: -1 })
      .lean();

    return NextResponse.json({ music });
  } catch (error) {
    console.error('Error fetching background music:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/background-music - Create a new background music
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      name, 
      description, 
      uploadthingUrl, 
      uploadthingKey, 
      fileSize, 
      duration, 
      category = 'general',
      tags = []
    } = await req.json();

    if (!name || !uploadthingUrl || !uploadthingKey || !fileSize) {
      return NextResponse.json({ 
        error: 'Missing required fields: name, uploadthingUrl, uploadthingKey, fileSize' 
      }, { status: 400 });
    }

    await connectToDatabase();

    const music = new BackgroundMusic({
      name,
      description,
      uploadthing_url: uploadthingUrl,
      uploadthing_key: uploadthingKey,
      file_size: fileSize,
      duration,
      category,
      tags,
      created_by: session.user.id,
    });

    await music.save();

    return NextResponse.json({ music });
  } catch (error) {
    console.error('Error creating background music:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 