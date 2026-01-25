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
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { fetchData } from '@/funcs/fetch';
import { patchData } from '@/funcs/patch';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { useIsMobile } from '@/hooks/use-mobile';
import { fetchApi } from '@/lib/client-fetch';
import { paths } from '@/lib/path';
import {
  provinceResponse,
  districtResponse,
  wardResponse,
} from '@/types/customer.data-types';
import {
  storageAreaDetail,
  warehouseData,
  warehouseDetail,
} from '@/types/manager.data-types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import React, {
  startTransition,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { useForm } from 'react-hook-form';
import { IoIosArrowUp } from 'react-icons/io';
import { MdOutlineCopyAll } from 'react-icons/md';
import { toast } from 'sonner';
import z from 'zod';
import { env } from '@/lib/env';
import { Loading } from '@/components/loading';
import ExplainDialog from '../../_components/tool-tip';

interface WarehouseFormData {
  id: string;
  name: string;
  street: string;
  ward: string;
  district: string;
  city: string;
  region: string;
  size: number;
  totalStorageArea: number;
  totalSlot: number;
  status: string;
  storageArea: Array<{
    id: string;
    name: string;
    type: string;
    status: string;
    totalSlots: number;
    totalRows: number;
    totalFloors: number;
  }>;
}

