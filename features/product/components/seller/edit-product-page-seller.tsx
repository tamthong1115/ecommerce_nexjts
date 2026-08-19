'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';

import { fetchApi } from '@/lib/client-fetch';
import { ManageProductFormInput } from '@/app/(seller)/seller/products/_components/productSchema';
import ManageProductForm from '@/app/(seller)/seller/products/_components/manage-product-form';

export default function EditProductPageSeller() {
  const router = useRouter();
  const params = useParams();
  const productId = params?.productId as string;
  const [product, setProduct] = useState<ManageProductFormInput | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!productId) return;
    let mounted = true;
    setIsLoading(true);

    fetchApi(`/api/seller/products/${productId}`)
      .then((res) => {
        if (!res?.success) {
          toast.error('Failed to fetch product');
          return null;
        }
        return res.data;
      })
      .then((data) => {
        if (!mounted) return;
        if (data) setProduct(data as ManageProductFormInput);
      })
      .catch((err) => {
        console.error(err);
        toast.error('Failed to fetch product');
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [productId]);

  const handleSubmit = async (data: ManageProductFormInput) => {
    setIsLoading(true);
    try {
      const res = await fetchApi(`/api/seller/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.success) {
        toast.success('Product updated successfully!');
        router.push('/seller/products');
      } else {
        toast.error(res.message || 'Failed to update product');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update product');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="">
      <h1 className="text-2xl font-bold mb-6">Edit Product</h1>
      {product ? (
        <ManageProductForm
          product={product}
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
}
