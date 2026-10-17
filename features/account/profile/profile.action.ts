'use server';

import { auth, getCurrentUserId, getSessionUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { paths } from '@/lib/path';
import { Role } from '@/lib/generated/prisma';
import { UpdateUserProfileRequestDTO } from '@/features/account/profile/profile.dto';
import { ResponseFactory } from '@/lib/api-response';
import { updateUserProfileService } from '@/features/account/profile/profile.service';

export async function updateProfileAction(formData: FormData) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return ResponseFactory.error({ message: 'Unauthorized', code: 401 });
    }

    const data: UpdateUserProfileRequestDTO = {
      name: formData.get('name') as string | null,
      phone: formData.get('phone') as string | null,
      birthDate: formData.get('birthDate') as string | null,
      gender: formData.get('gender') as string | null,
      bio: formData.get('bio') as string | null,
      image: formData.get('image') as string | null,
      emailForBill: formData.get('emailForBill') as string | null,
    };

    const profile = await updateUserProfileService(userId, data);

    // refresh session (name/image changes)
    await auth.api.getSession({
      headers: await headers(),
      query: { disableCookieCache: true },
    });

    // revalidate by role
    const session = await getSessionUser();
    const role = session?.user?.role?.toLowerCase?.();

    if (role === Role.admin) {
      revalidatePath(paths.manager.account.edit);
    } else if (role === Role.seller) {
      revalidatePath(paths.seller.account.edit);
    } else {
      revalidatePath(paths.customer.account.edit);
    }
    return ResponseFactory.success({
      data: profile,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    return ResponseFactory.handleError(error);
  }
}
