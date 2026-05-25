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

    const { watchId, limit = 100 } = Object.fromEntries(new URL(req.url).searchParams);

    let telemetryQuery: any = {
      where: { userId: decoded.userId },
      orderBy: { timestamp: 'desc' },
      take: parseInt(limit as string),
    };

    if (watchId) {
      telemetryQuery.where.watchId = watchId;
    }

    const logs = await prisma.telemetryLog.findMany(telemetryQuery);

    return NextResponse.json({
      success: true,
      logs,
    });
  } catch (error) {
    console.error('[GET TELEMETRY ERROR]', error);
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

    const { watchId, batteryLevel, location, signalStrength } = await req.json();

    if (!watchId || batteryLevel === undefined) {
      return NextResponse.json(
        { success: false, message: 'Watch ID and battery level are required' },
        { status: 400 }
      );
    }

    const telemetry = await prisma.telemetryLog.create({
      data: {
        userId: decoded.userId,
        watchId,
        batteryLevel,
        location: location || null,
        signalStrength: signalStrength || null,
      },
    });

    // Update watch status based on battery level
    await prisma.watch.update({
      where: { id: watchId },
      data: {
        batteryLevel,
        status: 
          batteryLevel < 10 ? 'critical' :
          batteryLevel < 30 ? 'low_battery' :
          'online',
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Telemetry logged successfully',
        telemetry,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[LOG TELEMETRY ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Something went wrong' },
      { status: 500 }
    );
  }
}
