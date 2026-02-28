import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CreateVoucherInput } from '@/features/voucher/validation';
import { createVoucher } from '@/features/voucher/hooks/voucher.client';
import { toast } from 'sonner';

interface UseCreateVoucherProps {
  onSuccess?: () => void;
}

export function useCreateVoucher({ onSuccess }: UseCreateVoucherProps = {}) {
  const query = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateVoucherInput) => createVoucher(data),
    onSuccess: (res) => {
      if (res.success) {
        toast.success(res.message || 'Tạo voucher thành công');
        query.invalidateQueries({ queryKey: ['vouchers'] });
        onSuccess?.();
      } else {
        toast.error(res.message || 'Tạo voucher thất bại');
      }
    },
    onError: (err) => {
      toast.error('Lỗi kết nối đến máy chủ');
      console.error(err);
    },
  });
}
