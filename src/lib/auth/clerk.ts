import { currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function getCurrentUser() {
  const clerkUser = await currentUser();
  
  if (!clerkUser) {
    return null;
  }

  // Find user in database
  const dbUser = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkUser.id))
    .limit(1);

  if (dbUser.length === 0) {
    // Create user if doesn't exist
    const newUser = await db
      .insert(users)
      .values({
        clerkId: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        avatar: clerkUser.imageUrl,
        tenantId: '', // Will be set during onboarding
        role: 'member',
      })
      .returning();

    return newUser[0];
  }

  return dbUser[0];
}

export async function getUserWithTenant() {
  const user = await getCurrentUser();
  
  if (!user) {
    return null;
  }

  // Get user with tenant data
  const userWithTenant = await db.query.users.findFirst({
    where: eq(users.id, user.id),
    with: {
      tenant: true,
    },
  });

  return userWithTenant;
}