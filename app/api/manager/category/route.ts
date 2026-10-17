import { ResponseFactory } from '@/lib/api-response';
import { deleteFromCloudinary, uploadToCloudinary } from '@/lib/cloudinary';
import { prisma } from '@/lib/db';
import { Prisma } from '@/lib/generated/prisma';
import { withAdmin } from '@/lib/with-auth';
import { HttpStatus } from '@/types/api'; // Updated import
import { NextRequest } from 'next/server';

export const GET = withAdmin(async (userId: string, request: NextRequest) => {
  try {
    const searchParams = request.nextUrl.searchParams;

    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '10'));
    const search = searchParams.get('search') || '';
    const isActiveParam = searchParams.get('filter');
    const parentId = searchParams.get('parentId');

    const skip = (page - 1) * limit;

    const where: Prisma.CategoryWhereInput = {
      AND: [
        search ? { name: { contains: search, mode: 'insensitive' } } : {},
        isActiveParam ? { isActive: isActiveParam === 'true' } : {},
        parentId !== null
          ? { parentId: parentId === 'null' ? null : parentId }
          : {},
      ],
    };

    const [categories, total] = await prisma.$transaction([
      prisma.category.findMany({
        where,
        skip,
        take: limit,
        orderBy: { position: 'asc' },
        include: {
          _count: { select: { children: true } },
          parent: { select: { name: true } },
        },
      }),
      prisma.category.count({ where }),
    ]);

    return ResponseFactory.toNextResponse(
      ResponseFactory.paginated({
        data: categories,
        page,
        limit,
        total,
        message: 't_success',
        code: HttpStatus.OK,
      })
    );
  } catch (error) {
    return ResponseFactory.toNextResponse(ResponseFactory.handleError(error));
  }
});

export const POST = withAdmin(async (userId: string, request: NextRequest) => {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File | null;

    if (!file) {
      return ResponseFactory.toNextResponse(
        ResponseFactory.error({
          message: 't_missing_file',
          code: HttpStatus.BAD_REQUEST,
        })
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const upload = await uploadToCloudinary(buffer, {
      folder: 'category-images',
      resource_type: 'image',
      use_filename: true,
      unique_filename: true,
    });

    if (!upload?.secure_url) {
      return ResponseFactory.toNextResponse(
        ResponseFactory.error({
          message: 't_upload_failed',
          code: HttpStatus.FORBIDDEN,
        })
      );
    }

    const name = formData.get('name') as string;
    const slug = formData.get('slug') as string;
    const isActive = formData.get('isActive') === 'true';
    const parentIdRaw = formData.get('parentId') as string;
    const parentId =
      parentIdRaw && parentIdRaw !== 'null' && parentIdRaw !== ''
        ? parentIdRaw
        : null;

    const lastSibling = await prisma.category.findFirst({
      where: { parentId: parentId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    const newPosition = (lastSibling?.position ?? -1) + 1;

    const newCategory = await prisma.category.create({
      data: {
        name,
        slug,
        isActive,
        parentId,
        position: newPosition,
        imageUrl: upload.secure_url,
        publicId: upload.public_id,
      },
    });

    return ResponseFactory.toNextResponse(
      ResponseFactory.success({
        data: newCategory,
        message: 't_success',
        code: HttpStatus.CREATED,
      })
    );
  } catch (error) {
    return ResponseFactory.toNextResponse(ResponseFactory.handleError(error));
  }
});

export const PUT = withAdmin(async (userId: string, request: NextRequest) => {
  try {
    const formData = await request.formData();
    const id = formData.get('id') as string;
    const file = formData.get('image') as File | null;

    if (!id) {
      return ResponseFactory.toNextResponse(
        ResponseFactory.error({
          message: 't_missing_id',
          code: HttpStatus.BAD_REQUEST,
        })
      );
    }

    const category = await prisma.category.findUnique({ where: { id } });

    if (!category) {
      return ResponseFactory.toNextResponse(
        ResponseFactory.error({
          message: 't_category_not_found',
          code: HttpStatus.NOT_FOUND,
        })
      );
    }

    const updateData: Prisma.CategoryUpdateInput = {
      name: formData.get('name') as string,
      slug: formData.get('slug') as string,
      isActive: formData.get('isActive') === 'true',
    };

    if (file) {
      if (category.publicId) {
        await deleteFromCloudinary(category.publicId, { invalidate: true });
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const upload = await uploadToCloudinary(buffer, {
        folder: 'category-images',
        resource_type: 'image',
        use_filename: true,
        unique_filename: true,
      });

      if (upload) {
        updateData.imageUrl = upload.secure_url;
        updateData.publicId = upload.public_id;
      }
    }

    await prisma.category.update({
      where: { id },
      data: updateData,
    });

    return ResponseFactory.toNextResponse(
      ResponseFactory.success({
        message: 't_success',
        code: HttpStatus.OK,
      })
    );
  } catch (error) {
    return ResponseFactory.toNextResponse(ResponseFactory.handleError(error));
  }
});

export const DELETE = withAdmin(async (userId: string, request: NextRequest) => {
  try {
    const searchParams = request.nextUrl.searchParams;
    const categoryId = searchParams.get('id');

    if (!categoryId) {
      return ResponseFactory.toNextResponse(
        ResponseFactory.error({
          message: 't_missing_id',
          code: HttpStatus.BAD_REQUEST,
        })
      );
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        _count: { select: { products: true, children: true } },
      },
    });

    if (!category) {
      return ResponseFactory.toNextResponse(
        ResponseFactory.error({
          message: 't_category_not_found',
          code: HttpStatus.NOT_FOUND,
        })
      );
    }

    if (category._count.products > 0) {
      return ResponseFactory.toNextResponse(
        ResponseFactory.error({
          message: 't_category_in_use',
          code: HttpStatus.BAD_REQUEST,
        })
      );
    }
    if (category._count.children > 0) {
      return ResponseFactory.toNextResponse(
        ResponseFactory.error({
          message: 't_category_has_children',
          code: HttpStatus.BAD_REQUEST,
        })
      );
    }

    if (category.publicId) {
      await deleteFromCloudinary(category.publicId, { invalidate: true });
    }

    await prisma.category.delete({ where: { id: categoryId } });

    return ResponseFactory.toNextResponse(
      ResponseFactory.success({
        message: 't_success',
        code: HttpStatus.OK,
      })
    );
  } catch (error) {
    return ResponseFactory.toNextResponse(ResponseFactory.handleError(error));
  }
});
