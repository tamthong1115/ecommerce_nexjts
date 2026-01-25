import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { DialogDescription } from '@radix-ui/react-dialog';
import { useTranslations } from 'next-intl';
import { CiCircleInfo } from 'react-icons/ci';

const ExplainDialog = ({ explain }: { explain: string }) => {
  const t = useTranslations('admin_explain');
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={'outline'}
          size={'icon-sm'}
          className="hover:cursor-pointer"
          type="button"
          onClick={(e) => e.stopPropagation()}
        >
          <CiCircleInfo />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="sm:max-w-[425px]">{explain}</PopoverContent>
    </Popover>
  );
};
export default ExplainDialog;
