import { SectionCards } from '@/features/manager/_components/section-cards';
import { ChartAreaInteractive } from './components/chart-area-interactive';
import TableTopProduct from './components/table-top-product';

export default function ManagerDashboardPage() {
  return (
    <div className="flex flex-col gap-3 mt-3">
      <SectionCards />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive />
      </div>
      <TableTopProduct />
    </div>
  );
}
