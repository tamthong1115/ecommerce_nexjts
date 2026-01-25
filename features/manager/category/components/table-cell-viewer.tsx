'use client';
import { Button } from '@/components/ui/button';
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
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { handleDelete } from '@/features/manager/category/funcs/funcs';
import { fetchData } from '@/funcs/fetch';
import { putData } from '@/funcs/put';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { useIsMobile } from '@/hooks/use-mobile';
import { paths } from '@/lib/path';
import {
  categoryChildDetail,
  categoryDetail,
  categoryItemData,
} from '@/types/manager.data-types';
import { zodResolver } from '@hookform/resolvers/zod';
import { IconDotsVertical } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { IoIosArrowUp } from 'react-icons/io';
import { toast } from 'sonner';
import z from 'zod';

const formSchema = z.object({
  id: z.string(),
  name: z.string().min(1, {
    message: 'Name is required.',
  }),
  slug: z.string().min(1, {
    message: 'Slug is required.',
  }),
  isActive: z.enum(['true', 'false']),
  parentId: z.string().optional(),
  image: z
    .file()
    .min(1)
    .max(200 * 1024),
});

type FormSchemaType = z.infer<typeof formSchema>;

function TableCellViewer({
  item,
  setIsReset,
}: {
  item: categoryItemData;
  setIsReset: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const isMobile = useIsMobile();
  const [detail, setDetail] = React.useState<categoryDetail | null>(null);
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = React.useState<boolean>(false);
  const form = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: '',
      name: '',
      slug: '',
      isActive: 'false',
      parentId: '',
      image: undefined,
    },
  });
  const t = useTranslations('admin_category_page.category_drawer');
  const n = useTranslations('admin_notification');

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
      form.setValue('id', detail.id);
      form.setValue('name', detail.name);
      form.setValue('slug', detail.slug);
      form.setValue('isActive', detail.isActive === true ? 'true' : 'false');
      form.setValue('parentId', detail?.parentId || '');
    }
  }, [detail, form]);

  async function fetchDetail() {
    try {
      const res = await fetchData({
        baseUrl: paths.manager.warehouse.fetch_detail,
        params: { id: item.id },
        setData: undefined,
        cacheType: 'default',
      });
      // console.log(res);
      if (res.success) {
        setDetail(res.data);
      } else {
        toast(n('t_process_failed_noti'), {
          description: n(res.message),
        });
      }
    } catch (err) {
      console.error(err);
      toast(n('t_process_failed_noti'), {
        description: n('t_conn_failed_desc_noti'),
      });
    }
  }

  async function onSubmit(values: FormSchemaType) {
    try {
      const formData = new FormData();
      formData.append('id', values.id);
      formData.append('name', values.name);
      formData.append('slug', values.slug);
      formData.append('isActive', values.isActive);
      if (values.image && values.image instanceof File) {
        formData.append('image', values.image);
      }

      const data = await putData({
        url: paths.manager.category.update,
        body: formData,
        t: t,
      });
      if (data.status === 200) {
        toast(t('t_action_noti'), {
          description: t('t_update_desc_noti'),
        });
        setTimeout(() => {
          setOpen(false);
          setIsReset((prev) => !prev);
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to create category:', error);
      toast(t('t_action_failed_noti'), {
        description: t('t_update_failed_desc_noti'),
      });
    }
  }

  // 1. Watch the specific field so the component re-renders when a file is chosen
  const selectedFile = form.watch('image');

  // 2. Create a temporary preview URL if a file exists
  // Note: We check if 'selectedFile' is actually a File object to avoid errors
  const previewUrl = React.useMemo(() => {
    if (selectedFile instanceof File) {
      return URL.createObjectURL(selectedFile);
    }
    return null;
  }, [selectedFile]);

  const handleCopy = useCopyToClipboard({ t: t });

  const renderVariant = (index: number, value: categoryChildDetail) => {
    return (
      <div
        className={`w-full flex flex-col gap-4 
        ${openIndex === index ? 'max-h-[500px]' : 'max-h-0'}
        transition-[max-height] duration-300 ease-in-out
        overflow-hidden`}
        key={index}
      >
        <div className="flex flex-row justify-between items-center gap-4">
          <div className="flex flex-col gap-3">
            <Label htmlFor="name">{t('t_category_name')}</Label>
            <div className="w-full">{value.name}</div>
          </div>
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
                  onClick={() => handleCopy(value.id)}
                >
                  {t('t_copy_action')}
                </Button>
              </DropdownMenuItem>
              <Separator />
              <DropdownMenuItem className="flex justify-center items-center">
                <Button
                  variant={'destructive'}
                  className="text-left w-full"
                  onClick={() => {
                    handleDelete({
                      url: paths.manager.category.del_one(detail?.id),
                      setIsReset: setIsReset,
                      t,
                    });
                    setOpen(false);
                  }}
                >
                  {t('t_del_action')}
                </Button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <Label htmlFor="sku">URL-friendly</Label>
            <div className="w-full">{value.slug}</div>
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
          onClick={fetchDetail}
        >
          {item.name}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>{detail?.name || 'unknown'}</DrawerTitle>
          <DrawerDescription>{t('t_category_desc')}</DrawerDescription>
        </DrawerHeader>
        <div
          className="flex flex-col gap-4 overflow-y-auto px-4 text-sm"
          ref={scrollContainerRef}
        >
          <Form {...form}>
            <form
              id={'form-edit-category'}
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-4">
                <div className="grid gap-3">
                  <Label htmlFor="name-1">{t('t_category_name')}</Label>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="flex-1 ">
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="slug-1">URL-friendly</Label>
                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem className="flex-1 ">
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              {/* show icon and select box for active/inactive */}
              <div className="flex flex-row justify-between items-center">
                <div className="flex flex-col gap-3">
                  <Label htmlFor="visibility">{t('t_icon')}</Label>
                  <div className="flex flex-row gap-2 justify-start items-center">
                    {detail && detail.imageUrl !== null ? (
                      <Image
                        src={detail.imageUrl}
                        alt="icon"
                        width={30}
                        height={30}
                      />
                    ) : previewUrl ? (
                      <Image
                        src={previewUrl}
                        alt="icon"
                        width={30}
                        height={30}
                      />
                    ) : (
                      <p className="italic">{t('t_empty')}</p>
                    )}
                    <Button
                      type="button"
                      onClick={() =>
                        document.getElementById('input-image-file')?.click()
                      }
                    >
                      {previewUrl
                        ? t('t_change')
                        : detail?.imageUrl && detail?.imageUrl.length
                          ? t('t_change')
                          : t('t_add')}
                    </Button>

                    <FormField
                      control={form.control}
                      name="image"
                      render={({
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        field: { value, onChange, ...fieldProps },
                      }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              id="input-image-file"
                              {...fieldProps}
                              placeholder="Upload an image"
                              type="file"
                              accept="image/*"
                              onChange={(event) => {
                                onChange(
                                  event.target.files && event.target.files[0]
                                );
                              }}
                              hidden={true}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <Label htmlFor="visibility">{t('t_is_active')}</Label>
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex-1 ">
                        <FormControl>
                          <Select
                            {...field}
                            name="isActive"
                            defaultValue={field.value}
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <SelectTrigger
                              className="flex w-fit @4xl/main:hidden"
                              size="sm"
                              id="active-1"
                            >
                              <SelectValue
                                placeholder={t('t_is_active_placeholder')}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                <SelectItem value="true">
                                  {t('c_active')}
                                </SelectItem>
                                <SelectItem value="false">
                                  {t('c_inactive')}
                                </SelectItem>
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="w-full flex flex-col gap-3">
                  <Label htmlFor="target">{t('t_parent_category')}</Label>
                  {detail?.parent ? (
                    <div className="flex flex-row justify-between items-center gap-4">
                      <div className="flex flex-col gap-3">
                        <Label htmlFor="name">{t('t_category_name')}</Label>
                        <div className="w-full">{detail.name}</div>
                      </div>
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
                              onClick={() => handleCopy(detail.parent.id)}
                            >
                              {t('t_copy_action')}
                            </Button>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ) : (
                    <div className="italic">{t('t_no_parent')}</div>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="variants-list">{t('t_child_categories')}</Label>
                {detail?.children.length !== 0 ? (
                  <div className="flex flex-col  gap-4">
                    <ul className="w-full flex flex-col gap-2 ">
                      {detail?.children.map(
                        (value: categoryChildDetail, index) => (
                          <li
                            key={index}
                            id={`variant-item-${index}`}
                            className="flex flex-col gap-2"
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
                                  setOpenIndex(
                                    openIndex !== index ? index : null
                                  )
                                }
                                type="button"
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
                        )
                      )}
                    </ul>
                  </div>
                ) : (
                  <div>{t('t_no_child')}</div>
                )}
              </div>
            </form>
          </Form>
        </div>
        <DrawerFooter>
          <Button
            type="submit"
            form={'form-edit-category'}
            className="hover:cursor-pointer"
          >
            {t('t_submit_action')}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline" className="hover:cursor-pointer">
              {t('t_cancel_action')}
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

export default TableCellViewer;
