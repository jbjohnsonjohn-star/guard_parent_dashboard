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
    const { deviceId, pairingCode, deviceName } = await req.json();
    if (!deviceId || !pairingCode || !deviceName) {
      return NextResponse.json(
        { success: false, message: 'deviceId, pairingCode, and deviceName are required' },
        { status: 400 }
      );
    }

    const device = await prisma.device.findUnique({ where: { id: deviceId } });
    if (!device) {
      return NextResponse.json(
        { success: false, message: 'Device not found' },
        { status: 404 }
      );
    }

    if (device.isPaired) {
      return NextResponse.json(
        { success: false, message: 'Device already paired' },
        { status: 400 }
      );
    }

    const updated = await prisma.device.update({
      where: { id: deviceId },
      data: {
        pairingCode,
        deviceName,
        parentId: authUser.userId,
        isPaired: true,
      },
    });

    return NextResponse.json({ success: true, device: updated });
  } catch {
    return NextResponse.json(
      { success: false, message: 'Something went wrong' },
      { status: 500 }
    );
  }
}
