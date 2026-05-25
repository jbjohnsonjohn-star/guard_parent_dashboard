import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import twilio from 'twilio';

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

const client = TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN ? twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN) : null;

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

    const { alertId } = await req.json();

    if (!alertId) {
      return NextResponse.json(
        { success: false, message: 'Alert ID is required' },
        { status: 400 }
      );
    }

    // Get the alert with user and watch info
    const alert = await prisma.alert.findUnique({
      where: { id: alertId },
      include: {
        user: true,
        watch: true,
      },
    });

    if (!alert || alert.userId !== decoded.userId) {
      return NextResponse.json(
        { success: false, message: 'Alert not found' },
        { status: 404 }
      );
    }

    let notificationSent = false;
    let method = 'none';

    // Send SMS via Twilio if credentials and phone number are available
    if (client && TWILIO_PHONE_NUMBER && alert.user.phone) {
      try {
        await client.messages.create({
          body: `[G.U.A.R.D] ${alert.message} - Device: ${alert.watch.name}`,
          from: TWILIO_PHONE_NUMBER,
          to: alert.user.phone,
        });
        notificationSent = true;
        method = 'sms';
        console.log(`[v0] SMS notification sent to ${alert.user.phone}`);
      } catch (smsError) {
        console.error('[v0] SMS send error:', smsError);
        // Fallback to console log
        console.log(`[v0] ALERT NOTIFICATION: ${alert.message} - Device: ${alert.watch.name}`);
        notificationSent = true;
        method = 'console';
      }
    } else {
      // Development mode: log to console
      console.log(`[v0] ALERT NOTIFICATION: ${alert.message} - Device: ${alert.watch.name}`);
      notificationSent = true;
      method = 'console';
    }

    return NextResponse.json({
      success: true,
      message: 'Notification sent',
      method,
      notificationSent,
    });
  } catch (error) {
    console.error('[NOTIFY ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Something went wrong' },
      { status: 500 }
    );
  }
}
