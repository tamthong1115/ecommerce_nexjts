# Shared Table & Dynamic Excel Documentation

Tài liệu hướng dẫn sử dụng hệ thống bảng dữ liệu (`DataTable`), phân trang (Client-side & Server-side), và tính năng xuất dữ liệu Excel động (Dynamic Excel Export) trong dự án.

---

## 1. Kiến trúc tổng quan

Hệ sinh thái Table được đặt tại `features/shared/` và liên kết với backend Excel tại `lib/excel/`:

```
features/shared/
├── components/table/
│   ├── data-table-page.tsx       # Layout trang chuẩn (Title, Search, Tabs, Export Excel, Column Toggle, Table)
│   ├── data-table.tsx            # Bảng đơn giản (Body, Header, Dnd Context)
│   ├── sortable-table.tsx        # Bảng tích hợp kéo thả sắp xếp + phân trang tích hợp
│   ├── data-table-pagination.tsx # Thanh điều khiển phân trang độc lập
│   ├── draggable-table-row.tsx   # Row kéo thả dùng dnd-kit
│   └── table-columns.tsx         # Helper cột (Drag handle, Checkbox select)
├── hooks/
│   ├── use-data-table.ts         # Hook TanStack Table (hỗ trợ cả Client & Server pagination)
│   └── use-server-table-query.ts # Hook đồng bộ phân trang & filter với URL search params
└── utils/
    └── export-table-to-excel.ts  # Tiện ích export động TanStack Table sang file Excel .xlsx
```

---

## 2. Phân trang Table: Client-side vs Server-side

### Khi nào dùng Client-side Pagination?
* Tập dữ liệu nhỏ hoặc vừa (< 500 bản ghi), đã được tải toàn bộ về client.
* Cần tìm kiếm và lọc tức thì (instant filter/search) trên bộ nhớ trình duyệt mà không cần gọi lại API.

### Khi nào dùng Server-side Pagination?
* Danh sách lớn hoặc tăng trưởng theo thời gian (Đơn hàng, Sản phẩm, Khách hàng, Giao dịch thanh toán).
* Cần tối ưu băng thông mạng, tài nguyên bộ nhớ client và bảo mật (chỉ trả về đúng số dòng theo trang).
* Cần chia sẻ URL có query string (`?page=2&limit=20`) để khi người dùng refresh hoặc gửi link vẫn giữ nguyên vị trí.

---

## 3. Hướng dẫn sử dụng `useDataTable`

### A. Chế độ Client-side (Mặc định)
```tsx
'use client';

import { useDataTable } from '@/features/shared/hooks/use-data-table';
import { DataTable } from '@/features/shared/components/table/data-table';
import { DataTablePagination } from '@/features/shared/components/table/data-table-pagination';

export function ProductListClient({ products }) {
  const { table } = useDataTable({
    data: products,
    columns,
    // manualPagination mặc định là false -> client-side pagination
  });

  return (
    <div>
      <DataTable table={table} columnsLength={columns.length} />
      <DataTablePagination table={table} />
    </div>
  );
}
```

### B. Chuẩn tạo trang danh sách nhanh với `useTableController` (Khuyên dùng)
Gom toàn bộ việc gọi API, đồng bộ URL Search Params, phân trang Server, và quản lý TanStack Table vào một hook duy nhất:

```tsx
'use client';

import { useTableController } from '@/features/shared/hooks/use-table-controller';
import { DataTablePage } from '@/features/shared/components/table/data-table-page';
import { orderColumns } from './_components/columns';
import { Button } from '@/components/ui/button';

export function OrderListPage() {
  const list = useTableController({
    endpoint: '/api/seller/orders',
    columns: orderColumns,
  });

  return (
    <DataTablePage
      title="Quản lý Đơn hàng"
      controller={list}
      actions={<Button>Tạo đơn hàng</Button>}
      exportExcel={{ filename: 'danh-sach-don-hang.xlsx' }}
    />
  );
}
```

### C. Chế độ Server-side thủ công (Manual Pagination + Custom Data)
Khi trang có logic fetch dữ liệu đặc thù không dùng qua endpoint tự động:

```tsx
'use client';

import { useServerTableQuery } from '@/features/shared/hooks/use-server-table-query';
import { useDataTable } from '@/features/shared/hooks/use-data-table';
import { DataTablePage } from '@/features/shared/components/table/data-table-page';

export function OrderListServer({ initialOrders, totalPages, totalCount }) {
  const { pagination, onPaginationChange, setParam } = useServerTableQuery({
    defaultPage: 1,
    defaultLimit: 10,
  });

  const { table } = useDataTable({
    data: initialOrders,
    columns,
    manualPagination: true,
    pageCount: totalPages,
    pagination,
    onPaginationChange,
  });

  return (
    <DataTablePage
      title="Quản lý Đơn hàng"
      table={table}
      totalRows={totalCount}
      search={{ onChange: (val) => setParam('search', val) }}
      enableExportExcel={true}
      exportFilename="danh-sach-don-hang.xlsx"
    />
  );
}
```

---

## 4. Xuất Excel động theo Content (Dynamic Excel Export)

