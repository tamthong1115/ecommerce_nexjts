'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ReviewFormValues,
  reviewSchema,
} from '@/app/(public)/(customer)/customer/account/orders/_components/reviewSchema';
import { useForm } from 'react-hook-form';
import { OrderItemsDTO } from '@/types/dtos/order.dto';
import { fetchApi } from '@/lib/client-fetch';
import { toast } from 'sonner';
import Image from 'next/image';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Star } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { MultiUploader } from '@/features/shared/components/file-uploader/multi-uploader';

export function DialogReview({ item, t }: { item: OrderItemsDTO; t: any }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema) as any,
    defaultValues: {
      rating: 0,
      title: '',
      body: '',
      images: [],
    },
  });

  const { isSubmitting } = form.formState;

  const submit = async (data: ReviewFormValues) => {
    try {
      const payload = {
        productId: item.productId,
        orderItemId: item.id,
        rating: data.rating,
        title: data.title,
        body: data.body,
        images: data.images
          ?.filter((img: any) => img.url && !img.error)
          .map((img: any) => ({
            url: img.url,
            publicId: img.publicId,
          })),
      };

      console.log('--- Submitting Review Payload ---');
      console.log('Item ID (orderItemId):', item.id);
      console.log('Product ID:', item.productId);
      console.log('Data to API:', payload);
      console.log('---------------------------------');

      const res = await fetchApi('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.success) {
        throw new Error(res.message || 'Gửi đánh giá thất bại');
      }
      toast.success('Đánh giá thành công!', {
        position: 'top-right',
        duration: 3000,
      });

      setOpen(false);
      form.reset();
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Có lỗi xảy ra');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="cursor-pointer">
          {t('buttons.write_review')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Đánh giá</DialogTitle>
          <DialogDescription className="flex items-center gap-4">
            <Image
              src={item.product.images[0].url}
              alt={item.product.images[0].alt || '....'}
              width={100}
              height={100}
            />
            <p className="text-text text-base">{item.product.title}</p>
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Đánh giá chất lượng</FormLabel>
                  <FormControl>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-8 h-8 cursor-pointer transition-colors ${
                            star <= field.value
                              ? 'fill-warning text-warning/50'
                              : 'text-text-secondary'
                          }`}
                          onClick={() => field.onChange(star)}
                        />
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="images"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hình ảnh thực tế</FormLabel>
                  <FormControl>
                    <MultiUploader
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trải nghiệm của bạn</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Tuyệt vời, Rất hài lòng..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nội dung đánh giá</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..."
                      className="resize-none min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Đang gửi...' : 'Gửi đánh giá'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
