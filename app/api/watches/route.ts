import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    const userWatches = await prisma.userWatch.findMany({
      where: { userId: decoded.userId },
      include: {
        watch: {
          include: {
            alerts: {
              where: { userId: decoded.userId },
              orderBy: { createdAt: 'desc' },
              take: 5,
            },
          },
        },
      },
    });

    const watches = userWatches.map(uw => ({
      ...uw.watch,
      recentAlerts: uw.watch.alerts,
    }));

    return NextResponse.json({
      success: true,
      watches,
    });
  } catch (error) {
    console.error('[GET WATCHES ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Something went wrong' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    const { watchId, name } = await req.json();

    if (!watchId || !name) {
      return NextResponse.json(
        { success: false, message: 'Watch ID and name are required' },
        { status: 400 }
      );
    }

    // Check if watch already exists
    let watch = await prisma.watch.findUnique({
      where: { watchId },
    });

    if (!watch) {
      watch = await prisma.watch.create({
        data: {
          watchId,
          name,
          status: 'offline',
        },
      });
    }

    // Link watch to user
    const userWatch = await prisma.userWatch.upsert({
      where: {
        userId_watchId: {
          userId: decoded.userId,
          watchId: watch.id,
        },
      },
      update: {},
      create: {
        userId: decoded.userId,
        watchId: watch.id,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Watch added successfully',
        watch,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[ADD WATCH ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Something went wrong' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    const { watchId } = await req.json();

    if (!watchId) {
      return NextResponse.json(
        { success: false, message: 'Watch ID is required' },
        { status: 400 }
      );
    }

    // Delete the user-watch relationship
    await prisma.userWatch.deleteMany({
      where: {
        userId: decoded.userId,
        watchId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Watch removed successfully',
    });
  } catch (error) {
    console.error('[DELETE WATCH ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Something went wrong' },
      { status: 500 }
    );
  }
}
