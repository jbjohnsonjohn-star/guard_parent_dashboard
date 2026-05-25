import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/authMiddleware';

export async function POST(req: NextRequest) {
  const authUser = getAuthUser(req);
  if (!authUser) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { deviceId, deviceName } = await req.json();
    if (!deviceId) {
      return NextResponse.json(
        { success: false, message: 'deviceId is required' },
        { status: 400 }
      );
    }

    const existing = await prisma.device.findUnique({ where: { id: deviceId } });
    if (existing && existing.parentId && existing.parentId !== authUser.userId) {
      return NextResponse.json(
        { success: false, message: 'Device already paired to another account' },
        { status: 400 }
      );
    }

    await prisma.device.upsert({
      where: { id: deviceId },
      update: {
        deviceName: deviceName || existing?.deviceName || 'Unnamed Device',
        parentId: authUser.userId,
        isPaired: true,
      },
      create: {
        id: deviceId,
        pairingCode: `SYNC-${deviceId}`.slice(0, 32),
        deviceName: deviceName || 'Unnamed Device',
        parentId: authUser.userId,
        isPaired: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, message: 'Something went wrong' },
      { status: 500 }
    );
  }
}
