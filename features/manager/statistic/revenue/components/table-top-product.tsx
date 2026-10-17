'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { TableCell, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import TabTableView from '@/features/manager/_components/tab-table-view';
import { ExportExcelButton } from '@/features/shared/components/table/export-excel-button';
import { fetchData } from '@/funcs/fetch';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { useIsMobile } from '@/hooks/use-mobile';
import { paths } from '@/lib/path';
import { formatDay, formatPrice } from '@/lib/utils';
import {
  productDataResponse,
  productDetail,
  productItemData,
  variantDetail,
} from '@/types/manager.data-types';
import {
  DragEndEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  UniqueIdentifier,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  IconChevronDown,
  IconDotsVertical,
  IconLayoutColumns,
} from '@tabler/icons-react';
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  Row,
  SortingState,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import { BsThreeDotsVertical } from 'react-icons/bs';
import { IoIosArrowUp } from 'react-icons/io';
import { toast } from 'sonner';

const TableTopProduct = () => {
  const [data, setData] = React.useState<productDataResponse | null>(null);
  const [productList, setProductList] = React.useState<productItemData[]>([]);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => productList?.map(({ id }) => id) || [],
    [productList]
  );

  const t = useTranslations('admin_statistic_page.table_top_product');
  const c = useTranslations('general');

  // useEffect(() => {
  //   console.log(data);
  // }, [data]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setProductList((data) => {
        const oldIndex = dataIds.indexOf(active.id);
        const newIndex = dataIds.indexOf(over.id);
        return arrayMove(data, oldIndex, newIndex);
      });
    }
  }

  const sortableId = React.useId();
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  );

  const handleCopy = useCopyToClipboard({ t: t });

  const columns: ColumnDef<productItemData>[] = [
    {
      accessorKey: t('t_product_name'),
      header: t('t_product_name'),
      cell: ({ row }) => {
        return <TableCellViewer item={row.original} />;
      },
      enableHiding: false,
    },
    {
      accessorKey: t('t_shop'),
      header: t('t_shop'),
      cell: ({ row }) => (
        <div className="w-full flex flex-row gap-2 justify-start items-center">
          <Avatar>
            <AvatarImage src={row.original.shop.logoUrl} alt="shopLogo" />
            <AvatarFallback>UK</AvatarFallback>
          </Avatar>
          <div>{row.original.shop.name}</div>
        </div>
      ),
    },
    {
      accessorKey: t('t_sold'),
      header: () => <div className="w-fit text-right">{t('t_sold')}</div>,
      cell: ({ row }) => (
        <div className="w-full text-right">
          {row.original.soldCount.toString()}
        </div>
      ),
    },
    {
      accessorKey: t('t_created_at'),
      header: t('t_created_at'),
      cell: ({ row }) => {
        return <div className="w-32">{formatDay(row.original.createdAt)}</div>;
      },
    },
    {
      accessorKey: t('t_updated_at'),
      header: t('t_updated_at'),
      cell: ({ row }) => {
        return <div className="w-32">{formatDay(row.original.updatedAt)}</div>;
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
              size="icon"
            >
              <IconDotsVertical />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            <DropdownMenuItem className="flex justify-center items-center">
              <Button
                variant={'ghost'}
                className="text-left"
                onClick={() => handleCopy(row.original.id)}
              >
                {t('t_copy_action')}
              </Button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const table = useReactTable({
    data: productList,
    columns,
    state: {
      sorting,
      columnVisibility,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  function TableCellViewer({ item }: { item: productItemData }) {
    const [open, setOpen] = useState<boolean>(false);
    const isMobile = useIsMobile();
    const [detail, setDetail] = React.useState<productDetail | null>(null);
    const [openIndex, setOpenIndex] = React.useState<number | null>(null);
    const scrollContainerRef = React.useRef<HTMLDivElement | null>(null);
    const [defaultVisibility, setDefaultVisibility] =
      React.useState<string>('');

    // This effect runs when 'openIndex' changes
    useEffect(() => {
      // Only run if an item was OPENED
      if (openIndex !== null) {
        // We must wait for your 300ms animation to finish
        const timer = setTimeout(() => {
          const container = scrollContainerRef.current;

          // Find the specific <li> element we want to scroll to
          const element = document.getElementById(`variant-item-${openIndex}`);

          if (container && element) {
            // This calculates the <li>'s position *inside* the scroll container
            const scrollToPosition = element.offsetTop - container.offsetTop;

            // Scroll the container to the element
            container.scrollTo({
              top: scrollToPosition,
              behavior: 'smooth',
            });
          }
        }, 300); // 300ms matches your animation

        // Clean up the timer
        return () => clearTimeout(timer);
      }
    }, [openIndex]);

    useEffect(() => {
      if (detail) {
        setDefaultVisibility(detail.visibility);
      }
    }, [detail]);

    async function fetchDetail() {
      try {
        const response = await fetchData({
          baseUrl: paths.manager.product.fetch_detail,
          params: { id: item.id },
          setData: undefined,
        });
        if (response) {
          //console.log(detail.data);
          setDetail(response.data);
        }
      } catch (err) {
        console.error(err);
      }
    }

    const renderVariant = (index: number, value: variantDetail) => {
      return (
        <div
          className={`w-full flex flex-col gap-4 
      ${openIndex === index ? 'max-h-[500px]' : 'max-h-0'}
      transition-[max-height] duration-300 ease-in-out
      overflow-hidden`}
          key={index}
        >
          <div className="w-full flex justify-center items-center">
            <Image
              src={value.image}
              alt={value.image || index.toString()}
              width={500}
              height={500}
              className="w-[50%]"
            />
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="name">{t('t_product_name')}</Label>
              <div className="w-full">{value.name}</div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="sku">{t('t_sku_code')}</Label>
              <div className="w-full">{value.sku}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="price">{t('t_price')}</Label>
              <div>
                {formatPrice(Number(value.price), {
                  currency: c('t_currency'),
                  rate: Number(c('t_rate')),
                })}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="currency-variant">{t('t_currency')}</Label>
              <div>{value.currency}</div>
            </div>
          </div>
          <Separator />
        </div>
      );
    };

    return (
      <Drawer
        direction={isMobile ? 'bottom' : 'right'}
        open={open}
        onOpenChange={setOpen}
      >
        <DrawerTrigger asChild>
          <Button
            variant="link"
            className="text-foreground w-fit px-0 text-left hover:cursor-pointer"
            onClick={() => {
              fetchDetail();
            }}
          >
            {item.title}
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader className="gap-1">
            <DrawerTitle>{detail?.title || 'unknown'}</DrawerTitle>
            <DrawerDescription>{t('t_product_desc')}</DrawerDescription>
          </DrawerHeader>
          <div
            className="flex flex-col gap-4 overflow-y-auto px-4 text-sm"
            ref={scrollContainerRef}
          >
            <form className="flex flex-col gap-4">
              <div className="w-full flex justify-center items-center">
                <Carousel className="w-[70%] max-w-lg">
                  <CarouselContent>
                    {detail?.images?.map((img, index) => (
                      <CarouselItem key={index}>
                        <div className="p-1">
                          <Card className="w-full h-64 overflow-hidden">
                            <CardContent className="relative w-full h-full p-0">
                              <Image
                                src={img.url}
                                alt={img.alt || `Product image ${index + 1}`}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, 500px"
                                priority={index === 0}
                              />
                            </CardContent>
                          </Card>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="hover:cursor-pointer" />
                  <CarouselNext className="hover:cursor-pointer" />
                </Carousel>
              </div>

              <div className="flex flex-col gap-3">
                <Label htmlFor="shop">{t('t_shop')}</Label>
                <div className="w-full flex flex-row justify-between items-center gap-2">
                  <div className="flex flex-row justify-start items-center gap-2">
                    <Avatar>
                      <AvatarImage src={detail?.shop.logoUrl} alt="shopLogo" />
                      <AvatarFallback>UK</AvatarFallback>
                    </Avatar>
                    <p>{detail?.shop.name}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant={'outline'}
                        className="hover:cursor-pointer"
                      >
                        <BsThreeDotsVertical />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem
                        className="hover:cursor-pointer"
                        onClick={() =>
                          window.open(`/shop/${detail?.shop.slug}`, '_blank')
                        }
                      >
                        {t('t_watch_shop')}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="hover:cursor-pointer">
                        {t('t_copy_action')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-3">
                  <Label htmlFor="title">{t('t_product_name')}</Label>
                  <div className="w-full">{detail?.title}</div>
                </div>
                <div className="flex flex-col gap-3">
                  <Label htmlFor="status">URL-friendly</Label>
                  <div className="flex flex-col gap-3">
                    <div className="w-full">{detail?.slug}</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-3">
                  <Label htmlFor="target">{t('t_origin')}</Label>
                  <div>{detail?.origin}</div>
                </div>
                <div className="flex flex-col gap-3">
                  <Label htmlFor="limit">{t('t_currency')}</Label>
                  <div>{detail?.currency}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-3">
                  <Label htmlFor="target">{t('t_min_price')}</Label>
                  <div>
                    {formatPrice(Number(detail?.minPrice), {
                      currency: c('t_currency'),
                      rate: Number(c('t_rate')),
                    })}
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <Label htmlFor="limit">{t('t_max_price')}</Label>
                  <div>
                    {formatPrice(Number(detail?.maxPrice), {
                      currency: c('t_currency'),
                      rate: Number(c('t_rate')),
                    })}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Label htmlFor="visibility">{t('t_visibility')}</Label>
                <Select value={defaultVisibility}>
                  <SelectTrigger
                    id="visibility"
                    className="w-full hover:cursor-pointer"
                  >
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      value="UNLISTED"
                      className="hover:cursor-pointer"
                    >
                      {t('c_public')}
                    </SelectItem>
                    <SelectItem
                      value="PRIVATE"
                      className="hover:cursor-pointer"
                    >
                      {t('c_private')}
                    </SelectItem>
                    <SelectItem value="PUBLIC" className="hover:cursor-pointer">
                      {t('c_unlisted')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-3">
                <Label htmlFor="type">{t('t_desc')}</Label>
                <textarea defaultValue={detail?.description || ''} />
              </div>

              <div className="flex flex-col gap-3">
                <Label htmlFor="variants-list">{t('t_variant')}</Label>
                <div className="flex flex-col  gap-4">
                  <ul className="w-full flex flex-col gap-2 ">
                    {detail?.variants.map((value: variantDetail, index) => (
                      <li
                        id={`variant-item-${index}`}
                        className="flex flex-col gap-2"
                        key={value.id || index}
                      >
                        <div className="w-full flex flex-row justify-between items-center">
                          <div className="flex flex-row justify-start items-center gap-2">
                            <p>
                              {index + 1}
                              {'. '}
                            </p>
                            <p>{value.name}</p>
                          </div>
                          <Button
                            variant={'outline'}
                            onClick={() =>
                              setOpenIndex(openIndex !== index ? index : null)
                            }
                            type="button"
                            className="hover:cursor-pointer"
                          >
                            <div
                              className={`${
                                openIndex !== index
                                  ? `transform-[rotate(180deg)]`
                                  : `transform-[rotate(0deg)]`
                              } transition ease-in-out`}
                            >
                              <IoIosArrowUp />
                            </div>
                          </Button>
                        </div>

                        {renderVariant(index, value)}

                        <Separator />
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </form>
          </div>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline" className="hover:cursor-pointer">
                Done
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  function DraggableRow({ row }: { row: Row<productItemData> }) {
    const { transform, transition, setNodeRef, isDragging } = useSortable({
      id: row.original.id,
    });

    return (
      <TableRow
        data-state={row.getIsSelected() && 'selected'}
        data-dragging={isDragging}
        ref={setNodeRef}
        className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
        style={{
          transform: CSS.Transform.toString(transform),
          transition: transition,
        }}
      >
        {row.getVisibleCells().map((cell) => (
          <TableCell key={cell.id}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        ))}
      </TableRow>
    );
  }

  return (
    <div className="w-full h-full p-3 flex flex-col justify-start items-center">
      <Tabs
        defaultValue="all-status"
        className="w-full flex-col justify-start gap-6"
      >
        <div className="flex items-center justify-between px-4 lg:px-6">
          <Label htmlFor="view-selector" className="sr-only">
            View
          </Label>
          <div className="flex items-center gap-2">
            <ExportExcelButton
              table={table}
              filename="doanh-thu-top-san-pham.xlsx"
              sheetName="Top Sản phẩm"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <IconLayoutColumns />
                  <span className="hidden lg:inline">{t('t_showing')}</span>
                  <span className="lg:hidden">{t('t_column')}</span>
                  <IconChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {table
                  .getAllColumns()
                  .filter(
                    (column) =>
                      typeof column.accessorFn !== 'undefined' &&
                      column.getCanHide()
                  )
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <TabsContent
          value="all-status"
          className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
        >
          <TabTableView<productItemData>
            filter="PUBLIC"
            baseUrl={paths.manager.product.fetch_all}
            sensors={sensors}
            sortableId={sortableId}
            table={table}
            columns={columns}
            data={data}
            setData={setData}
            list={productList}
            setList={setProductList}
            dataIds={dataIds}
            DraggableRow={DraggableRow}
            handleDragEnd={handleDragEnd}
            isReset={false}
            isFalse={false}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TableTopProduct;
