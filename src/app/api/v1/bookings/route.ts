import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/clerk';
import { db, setTenantContext } from '@/lib/db';
import { bookings, insertBookingSchema } from '@/lib/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Set tenant context for RLS
    await setTenantContext(user.tenantId);

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const artistId = searchParams.get('artistId');

    let query = db.select().from(bookings);

    // Add filters
    if (startDate) {
      query = query.where(gte(bookings.startTime, new Date(startDate)));
    }
    if (endDate) {
      query = query.where(lte(bookings.endTime, new Date(endDate)));
    }
    if (artistId) {
      query = query.where(eq(bookings.artistId, artistId));
    }

    const result = await query;

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Set tenant context for RLS
    await setTenantContext(user.tenantId);

    const body = await request.json();
    const validation = insertBookingSchema.safeParse({
      ...body,
      tenantId: user.tenantId,
      userId: user.id,
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    // Check for conflicts
    const conflicts = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.artistId, validation.data.artistId),
          eq(bookings.status, 'confirmed'),
          // Check for time overlap
          gte(bookings.endTime, validation.data.startTime),
          lte(bookings.startTime, validation.data.endTime)
        )
      );

    if (conflicts.length > 0) {
      return NextResponse.json(
        { error: 'Booking conflict detected' },
        { status: 409 }
      );
    }

    const result = await db
      .insert(bookings)
      .values(validation.data)
      .returning();

    return NextResponse.json({ data: result[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    );
  }
}