export function TableCellViewer({
  item,
  setIsReset,
}: {
  item: warehouseData;
  setIsReset: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const isMobile = useIsMobile();
  const [detail, setDetail] = React.useState<warehouseDetail | null>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = React.useState<boolean>(false);
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);

  const t = useTranslations('admin_warehouse_page.warehouse_drawer');
  const n = useTranslations('admin_notification');
  const s = useTranslations('admin_warehouse_page.warehouse_schema');
  const handleCopy = useCopyToClipboard({ t: n });

  //storing administrative unit
  const [cityResponse, setCityResponse] = useState<
    provinceResponse['data'] | null
  >(null);
  const [districtResponse, setDistrictResponse] = useState<
    districtResponse['data'] | null
  >(null);
  const [wardResponse, setWardResponse] = useState<wardResponse['data'] | null>(
    null
  );
  const [city, setCity] = useState<string>('');
  const [district, setDistrict] = useState<string>('');
  const [ward, setward] = useState<string>('');

  const formSchema = z.object({
    id: z.string(),
    name: z.string().min(1, {
      message: s('t_name_schema'),
    }),
    street: z.string().min(1, { message: s('t_street_schema') }),
    ward: z.string().min(1, { message: s('t_ward_schema') }),
    district: z.string().min(1, {
      message: s('t_district_schema'),
    }),
    city: z.string().min(1, {
      message: s('t_city_schema'),
    }),
    // Sử dụng coerce để tự động chuyển string từ input sang number
    size: z.preprocess(
      (val) => {
        const num = Number(val);
        return isNaN(num) ? undefined : num;
      },
      z.number().min(1, {
        message: s('t_size_schema'),
      })
    ),
    totalStorageArea: z.preprocess(
      (val) => {
        const num = Number(val);
        return isNaN(num) ? undefined : num;
      },
      z.number().min(1, {
        message: s('t_storage_size_schema'),
      })
    ),
    totalSlot: z.preprocess(
      (val) => {
        const num = Number(val);
        return isNaN(num) ? undefined : num;
      },
      z.number().min(1, {
        message: s('t_slot_size_schema'),
      })
    ),
    region: z.string().min(1, {
      message: s('t_region_schema'),
    }),
    status: z.string().min(1, {
      message: s('t_status_schema'),
    }),
    // Định nghĩa mảng storageArea theo interface
    storageArea: z.array(
      z.object({
        id: z.string(),
        name: z.string().min(1, {
          message: s('t_name_schema'),
        }),
        type: z.string().min(1, {
          message: s('t_type_schema'),
        }),
        status: z.string().min(1, {
          message: s('t_status_schema'),
        }),
        totalSlots: z.preprocess(
          (val) => {
            const num = Number(val);
            return isNaN(num) ? undefined : num;
          },
          z.number().min(1, {
            message: s('t_slot_size_schema'),
          })
        ),
        totalRows: z.preprocess(
          (val) => {
            const num = Number(val);
            return isNaN(num) ? undefined : num;
          },
          z.number().min(1, {
            message: s('t_row_size_schema'),
          })
        ),
        totalFloors: z.preprocess(
          (val) => {
            const num = Number(val);
            return isNaN(num) ? undefined : num;
          },
          z.number().min(1, {
            message: s('t_floor_size_schema'),
          })
        ),
      })
    ),
  });

  type FormSchemaType = z.infer<typeof formSchema>;
  const form = useForm<WarehouseFormData>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      id: '',
      name: '',
      street: '',
      ward: '',
      district: '',
      city: '',
      region: '',
      totalStorageArea: 1,
      totalSlot: 1,
      status: '',
      size: 1,
      storageArea: [],
    },
  });

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

  const handleSubmit = async (values: FormSchemaType) => {
    // if (
    //   isNaN(Number(values.totalSlot)) ||
    //   isNaN(Number(values.totalStorageArea)) ||
    //   isNaN(Number(values.size))
    // ) {
    //   toast(n('t_action_noti'), {
    //     description: n('t_number_invalid'),
    //   });
    //   return;
    // }
    if (values.totalSlot < values.totalStorageArea) {
      toast(n('t_action_noti'), {
        description: n('t_slot_invalid'),
      });
      return;
    }

    // check validation of storageArea array
    // values.storageArea.forEach((item, index) => {
    //   if (
    //     isNaN(Number(item.totalSlots)) ||
    //     isNaN(Number(item.totalRows)) ||
    //     isNaN(Number(item.totalFloors))
    //   ) {
    //     toast(n('t_action_noti'), {
    //       description: n('t_number_invalid'),
    //     });
    //     return;
    //   }
    // });

    try {
      const formData = new FormData();
      formData.append('id', values.id);
      formData.append('name', values.name);
      formData.append('street', values.street);
      formData.append('ward', ward);
      formData.append('district', district);
      formData.append('city', city);
      formData.append('region', values.region);
      formData.append('size', values.size.toString());
      formData.append('totalStorageArea', values.totalStorageArea.toString());
      formData.append('totalSlot', values.totalSlot.toString());
      formData.append('status', values.status);
      formData.append('storageArea', JSON.stringify(values.storageArea));
      formData.append(
        'address',
        values.street +
          ', ' +
          values.ward +
          ', ' +
          values.district +
          ' ,' +
          values.city
      );

      const data = await patchData({
        url: paths.manager.warehouse.update,
        body: formData,
        t: t,
      });
      if (data.status === 200) {
        toast(n('t_action_noti'), {
          description: n('t_update_desc_noti'),
        });
        setTimeout(() => {
          setOpen(false);
          setIsReset((prev) => !prev);
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to update warehouse:', error);
      toast(n('t_action_failed_noti'), {
        description: n('t_update_failed_desc_noti'),
      });
    }
  };

  const renderVariant = (index: number, value: storageAreaDetail) => {
    const filedName = `storageArea.${index}` as const;
    return (
      <div
        className={`w-full flex flex-col gap-4 
        ${openIndex === index ? 'max-h-[500px]' : 'max-h-0'}
        transition-[max-height] duration-300 ease-in-out
        overflow-hidden`}
        key={index}
      >
        <div className="flex flex-col gap-3">
          <Label htmlFor={`${filedName}.name`}>{t('t_storage_name')}</Label>
          <FormField
            name={`${filedName}.name`}
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input
                    {...field}
                    defaultValue={value.name}
                    placeholder={t('t_storage_name')}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {/* type and status storage */}
        <div className="grid grid-rows-1 grid-cols-2 gap-2">
          <div className="flex flex-col gap-3">
            <Label htmlFor={`${filedName}.type`}>{t('t_storage_type')}</Label>
            <FormField
              name={`${filedName}.type`}
              render={({ field }) => (
                <FormItem className="flex-1">
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('t_type')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="GENERAL_STORAGE">
                        {t('c_general')}
                      </SelectItem>
                      <SelectItem value="COLD_STORAGE">
                        {t('c_cold')}
                      </SelectItem>
                      <SelectItem value="ELECTRICAL_EQUIPMENT">
                        {t('c_electrical')}
                      </SelectItem>
                      <SelectItem value="DRY_STORAGE">{t('c_dry')}</SelectItem>
                      <SelectItem value="HAZARDOUS_MATERIALS">
                        {t('c_hazardous')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="flex flex-col gap-3">
            <Label htmlFor={`${filedName}.status`}>
              {t('t_storage_status')}
            </Label>
            <FormField
              name={`${filedName}.status`}
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input
                      {...field}
                      defaultValue={value.status}
                      placeholder={t('t_storage_status')}
                      disabled={true}
                    />
                  </FormControl>
                  <ExplainDialog explain={t('t_explain')} />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        {/* Storage specification for storing */}
        <div className="grid gap-3">
          <Label htmlFor="specification">{t('t_specifications')}</Label>
          <div className="grid grid-rows-1 grid-cols-3 gap-3">
            <div className="grid gap-3">
              <Label htmlFor={`${filedName}.totalSlots`}>
                {t('c_total_slots')}
              </Label>
              <FormField
                name={`${filedName}.totalSlots`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t('c_total_slots')}
                        type="number"
                        min={1}
                        step={1}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor={`${filedName}.totalRows`}>
                {t('c_total_rows')}
              </Label>
              <FormField
                name={`${filedName}.totalRows`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t('c_total_rows')}
                        type="number"
                        min={1}
                        step={1}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor={`${filedName}.totalFloors`}>
                {t('c_total_floors')}
              </Label>
              <FormField
                name={`${filedName}.totalFloors`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t('c_total_floors')}
                        type="number"
                        min={1}
                        step={1}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>
        <Separator />
      </div>
    );
  };

  //handle administrative unit
  const handleSelectCity = useCallback(
    async (provinceName: string) => {
      setDistrictResponse(null);
      setWardResponse(null);

      const provinceCode = cityResponse?.find(
        (item) => item.name === provinceName
      );

      console.log('district res:', provinceCode);

      if (provinceCode) {
        startTransition(() => {
          setCity(provinceCode.code);
        });
        try {
          const res = await fetchApi<districtResponse['data']>(
            `${env.NEXT_PUBLIC_ADDRESS_BASE_URL}/api/v1/provinces/${provinceCode.code}/districts`,
            { params: { limit: 100 } }
          );
          if (res.success && res.data) setDistrictResponse(res.data);
        } catch (error) {
          console.error('Failed to load districts', error);
        }
      }
    },
    [cityResponse]
  );

  const handleSelectDistrict = useCallback(
    async (districtName: string) => {
      setWardResponse(null);

      const districtCode = districtResponse?.find(
        (item) => item.name === districtName
      );
      console.log(districtCode);
      if (districtCode) {
        startTransition(() => {
          setDistrict(districtCode.code);
        });
        try {
          const res = await fetchApi<wardResponse['data']>(
            `${env.NEXT_PUBLIC_ADDRESS_BASE_URL}/api/v1/districts/${districtCode.code}/wards`,
            { params: { limit: 100 } }
          );
          if (res.success && res.data) setWardResponse(res.data);
        } catch (error) {
          console.error('Failed to load wards', error);
        }
      }
    },
    [districtResponse]
  );

  const handleSelectWard = useCallback(
    (wardName: string) => {
      const wardCode = wardResponse?.find((item) => item.name === wardName);
      if (wardCode)
        startTransition(() => {
          setward(wardCode?.code);
        });
    },
    [wardResponse]
  );

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
      const arrAdministrative = detail.address.split(', ');
      console.log(arrAdministrative);
      form.reset({
        id: detail.id,
        name: detail.name,
        street: detail.street,
        ward: arrAdministrative[arrAdministrative.length - 3],
        district: arrAdministrative[arrAdministrative.length - 2],
        city: arrAdministrative[arrAdministrative.length - 1],
        region: detail.region,
        size: detail.size,
        totalStorageArea: detail.totalStorageArea,
        totalSlot: detail.totalSlot,
        status: detail.status,
        storageArea: detail.storageArea,
      });
    }
  }, [detail, form]);

  useEffect(() => {
    if (open) {
      const loadProvinces = async () => {
        try {
          const res = await fetchApi<provinceResponse['data']>(
            `${env.NEXT_PUBLIC_ADDRESS_BASE_URL}/api/v1/provinces`,
            { params: { limit: 63 } }
          );
          if (res.success && res.data) setCityResponse(res.data);
        } catch (error) {
          console.error('Failed to load provinces', error);
        }
      };

      loadProvinces();
    }
  }, [open]);

  useEffect(() => {
    if (cityResponse) {
      const load = async () => {
        await handleSelectCity(form.getValues('city'));
      };
      load();
    }
  }, [cityResponse, form, handleSelectCity]);

  useEffect(() => {
    if (districtResponse) {
      const load = async () => {
        await handleSelectDistrict(form.getValues('district'));
      };
      load();
    }
  }, [cityResponse, districtResponse, form, handleSelectDistrict]);

  useEffect(() => {
    if (wardResponse) {
      handleSelectWard(form.getValues('ward'));
    }
  }, [cityResponse, form, handleSelectWard, wardResponse]);

  useEffect(() => {
    console.log('city', cityResponse);
    console.log('district', districtResponse);
    console.log('ward', wardResponse);
  }, [cityResponse, wardResponse, districtResponse]);

  if ((!districtResponse || !wardResponse || !cityResponse) && open)
    return <Loading />;

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
      <DrawerContent className="min-w-[425px]">
        <DrawerHeader className="gap-1">
          <DrawerTitle>{detail?.name || 'unknown'}</DrawerTitle>
          <DrawerDescription>{t('t_warehouse_desc')}</DrawerDescription>
        </DrawerHeader>
        <div
          className="flex flex-col gap-4 overflow-y-auto px-4 text-sm"
          ref={scrollContainerRef}
        >
          <Form {...form}>
            <form
              id="form-edit-warehouse"
              className="flex flex-col gap-4"
              onSubmit={form.handleSubmit(handleSubmit)}
            >
              <div className="flex flex-col gap-3">
                {/* Basic Information */}
                <div className="grid gap-3">
                  <Label htmlFor="name">{t('t_name')}</Label>
                  <FormField
                    name="name"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input {...field} placeholder={t('t_name')} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                {/* Warehouse ID */}
                <div className="flex flex-col gap-3">
                  <Label htmlFor="warehouseId">{t('t_warehouse_id')}</Label>
                  <div className="flex flex-row justify-between items-center gap-2">
                    <p className="font-mono text-sm">{detail?.id || item.id}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      onClick={() => handleCopy(detail?.id || item.id)}
                    >
                      <MdOutlineCopyAll />
                    </Button>
                  </div>
                </div>

                {/* Address Information + administrative unit*/}
                <div className="grid grid-cols-1 grid-rows-2 gap-3">
                  <Label>{t('t_address')}</Label>
                  <div className="">
                    <FormField
                      name="street"
                      render={({ field }) => (
                        <FormItem>
                          <Label htmlFor="street">{t('t_street')}</Label>
                          <FormControl>
                            <Input {...field} placeholder={t('t_street')} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 grid-rows-1 gap-3">
                    <div className="grid gap-3">
                      <FormField
                        name="city"
                        render={({ field }) => (
                          <FormItem className="grid gap-3">
                            <Label htmlFor="city">{t('t_city')}</Label>
                            <Select
                              name="city"
                              onValueChange={(value) => {
                                field.onChange(value); // Cập nhật giá trị vào form
                                handleSelectCity(value); // Load danh sách quận huyện
                              }}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t('t_city')} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="shadow shadow-primary rounded-lg bg-background">
                                <SelectGroup className="max-h-[200px] overflow-y-scroll">
                                  {cityResponse ? (
                                    cityResponse.map((value, index) => (
                                      <SelectItem
                                        key={value.code + index}
                                        value={value.name}
                                        className="text-nowrap w-full"
                                      >
                                        {value.name}
                                      </SelectItem>
                                    ))
                                  ) : (
                                    <SelectLabel>{t('t_empty')}</SelectLabel>
                                  )}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        name="district"
                        render={({ field }) => (
                          <FormItem className="grid gap-3">
                            <Label htmlFor="district">{t('t_district')}</Label>
                            <Select
                              name="district"
                              onValueChange={(value) => {
                                field.onChange(value); // Cập nhật giá trị vào form
                                handleSelectDistrict(value); // Load danh sách quận huyện
                              }}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t('t_district')} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="shadow shadow-primary rounded-lg bg-background">
                                <SelectGroup className="max-h-[200px] overflow-y-scroll">
                                  {districtResponse ? (
                                    districtResponse.map((value, index) => (
                                      <SelectItem
                                        key={value.code + index}
                                        value={value.name}
                                        className="text-nowrap w-full"
                                      >
                                        {value.name}
                                      </SelectItem>
                                    ))
                                  ) : (
                                    <SelectLabel>{t('t_empty')}</SelectLabel>
                                  )}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid gap-3">
                      <FormField
                        name="ward"
                        render={({ field }) => (
                          <FormItem className="grid gap-3">
                            <Label htmlFor="ward">{t('t_ward')}</Label>
                            <Select
                              name="ward"
                              onValueChange={(value) => {
                                field.onChange(value); // Cập nhật giá trị vào form
                                handleSelectWard(value); // Load danh sách quận huyện
                              }}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t('t_ward')} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="shadow shadow-primary rounded-lg bg-background">
                                <SelectGroup className="max-h-[200px] overflow-y-scroll">
                                  {wardResponse ? (
                                    wardResponse.map((value, index) => (
                                      <SelectItem
                                        key={value.code + index}
                                        value={value.name}
                                        className="text-nowrap w-full"
                                      >
                                        {value.name}
                                      </SelectItem>
                                    ))
                                  ) : (
                                    <SelectLabel>{t('t_empty')}</SelectLabel>
                                  )}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        name="region"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <Label htmlFor="ward">{t('t_region')}</Label>
                            <FormControl>
                              <Select
                                {...field}
                                name="region"
                                defaultValue={field.value}
                                onValueChange={field.onChange}
                                value={field.value}
                              >
                                <SelectTrigger
                                  className="flex w-fit @4xl/main:hidden"
                                  size="sm"
                                  id="active-1"
                                >
                                  <SelectValue placeholder={t('t_region')} />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectGroup>
                                    <SelectItem
                                      value="NORTHERN_REGION"
                                      className="hover:cursor-pointer"
                                    >
                                      {t('c_north')}
                                    </SelectItem>
                                    <SelectItem
                                      value="CENTRAL_REGION"
                                      className="hover:cursor-pointer"
                                    >
                                      {t('c_central')}
                                    </SelectItem>
                                    <SelectItem
                                      value="SOURTHERN_REGION"
                                      className="hover:cursor-pointer"
                                    >
                                      {t('c_sourth')}
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
                </div>

                {/* Warehouse Specifications */}
                <div className="grid grid-cols-1 grid-rows-2 gap-3">
                  <Label>{t('t_specifications')}</Label>
                  <FormField
                    name="size"
                    render={({ field }) => (
                      <FormItem>
                        <Label htmlFor="size">{t('t_size')}</Label>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={t('t_size_placeholder')}
                            type="number"
                            min={0.1}
                            step={0.1}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      name="totalStorageArea"
                      render={({ field }) => (
                        <FormItem>
                          <Label htmlFor="totalStorageArea">
                            {t('t_total_storage_area')}
                          </Label>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder={t('t_total_storage_area')}
                              type="number"
                              min={1}
                              step={1}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      name="totalSlot"
                      render={({ field }) => (
                        <FormItem>
                          <Label htmlFor="totalSlot">{t('t_total_slot')}</Label>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder={t('t_total_slot')}
                              type="number"
                              min={1}
                              step={1}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Status */}
                <div className="grid grid-cols-1 grid-rows-2 gap-3">
                  <Label>{t('t_status')}</Label>
                  <FormField
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <Label htmlFor="status">{t('t_status')}</Label>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('t_status')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="READY">
                              {t('c_ready')}
                            </SelectItem>
                            <SelectItem value="CLOSED">
                              {t('c_closed')}
                            </SelectItem>
                            <SelectItem value="FULL">{t('c_full')}</SelectItem>
                            <SelectItem value="UNDER_MAINTENANCE">
                              {t('c_maintenance')}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Storage Areas */}
                <div className="flex flex-col gap-3">
                  <Label>{t('t_storage_areas')}</Label>
                  <div className="flex flex-col  gap-4">
                    <ul className="w-full flex flex-col gap-2 ">
                      {detail?.storageArea.map(
                        (value: storageAreaDetail, index) => (
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
                        )
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </form>
          </Form>
        </div>
        <DrawerFooter>
          <Button
            type="submit"
            form="form-edit-warehouse"
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
