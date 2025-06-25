import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import BackgroundVideo from '@/lib/models/BackgroundVideo';
import { UTApi } from 'uploadthing/server';

// GET /api/background-videos/[id] - Get a specific background video
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const videoId = resolvedParams.id;

    await connectToDatabase();

    const video = await BackgroundVideo.findById(videoId).lean();
    if (!video) {
      return NextResponse.json({ error: 'Background video not found' }, { status: 404 });
    }

    return NextResponse.json({ video });
  } catch (error) {
    console.error('Error fetching background video:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/background-videos/[id] - Update a background video
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const videoId = resolvedParams.id;

    const { 
      name, 
      description, 
      category, 
      tags, 
      is_active 
    } = await req.json();

    await connectToDatabase();

    const video = await BackgroundVideo.findById(videoId);
    if (!video) {
      return NextResponse.json({ error: 'Background video not found' }, { status: 404 });
    }

    // Check if user owns the video
    if (video.created_by.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update fields
    if (name !== undefined) video.name = name;
    if (description !== undefined) video.description = description;
    if (category !== undefined) video.category = category;
    if (tags !== undefined) video.tags = tags;
    if (is_active !== undefined) video.is_active = is_active;

    await video.save();

    return NextResponse.json({ video });
  } catch (error) {
    console.error('Error updating background video:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/background-videos/[id] - Delete a background video
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const videoId = resolvedParams.id;

    await connectToDatabase();

    const video = await BackgroundVideo.findById(videoId);
    if (!video) {
      return NextResponse.json({ error: 'Background video not found' }, { status: 404 });
    }

    // Check if user owns the video
    if (video.created_by.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete from UploadThing first
    try {
      const utapi = new UTApi();
      await utapi.deleteFiles([video.uploadthing_key]);
      console.log(`🗑️ Deleted file from UploadThing: ${video.uploadthing_key}`);
    } catch (uploadThingError) {
      console.error('Error deleting from UploadThing:', uploadThingError);
      // Continue with database deletion even if UploadThing deletion fails
    }

    // Delete from database
    await BackgroundVideo.findByIdAndDelete(videoId);

    return NextResponse.json({ message: 'Background video deleted successfully' });
  } catch (error) {
    console.error('Error deleting background video:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 