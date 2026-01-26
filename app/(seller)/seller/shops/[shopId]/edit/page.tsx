'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { ShopStatus } from '@/lib/generated/prisma';
import { Loader } from 'lucide-react';
import { Uploader } from '@/features/shared/components/file-uploader/uploader';

const editShopSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(200)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Invalid slug format (lowercase letters, numbers and hyphens only)'
    ),
  description: z.string().nullable().optional(),
  logoUrl: z.string().url().nullable().optional(),
  logoPublicId: z.string().nullable().optional(),
  coverUrl: z.string().url().nullable().optional(),
  coverPublicId: z.string().nullable().optional(),
  contactEmail: z.string().email().nullable().optional(),
  contactPhone: z.string().nullable().optional(),
  status: z.nativeEnum(ShopStatus),
});

type EditShopInput = z.infer<typeof editShopSchema>;

export default function EditShopPage() {
  const router = useRouter();
  const params = useParams();
  const shopId = params.shopId as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<EditShopInput>({
    resolver: zodResolver(editShopSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: null,
      logoUrl: null,
      logoPublicId: null,
      coverUrl: null,
      coverPublicId: null,
      contactEmail: null,
      contactPhone: null,
      status: ShopStatus.ACTIVE,
    },
  });

  const { handleSubmit, control, setValue, watch } = form;

  useEffect(() => {
    if (!shopId) return;

    fetch(`/api/seller/shops/${shopId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load shop');
        return res.json();
      })
      .then((shop) => {
        form.reset({
          name: shop.name,
          slug: shop.slug,
          description: shop.description ?? null,
          logoUrl: shop.logoUrl ?? null,
          logoPublicId: shop.logoPublicId ?? null,
          coverUrl: shop.coverUrl ?? null,
          coverPublicId: shop.coverPublicId ?? null,
          contactEmail: shop.contactEmail ?? null,
          contactPhone: shop.contactPhone ?? null,
          status: shop.status,
        });
        setLoading(false);
      })
      .catch((err) => {
        toast.error(err.message || 'Failed to load shop');
        router.push('/seller/shops');
      });
  }, [shopId, form, router]);

  const onSubmit = async (data: EditShopInput) => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/seller/shops/${shopId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Update failed');
      }

      toast.success('Shop updated successfully');
      router.push('/seller/shops');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update shop');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card className="mx-auto max-w-3xl mt-8">
        <CardContent className="py-10 text-center flex items-center justify-center gap-2">
          <Loader className="size-4 animate-spin" />
          Loading shop details...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-3xl py-8 px-4">
      <h1 className="text-2xl font-semibold mb-4">Edit Shop</h1>

      <Card>
        <CardHeader>
          <CardTitle>Shop Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Shop Name */}
              <FormField
                control={control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shop Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="My Shop" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Slug */}
              <FormField
                control={control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="my-shop" />
                    </FormControl>
                    <p className="text-sm text-muted-foreground">
                      Lowercase letters, numbers and hyphens only.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value ?? ''}
                        placeholder="Shop description..."
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Logo and Cover Images */}
              <div className="grid sm:grid-cols-2 gap-4">
                <FormField
                  control={control}
                  name="logoPublicId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Logo</FormLabel>
                      <p className="text-sm text-muted-foreground mb-2">
                        Recommended: square image
                      </p>
                      <FormControl>
                        <Controller
                          control={control}
                          name="logoPublicId"
                          render={({ field: cfield }) => (
                            <Uploader
                              value={
                                cfield.value &&
                                (cfield.value as unknown as {
                                  url: string;
                                  publicId: string;
                                })
                                  ? {
                                      url:
                                        (form.getValues('logoUrl') as string) ??
                                        '',
                                      publicId: cfield.value as string,
                                    }
                                  : null
                              }
                              onChange={(file) => {
                                if (!file) {
                                  setValue('logoUrl', null, {
                                    shouldDirty: true,
                                    shouldValidate: true,
                                  });
                                  cfield.onChange(null);
                                  setValue('logoPublicId', null);
                                } else {
                                  setValue('logoUrl', file.url, {
                                    shouldDirty: true,
                                    shouldValidate: true,
                                  });
                                  cfield.onChange(file.publicId);
                                  setValue('logoPublicId', file.publicId, {
                                    shouldDirty: true,
                                    shouldValidate: true,
                                  });
                                }
                              }}
                            />
                          )}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="coverPublicId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cover</FormLabel>
                      <p className="text-sm text-muted-foreground mb-2">
                        Recommended: wide banner
                      </p>
                      <FormControl>
                        <Controller
                          control={control}
                          name="coverPublicId"
                          render={({ field: cfield }) => (
                            <Uploader
                              value={
                                cfield.value &&
                                (cfield.value as unknown as {
                                  url: string;
                                  publicId: string;
                                })
                                  ? {
                                      url:
                                        (form.getValues(
                                          'coverUrl'
                                        ) as string) ?? '',
                                      publicId: cfield.value as string,
                                    }
                                  : null
                              }
                              onChange={(file) => {
                                if (!file) {
                                  setValue('coverUrl', null, {
                                    shouldDirty: true,
                                    shouldValidate: true,
                                  });
                                  cfield.onChange(null);
                                  setValue('coverPublicId', null);
                                } else {
                                  setValue('coverUrl', file.url, {
                                    shouldDirty: true,
                                    shouldValidate: true,
                                  });
                                  cfield.onChange(file.publicId);
                                  setValue('coverPublicId', file.publicId, {
                                    shouldDirty: true,
                                    shouldValidate: true,
                                  });
                                }
                              }}
                            />
                          )}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Contact Information */}
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ''}
                          type="email"
                          placeholder="contact@shop.com"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="contactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Phone</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ''}
                          placeholder="+84 123 456 789"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Status */}
              <FormField
                control={control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(ShopStatus).map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Action Buttons */}
              <div className="flex gap-4 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/seller/shops')}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader className="size-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
