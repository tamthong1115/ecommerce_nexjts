'use client';

import { useFormContext } from 'react-hook-form';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ManageProductFormInput } from './productSchema';
import { useCategories } from '@/hooks/use-categories';
import { CategoryCascader } from './category-cascader';
import { useState } from 'react';
import { generateClientSlug } from '@/helpers/slug-helper';
import { IconRefresh } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { $Enums } from '@/lib/generated/prisma';
import ProductStatus = $Enums.ProductStatus;
import Visibility = $Enums.Visibility;
import { Textarea } from '@/components/ui/textarea';
import { useShops } from '@/hooks/use-shops';

export default function ProductGeneralInfo() {
  const form = useFormContext<ManageProductFormInput>();
  const { categories, loading } = useCategories();
  const [isEditingSlug, setIsEditingSlug] = useState(false);
  const { shops, loading: shopsLoading } = useShops();

  const handleGenerateSlug = async () => {
    const title = form.getValues('title');
    if (title) {
      const slug = generateClientSlug(title);
      form.setValue('slug', slug);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">General Information</h3>
      </div>

      {/* Shop Select */}
      <FormField
        control={form.control}
        name="shopId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Shop <span className="text-destructive">*</span>
            </FormLabel>
            <FormControl>
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={shopsLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select shop" />
                </SelectTrigger>
                <SelectContent>
                  {shops.map((shop) => (
                    <SelectItem key={shop.id} value={shop.id}>
                      {shop.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Product Title */}
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Title Of Product <span className="text-destructive">*</span>
            </FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder="Type product title"
                maxLength={255}
              />
            </FormControl>
            <div className="flex justify-between text-xs text-muted-foreground">
              <p>
                Refer to SEO-friendly product naming methods — attract more
                customers.
              </p>
              <span>{field.value?.length || 0} / 255</span>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Product Slug */}
      <FormField
        control={form.control}
        name="slug"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              URL Friendly (Slug) <span className="text-destructive">*</span>
            </FormLabel>
            <FormControl>
              <div className="flex gap-2">
                <Input
                  {...field}
                  placeholder="url-friendly-product-name"
                  maxLength={255}
                  onChange={(e) => {
                    field.onChange(e);
                    setIsEditingSlug(true);
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleGenerateSlug}
                  title="Generate Slug"
                >
                  <IconRefresh className="h-4 w-4" />
                </Button>
              </div>
            </FormControl>
            <FormDescription>
              URL slug is used in the product link for better SEO.z
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Product Description */}
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                placeholder="Enter product description"
                value={field.value || ''}
                rows={4}
              />
            </FormControl>
            <FormDescription>
              Provide a detailed description of your product
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Product Status */}
      <FormField
        control={form.control}
        name="status"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Status <span className="text-destructive">*</span>
            </FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select product status" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {Object.values(ProductStatus).map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormDescription>
              Choose whether this product is draft or published
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Product Visibility */}
      <FormField
        control={form.control}
        name="visibility"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Visibility <span className="text-destructive">*</span>
            </FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select visibility" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {Object.values(Visibility).map((visibility) => (
                  <SelectItem key={visibility} value={visibility}>
                    {visibility}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormDescription>Choose who can see this product</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Category Cascader */}
      <FormField
        control={form.control}
        name="categoryId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Category <span className="text-destructive">*</span>
            </FormLabel>
            <FormControl>
              <CategoryCascader
                categories={categories}
                value={field.value || null}
                onChange={field.onChange}
                disabled={loading}
                placeholder="Select Category"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
