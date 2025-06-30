import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getVideosByUserId } from '@/lib/auth-db-mongo';

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const videos = await getVideosByUserId(session.user.id);
    
    // Calculate statistics
    const totalVideos = videos.length;
    const sharedVideos = videos.filter(v => v.is_shared === true).length;
    const totalDuration = videos.reduce((acc, video) => acc + (video.duration || 0), 0);
    
    // Get recent videos (last 10, sorted by creation date)
    const recentVideos = videos
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)
      .map(video => ({
        id: video.id,
        title: video.title,
        created_at: video.created_at,
        is_shared: video.is_shared,
        duration: video.duration,
        url: video.s3_url
      }));

    return NextResponse.json({
      totalVideos,
      totalViews: 0, // Placeholder for future view tracking
      sharedVideos,
      totalDuration,
      recentVideos
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 