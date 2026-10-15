'use client';

import { useMemo, useState } from 'react';
import { DataTablePage } from '@/features/shared/components/table/data-table-page';
import { useTableController } from '@/features/shared/hooks/use-table-controller';
import { getActionLogColumns } from '@/features/manager/logs/components/action-log-columns';
import { ActionLogDetailDialog } from '@/features/manager/logs/components/action-log-detail-dialog';
import { ActionLogItem } from '@/features/manager/logs/services/action-log.service';
import { paths } from '@/lib/path';

const LOG_TABS = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'CREATE', label: 'Tạo mới' },
  { value: 'UPDATE', label: 'Cập nhật' },
  { value: 'DELETE', label: 'Xóa' },
  { value: 'RESTORE', label: 'Khôi phục' },
  { value: 'EXECUTE', label: 'Tác vụ / Mail' },
];

export default function ManagerLogsPage() {
  const [activeTab, setActiveTab] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState<ActionLogItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const handleViewDetail = (log: ActionLogItem) => {
    setSelectedLog(log);
    setIsDetailOpen(true);
  };

  const columns = useMemo(
    () => getActionLogColumns({ onViewDetail: handleViewDetail }),
    []
  );

  const extraParams = useMemo(
    () => ({
      actionType: activeTab !== 'ALL' ? activeTab : undefined,
    }),
    [activeTab]
  );

  const list = useTableController<ActionLogItem>({
    endpoint: paths.manager.logs.fetch_all,
    columns,
    extraParams,
    defaultLimit: 10,
    getRowId: (row) => row.id,
  });

  return (
    <div className="w-full flex flex-col gap-4">
      <DataTablePage
        title="Nhật ký thao tác hệ thống"
        controller={list}
        search={{
          placeholder: 'Tìm theo mã, bảng, IP hoặc người thực hiện...',
        }}
        tabs={{
          items: LOG_TABS,
          value: activeTab,
          onChange: setActiveTab,
        }}
        exportExcel={{
          filename: 'system-audit-logs.xlsx',
          sheetName: 'AuditLogs',
        }}
        emptyMessage="Không tìm thấy nhật ký thao tác nào."
      />

      <ActionLogDetailDialog
        log={selectedLog}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      />
    </div>
  );
}
