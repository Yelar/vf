import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import BackgroundVideo from '@/lib/models/BackgroundVideo';

// GET /api/background-videos - Get all background videos
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

    const videos = await BackgroundVideo.find(query)
      .sort({ created_at: -1 })
      .lean();

    return NextResponse.json({ videos });
  } catch (error) {
    console.error('Error fetching background videos:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/background-videos - Create a new background video
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

    const video = new BackgroundVideo({
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

    await video.save();

    return NextResponse.json({ video });
  } catch (error) {
    console.error('Error creating background video:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 