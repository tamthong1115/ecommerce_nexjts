'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'sonner';
import { Loader, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { CreateShopInput, createShopSchema } from './shopSchema';
import { generateClientSlug } from '@/helpers/slug-helper';
import { paths } from '@/lib/path';
import { fetchApi } from '@/lib/client-fetch';
import { Uploader } from '@/features/shared/components/file-uploader/uploader';

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '')
    .replace(/\-+/g, '-');
}

export default function CreateShopForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<CreateShopInput>({
    resolver: zodResolver(createShopSchema),
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
    },
  });

  const {
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = form;

  const watchedName = watch('name');

  function handleAutoSlugFromName() {
    const nameVal = watchedName ?? '';
    if (!nameVal) return;
    const s = slugify(nameVal);
    setValue('slug', s, { shouldValidate: true, shouldTouch: true });
  }

  const handleGenerateSlug = () => {
    const name = form.getValues('name');
    if (name) {
      const slug = generateClientSlug(name);
      form.setValue('slug', slug, { shouldValidate: true, shouldTouch: true });
    }
  };

  async function onSubmit(values: CreateShopInput) {
    startTransition(async () => {
      try {
        const res = await fetchApi('/api/seller/shops', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        });

        const data: any = res.data;

        if (res.success) {
          toast.success(
            res.message ??
              'Shop created successfully. You can now add products.'
          );
          router.push('/seller/shops');
          return;
        }

        const errMsg = res.message ?? 'Failed to create shop';
        if (res.code === 401) {
          toast.error('You must be signed in to create a shop');
          router.push(
            `${paths.login}?callbackUrl=${encodeURIComponent('/seller/shops/create')}`
          );
          return;
        }
        if (res.code === 409) {
          toast.error(res.message ?? 'Slug already taken — try another');
          return;
        }

        toast.error(errMsg);
      } catch (err) {
        console.error('create shop error', err);
        toast.error('Unexpected error');
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create a Shop</CardTitle>
        <CardDescription>
          Create your seller shop to list products.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
            {/* Shop Name */}
            <FormField
              control={control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shop name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="My Awesome Shop"
                      onBlur={() => {
                        field.onBlur();
                        handleAutoSlugFromName();
                      }}
                    />
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
                  <FormLabel>Slug (url)</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input {...field} placeholder="my-awesome-shop" />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleGenerateSlug}
                      disabled={!watchedName}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
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
                      rows={4}
                      placeholder="Short description for your shop"
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Logo and Cover */}
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
                                      (form.getValues('coverUrl') as string) ??
                                      '',
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
            <div className="grid sm:grid-cols-2 gap-2">
              <FormField
                control={control}
                name="contactEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="contact@example.com"
                        type="email"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value)}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
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
                        placeholder="+84..."
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value)}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/seller/shops')}
                disabled={isSubmitting || isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || isPending}>
                {isSubmitting || isPending ? (
                  <>
                    <Loader className="size-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  'Create shop'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
