import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { firstName, lastName, phone, projectType, garageSize, coatingSystem, projectDetails, address } = body;

    // Validate required fields
    if (!firstName || !lastName || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create inquiry in database
    const inquiry = await prisma.platinumInquiry.create({
      data: {
        firstName,
        lastName,
        phone,
        projectType,
        garageSize,
        coatingSystem: coatingSystem || null,
        projectDetails: projectDetails || null,
        address: address || null,
      },
    });

    // Send SMS notification via Twilio
    const smsMessage = `New Platinum Installs Inquiry:\n${firstName} ${lastName}\nPhone: ${phone}\nGarage: ${garageSize}\nProject: ${projectType}`;

    try {
      if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER && process.env.PLATINUM_OWNER_PHONE) {
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        await client.messages.create({
          body: smsMessage,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: process.env.PLATINUM_OWNER_PHONE,
        });
      }
    } catch (smsError) {
      console.error('SMS send failed:', smsError);
      // Don't fail the request if SMS fails, just log it
    }

    return NextResponse.json(
      { success: true, inquiry },
      { status: 201 }
    );
  } catch (error) {
    console.error('Inquiry creation failed:', error);
    return NextResponse.json(
      { error: 'Failed to create inquiry' },
      { status: 500 }
    );
  }
}
