// VariantStep.tsx
'use client';

import React from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import type { ManageProductFormInput } from './productSchema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { generateClientSku } from '@/helpers/sku-helper';
import { Uploader } from '@/features/shared/components/file-uploader/uploader';

export default function VariantStep() {
  const form = useFormContext<ManageProductFormInput>();
  const { control } = form;
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: 'variants',
  });

  const handleGenerateSku = (index: number, name?: string) => {
    const sku = generateClientSku(name);
    // Get the latest variant values from the form, fallback to fields[index]
    const currentVariant = form.getValues(`variants.${index}`) ?? fields[index];
    update(index, {
      ...currentVariant,
      sku,
    });
    form.setValue(`variants.${index}.sku`, sku);
    form.trigger(`variants.${index}.sku`);
  };

  const addEmptyVariant = () =>
    append({
      sku: '',
      name: '',
      price: 0,
      image: '',
      imagePublicId: '',
      compareAt: undefined,
      currency: 'VND',
      stock: 0,
      reserved: 0,
      weightGrams: undefined,
      lengthMm: undefined,
      widthMm: undefined,
      heightMm: undefined,
      attributes: {},
      isActive: true,
    });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Variants</h3>
        <div className="flex items-center gap-2">
          <Button type="button" onClick={addEmptyVariant}>
            Add variant
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {fields.length === 0 && (
          <Card>
            <CardContent className="text-sm text-muted-foreground">
              No variants yet. Click{' '}
              <span className="font-medium">Add variant</span> to create one.
            </CardContent>
          </Card>
        )}

        {fields.map((fieldItem, index) => (
          <Card key={fieldItem.id} className="overflow-visible">
            <CardHeader className="flex items-center justify-between gap-4">
              <CardTitle className="text-sm">Variant #{index + 1}</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => remove(index)}
                >
                  Remove
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              {/* Grid: left fields, right fixed image column */}
              <div className="grid md:grid-rows-[1fr_260px] gap-4 items-start">
                <div className="grid grid-cols-2 gap-3">
                  {/* Name */}
                  <FormField
                    control={control}
                    name={`variants.${index}.name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ''}
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* SKU */}
                  <FormField
                    control={control}
                    name={`variants.${index}.sku`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm flex items-center justify-between">
                          <span>SKU</span>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="ml-2"
                            onClick={() =>
                              handleGenerateSku(index, fields[index].name)
                            }
                          >
                            Generate SKU
                          </Button>
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ''}
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Price */}
                  <FormField
                    control={control}
                    name={`variants.${index}.price`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Price</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            value={field.value as any}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Stock */}
                  <FormField
                    control={control}
                    name={`variants.${index}.stock`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Stock</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            value={field.value as any}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Image column: fixed width, taller preview */}
                <div className="flex flex-col items-stretch gap-3">
                  <FormLabel className="text-sm mb-1">Image</FormLabel>

                  <FormField
                    control={control}
                    name={`variants.${index}.image`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Uploader
                            value={
                              fieldItem.image && fieldItem.imagePublicId
                                ? {
                                    url: fieldItem.image,
                                    publicId: fieldItem.imagePublicId,
                                  }
                                : null
                            }
                            onChange={(file) => {
                              const url = file?.url ?? '';
                              const publicId = file?.publicId ?? '';

                              // Update only the specific fields to avoid resetting other values
                              form.setValue(`variants.${index}.image`, url, {
                                shouldDirty: true,
                                shouldValidate: true,
                              });
                              form.setValue(
                                `variants.${index}.imagePublicId`,
                                publicId,
                                {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                }
                              );

                              form.trigger([
                                `variants.${index}.image`,
                                `variants.${index}.imagePublicId`,
                              ]);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter>
              <div className="w-full text-sm text-muted-foreground">
                Tip: Each variant requires one image. You can replace the image
                by uploading a new one.
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Separator />
    </div>
  );
}
