'use server';

import { requireSeller } from '@/lib/require-admin';
import { prisma } from '@/lib/db';
import { randomBytes } from 'node:crypto';
import { ShopMemberRole } from '@/lib/generated/prisma'; // Check this path
import { env } from '@/lib/env';
import { paths } from '@/lib/path';
import { sendShopInvitationEmail } from '@/features/notification/server/email/lib/mailer';
import { InviteMemberSchema } from '@/app/(seller)/seller/shops/[shopId]/members/schema';
import { ResponseFactory } from '@/lib/api-response';
import { revalidatePath } from 'next/cache';

export async function inviteMember({
  email,
  shopId,
  role = ShopMemberRole.STAFF,
}: {
  email: string;
  shopId: string;
  role?: ShopMemberRole;
}) {
  const parsed = InviteMemberSchema.safeParse({ email, shopId, role });
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return ResponseFactory.error({
      message: 'Validation failed',
      code: 400,
      errors,
    });
  }

  const session = await requireSeller();
  if (!session) {
    return ResponseFactory.error({
      message: 'Unauthorized',
      code: 401,
    });
  }

  const shop = await prisma.shop.findFirst({
    where: { id: shopId, ownerId: session.user.id },
  });

  if (!shop) {
    return ResponseFactory.error({
      message: 'Shop not found or permission denied',
      code: 403,
    });
  }

  const existingMember = await prisma.shopMember.findFirst({
    where: {
      shopId,
      user: { email },
    },
  });
  if (existingMember) {
    return ResponseFactory.error({
      message: 'User is already a member of this shop',
      code: 400,
    });
  }

  try {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 3); // 3 days

    await prisma.shopInvitation.upsert({
      where: {
        shopId_email: { shopId, email },
      },
      update: { token, expiresAt },
      create: {
        email,
        shopId,
        token,
        expiresAt,
        role: ShopMemberRole.STAFF,
      },
    });

    const invitationLink = `${env.NEXT_PUBLIC_BASE_URL}${paths.shop.accept_invite(
      token
    )}?email=${encodeURIComponent(email)}`;

    await sendShopInvitationEmail(
      email,
      shop.name,
      session.user.name || session.user.email || 'Shop Owner',
      invitationLink
    );

    revalidatePath(`/seller/shops/${shopId}/members`);

    return ResponseFactory.success({
      message: 'Invitation sent successfully',
    });
  } catch (err) {
    console.error('inviteMember error', err);
    return ResponseFactory.error({
      message: 'Failed to send invitation',
      code: 500,
    });
  }
}

export async function removeMember(shopId: string, memberId: string) {
  const session = await requireSeller();
  if (!session) {
    return ResponseFactory.error({ message: 'Unauthorized', code: 401 });
  }

  const shop = await prisma.shop.findFirst({
    where: { id: shopId, ownerId: session.user.id },
  });
  if (!shop) {
    return ResponseFactory.error({ message: 'Permission denied', code: 403 });
  }

  try {
    await prisma.shopMember.delete({
      where: { id: memberId, shopId },
    });

    revalidatePath(`/seller/shops/${shopId}/members`);

    return ResponseFactory.success({
      data: null,
      message: 'Member removed successfully',
    });
  } catch (error) {
    return ResponseFactory.error({
      message: 'Failed to remove member',
      code: 500,
    });
  }
}
