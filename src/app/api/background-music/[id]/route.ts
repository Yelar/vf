import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import BackgroundMusic from '@/lib/models/BackgroundMusic';
import { UTApi } from 'uploadthing/server';

// GET /api/background-music/[id] - Get a specific background music
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
    const musicId = resolvedParams.id;

    await connectToDatabase();

    const music = await BackgroundMusic.findById(musicId).lean();
    if (!music) {
      return NextResponse.json({ error: 'Background music not found' }, { status: 404 });
    }

    return NextResponse.json({ music });
  } catch (error) {
    console.error('Error fetching background music:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/background-music/[id] - Update a background music
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
    const musicId = resolvedParams.id;

    const { 
      name, 
      description, 
      category, 
      tags, 
      is_active 
    } = await req.json();

    await connectToDatabase();

    const music = await BackgroundMusic.findById(musicId);
    if (!music) {
      return NextResponse.json({ error: 'Background music not found' }, { status: 404 });
    }

    // Check if user owns the music
    if (music.created_by.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update fields
    if (name !== undefined) music.name = name;
    if (description !== undefined) music.description = description;
    if (category !== undefined) music.category = category;
    if (tags !== undefined) music.tags = tags;
    if (is_active !== undefined) music.is_active = is_active;

    await music.save();

    return NextResponse.json({ music });
  } catch (error) {
    console.error('Error updating background music:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/background-music/[id] - Delete a background music
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
    const musicId = resolvedParams.id;

    await connectToDatabase();

    const music = await BackgroundMusic.findById(musicId);
    if (!music) {
      return NextResponse.json({ error: 'Background music not found' }, { status: 404 });
    }

    // Check if user owns the music
    if (music.created_by.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete from UploadThing first
    try {
      const utapi = new UTApi();
      await utapi.deleteFiles([music.uploadthing_key]);
      console.log(`🗑️ Deleted file from UploadThing: ${music.uploadthing_key}`);
    } catch (uploadThingError) {
      console.error('Error deleting from UploadThing:', uploadThingError);
      // Continue with database deletion even if UploadThing deletion fails
    }

    // Delete from database
    await BackgroundMusic.findByIdAndDelete(musicId);

    return NextResponse.json({ message: 'Background music deleted successfully' });
  } catch (error) {
    console.error('Error deleting background music:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 