### A. Cơ chế hoạt động
Hệ thống cho phép xuất file `.xlsx` dựa trên nội dung thực tế đang hiển thị trên bảng:
1. **Tự động lọc các cột ẩn/hiển thị**: Trích xuất từ `table.getVisibleFlatColumns()`. Các cột kỹ thuật UI (`select`, `drag`, `actions`, `reorder`) sẽ tự động được loại trừ.
2. **Tự động gán nhãn Header thân thiện**: Nếu cột có header text (hoặc title) sẽ dùng nhãn đó ("Tên sản phẩm", "Tổng tiền", v.v.) thay vì tên trường DB thô (`productName`, `totalPrice`).
3. **Tự động nội suy kiểu dữ liệu**: Nhận diện `Date`, `Number`, `Boolean`, `Text` để format ô Excel chính xác.
4. **Tự động căn chỉnh độ rộng cột**: Tính toán `columnWidths` theo độ dài tiêu đề và giá trị dòng.
5. **Định dạng giao diện Excel**: Áp dụng Header in đậm, nền xám thanh lịch (`#F1F5F9`), kẻ viền `thin` tiêu chuẩn.

### B. Sử dụng trực tiếp trong `DataTablePage`
Chỉ cần truyền prop `enableExportExcel={true}`:

```tsx
<DataTablePage
  title="Sản phẩm"
  data={products}
  table={table}
  columns={columns}
  enableExportExcel={true}
  exportFilename="san-pham-shop.xlsx"
/>
```
Nút **"Export Excel"** sẽ tự động xuất hiện cạnh menu chọn ẩn/hiển thị cột (Columns toggle).

### C. Sử dụng hàm lập trình độc lập (`exportTableToExcel`)
Nếu muốn kích hoạt xuất Excel từ bất kỳ nút bấm hoặc sự kiện nào:

```tsx
import { exportTableToExcel } from '@/features/shared/utils/export-table-to-excel';

// Trong event handler:
const handleDownload = async () => {
  await exportTableToExcel(table, {
    filename: 'bao-cao-thang.xlsx',
    sheetName: 'Danh sách',
    // Tùy chọn:
    excludeColumnIds: ['select', 'actions'],
    onlySelectedRows: true, // Chỉ xuất các dòng đang được tick chọn (nếu có)
    exportAllPages: true,   // Xuất toàn bộ filtered rows thay vì chỉ trang hiện tại
  });
};
```

---

```

---

## 5. API Reference & Props

### A. Props của `DataTablePage` (Business-First):
| Prop | Kiểu | Mặc định | Ý nghĩa nghiệp vụ |
| :--- | :--- | :--- | :--- |
| `title` | `string` | **bắt buộc** | Tiêu đề trang danh sách |
| `table` | `TanstackTable<TData>` | **bắt buộc** | Instance bảng (đã chứa sẵn data, columns, pagination) |
| `loading` | `boolean` | `false` | Trạng thái đang tải |
| `error` | `string \| null` | `null` | Thông báo lỗi nếu có |
| `emptyMessage` | `ReactNode` | `'No results found.'` | Giao diện hiển thị khi không có dữ liệu |
| `actions` | `ReactNode` | `undefined` | Nút bấm thao tác (ví dụ: nút "Tạo mới") |
| `search` | `string \| SearchConfig` | `undefined` | Chuỗi placeholder hoặc config `{ value, onChange, placeholder, debounceMs }` |
| `tabs` | `TabConfig[] \| TabsConfig`| `[]` | Danh sách tab phân loại nghiệp vụ (Hỗ trợ cả Server & Client tab) |
| `reorder` | `ReorderConfig` | `undefined` | Cấu hình kéo thả `{ onReorder: (activeId, overId) => void }` |
| `exportExcel` | `boolean \| ExportExcelConfig` | `undefined` | Bật xuất Excel `{ filename, sheetName }` |
| `bulkActions` | `(selectedRows, table) => ReactNode` | `undefined` | Thanh thao tác hàng loạt khi tick chọn nhiều dòng (Xóa, Xuất, ...) |
| `totalRows` | `number` | `undefined` | Tổng số bản ghi (dành cho Server-side pagination) |
| `options` | `DataTableOptions` | `{}` | Tùy chỉnh chi tiết: `{ hideToolbar, hideColumnToggle, hideSearch, className }` |

### B. Options của `useDataTable`:
| Option | Kiểu | Mặc định | Mô tả |
| :--- | :--- | :--- | :--- |
| `data` | `TData[]` | **bắt buộc** | Dữ liệu nạp vào bảng |
| `columns` | `ColumnDef<TData, TValue>[]` | **bắt buộc** | Định nghĩa các cột |
| `manualPagination` | `boolean` | `false` | Bật phân trang phía server (bỏ chia trang client) |
| `pageCount` | `number` | `undefined` | Tổng số trang nhận từ backend API |
| `pagination` | `PaginationState` | `undefined` | Trạng thái trang controlled `{ pageIndex, pageSize }` |
| `onPaginationChange` | `OnChangeFn<PaginationState>` | `undefined` | Callback khi đổi trang hoặc pageSize |
| `manualSorting` | `boolean` | `false` | Bật sắp xếp phía server |
| `manualFiltering` | `boolean` | `false` | Bật lọc phía server |
| `initialPageSize` | `number` | `10` | Kích thước trang mặc định |
| `getRowId` | `(row: TData) => string` | `undefined` | Hàm lấy khóa định danh dòng |

