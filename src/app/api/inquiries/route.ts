import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

// Handle CORS preflight requests
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

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
        const message = await client.messages.create({
          body: smsMessage,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: process.env.PLATINUM_OWNER_PHONE,
        });
        console.log('SMS sent successfully:', message.sid);
      } else {
        console.warn('Twilio credentials not found in environment');
      }
    } catch (smsError) {
      console.error('SMS send failed:', smsError instanceof Error ? smsError.message : smsError);
      // Don't fail the request if SMS fails, just log it
    }

    return NextResponse.json(
      { success: true, inquiry },
      {
        status: 201,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Inquiry creation failed:', error);
    return NextResponse.json(
      { error: 'Failed to create inquiry' },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}
