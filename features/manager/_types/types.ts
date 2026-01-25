import { useTranslations } from 'next-intl';

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export interface UseColumnsProps {
  t: ReturnType<typeof useTranslations>;
  g: ReturnType<typeof useTranslations>;
  n: ReturnType<typeof useTranslations>;
  setIsReset: React.Dispatch<React.SetStateAction<boolean>>;
  handleCopy: (id: string) => void;
}
