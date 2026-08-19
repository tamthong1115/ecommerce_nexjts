'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useShops } from '@/hooks/use-shops';
import { ManageProductFormInput } from '@/app/(seller)/seller/products/_components/productSchema';
import ManageProductForm from '@/app/(seller)/seller/products/_components/manage-product-form';

export default function CreateProductPageSeller() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [hasShop, setHasShop] = useState<boolean | null>(null);
  const [checkingShops, setCheckingShops] = useState(true);
  const { shops, loading: shopsLoading, error: shopsError } = useShops();

  useEffect(() => {
    let mounted = true;
    setCheckingShops(shopsLoading);

    if (!shopsLoading) {
      if (shopsError) {
        if (mounted) {
          setHasShop(false);
          toast.error('Failed to fetch shops');
        }
      } else {
        if (mounted) setHasShop((shops?.length ?? 0) > 0);
      }
    }

    return () => {
      mounted = false;
    };
  }, [shops, shopsLoading, shopsError]);

  const handleSubmit = async (data: ManageProductFormInput) => {
    if (hasShop === false) {
      toast.error('Create a shop before creating products.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/seller/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (result.success) {
        toast.success('Product created successfully!');
        router.push('/seller/products');
      } else {
        toast.error(result.error || 'Failed to create product');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to create product');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="">
      <h1 className="text-2xl font-bold mb-6">Create New Product</h1>

      {checkingShops ? null : hasShop === false ? (
        <div className="mb-6 p-4 rounded border bg-yellow-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <strong className="block">You don’t have a shop yet.</strong>
            <p className="text-sm text-muted-foreground">
              Create a shop first to start creating products.
            </p>
          </div>
          <div>
            <Button onClick={() => router.push('/seller/shops/create')}>
              Create shop
            </Button>
          </div>
        </div>
      ) : null}

      <ManageProductForm onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  );
}
