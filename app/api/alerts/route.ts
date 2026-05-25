import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import twilio from 'twilio';

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

const client = TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN ? twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN) : null;

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

    const alerts = await prisma.alert.findMany({
      where: { userId: decoded.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        watch: true,
      },
    });

    return NextResponse.json({
      success: true,
      alerts,
    });
  } catch (error) {
    console.error('[GET ALERTS ERROR]', error);
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

    const { watchId, type, severity, message } = await req.json();

    if (!watchId || !type || !message) {
      return NextResponse.json(
        { success: false, message: 'Watch ID, type, and message are required' },
        { status: 400 }
      );
    }

    const alert = await prisma.alert.create({
      data: {
        userId: decoded.userId,
        watchId,
        type,
        severity: severity || 'medium',
        message,
        isResolved: false,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Alert created successfully',
        alert,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[CREATE ALERT ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Something went wrong' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
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

    const { alertId, isResolved } = await req.json();

    if (!alertId) {
      return NextResponse.json(
        { success: false, message: 'Alert ID is required' },
        { status: 400 }
      );
    }

    const alert = await prisma.alert.updateMany({
      where: {
        id: alertId,
        userId: decoded.userId,
      },
      data: {
        isResolved: isResolved ?? true,
        resolvedAt: isResolved ? new Date() : null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Alert updated successfully',
    });
  } catch (error) {
    console.error('[UPDATE ALERT ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Something went wrong' },
      { status: 500 }
    );
  }
}
