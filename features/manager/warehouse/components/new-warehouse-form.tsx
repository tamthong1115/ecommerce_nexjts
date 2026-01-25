'use client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { postData } from '@/funcs/post';
import { paths } from '@/lib/path';
import { zodResolver } from '@hookform/resolvers/zod';
import { IconPlus } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import React, {
  Dispatch,
  SetStateAction,
  startTransition,
  useEffect,
  useState,
} from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import z from 'zod';
import { CreateWarehouseResult } from '../warehouse.dto';
import {
  provinceResponse,
  districtResponse,
  wardResponse,
} from '@/types/customer.data-types';
import { fetchApi } from '@/lib/client-fetch';
import { env } from '@/lib/env';
import ExplainDialog from '../../_components/tool-tip';

export const NewWarehouseForm = ({
  setIsReset,
}: {
  setIsReset: Dispatch<SetStateAction<boolean>>;
}) => {
  const t = useTranslations('admin_warehouse_page.warehouse_new_form');
  const s = useTranslations('admin_warehouse_page.warehouse_schema');
  const n = useTranslations('admin_notification');

  const [open, setOpen] = useState<boolean>(false);
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
    name: z.string().min(1, { message: s('t_name_schema') }),
    street: z.string().min(1, { message: s('t_street_schema') }),
    ward: z.string().min(1, { message: s('t_ward_schema') }),
    district: z.string().min(1, {
      message: s('t_district_schema'),
    }),
    city: z.string().min(1, {
      message: s('t_city_schema'),
    }),
    region: z.string().nonempty(s('t_region_schema')),
    status: z.string().nonempty(s('t_status_schema')),
    totalStorageArea: z.string().nonempty(s('t_storage_size_schema')), // Giữ nguyên int
    totalSlot: z.string().nonempty(s('t_slot_size_schema')), // Giữ nguyên int
    size: z.string().nonempty(s('t_size_schema')),
  });
  type FormSchemaType = z.infer<typeof formSchema>;

  const form = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      street: '',
      ward: '',
      district: '',
      city: '',
      region: '',
      totalStorageArea: '',
      totalSlot: '',
      status: 'CLOSED',
      size: '',
    },
  });

  async function onSubmit(values: FormSchemaType) {
    if (
      isNaN(Number(values.totalSlot)) ||
      isNaN(Number(values.totalStorageArea)) ||
      isNaN(Number(values.size))
    ) {
      toast(n('t_action_noti'), {
        description: n('t_number_invalid'),
      });
    } else if (values.totalSlot < values.totalStorageArea) {
      toast(n('t_action_noti'), {
        description: n('t_slot_invalid'),
      });
    } else
      try {
        const formData = new FormData();
        formData.append('name', values.name);
        formData.append('street', values.street);
        formData.append('ward', ward);
        formData.append('district', district);
        formData.append('city', city);
        formData.append('region', values.region);
        formData.append('totalStorageArea', values.totalStorageArea.toString());
        formData.append('totalSlot', values.totalSlot.toString());
        formData.append('status', values.status);
        formData.append('size', values.size.toString());
        formData.append(
          'address',
          values.street +
            ', ' +
            values.ward +
            ', ' +
            values.district +
            ', ' +
            values.city
        );
        const data = await postData({
          url: paths.manager.warehouse.create,
          body: formData,
          contentType: undefined,
        });
        const res: CreateWarehouseResult = await data.json();
        console.log(res);
        if (res.success) {
          toast(n('t_action_noti'), {
            description: n('t_create_desc_noti'),
          });
          setTimeout(() => {
            setOpen(false);
            setIsReset((prev) => !prev);
          }, 1000);
        }
      } catch (error) {
        console.error('Failed to create category:', error);
        toast(n('t_action_failed_noti'), {
          description: n('t_create_failed_desc_noti'),
        });
      }
  }

  useEffect(() => {
    if (open) {
      const loadProvinces = async () => {
        try {
          // FIX 2: Pass the Array type to fetchApi
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

  const handleSelectCity = async (provinceName: string) => {
    setDistrictResponse(null);
    setWardResponse(null);

    // FIX 3: Find directly on the array (removed .data)
    const provinceCode = cityResponse?.find(
      (item) => item.name === provinceName
    );

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
  };

  const handleSelectDistrict = async (districtName: string) => {
    setWardResponse(null);

    // FIX 4: Find directly on the array (removed .data)
    const districtCode = districtResponse?.find(
      (item) => item.name === districtName
    );

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
  };

  const handleSelectWard = (wardName: string) => {
    const wardCode = wardResponse?.find((item) => item.name === wardName);
    if (wardCode)
      startTransition(() => {
        setward(wardCode?.code);
      });
  };

  // useEffect(() => {
  //   console.log('city', cityResponse);
  //   console.log('district', districtResponse);
  //   console.log('ward', wardResponse);
  // }, [cityResponse, wardResponse, districtResponse]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size={'sm'}
          onClick={() => form.reset()}
          className="hover:cursor-pointer"
        >
          <IconPlus />
          {t('t_new_button')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>{t('t_new_warehouse')}</DialogTitle>
              <DialogDescription>{t('t_desc')}</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 m-2">
              {/* field name */}
              <div className="grid gap-3">
                <Label htmlFor="name-1">{t('t_name')}</Label>
                <FormField
                  name="name"
                  render={({ field }) => (
                    <FormItem className="flex-1 ">
                      {' '}
                      <FormControl>
                        <Input {...field} className="" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {/* warehouse administrative unit */}
              <div className="grid grid-cols-2 grid-rows-2 gap-3">
                {/* select city */}
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
                            {/* FIX 5: Map directly over cityResponse (removed .data) */}
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
                {/* select district */}
                <div className="grid gap-3">
                  <FormField
                    name="district"
                    render={({ field }) => (
                      <FormItem className="grid gap-3">
                        <Label htmlFor="district">{t('t_district')}</Label>
                        <Select
                          name="district"
                          onValueChange={(value) => {
                            field.onChange(value); // Cập nhật giá trị vào form [cite: 65]
                            handleSelectDistrict(value); // Load danh sách quận huyện [cite: 26]
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
                              {/* FIX 6: Map directly over districtResponse (removed .data) */}
                              {districtResponse ? (
                                districtResponse.map((value, index) => (
                                  <SelectItem
                                    key={value.code + index}
                                    value={value.name}
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
                {/* select ward */}
                <div className="grid gap-3">
                  <FormField
                    name="ward"
                    render={({ field }) => (
                      <FormItem className="grid gap-3">
                        <Label htmlFor="ward">{t('t_ward')}</Label>
                        <Select
                          name="ward"
                          onValueChange={(value) => {
                            field.onChange(value); // Cập nhật giá trị vào form [cite: 65]
                            handleSelectWard(value);
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
                              {/* FIX 7: Map directly over wardResponse (removed .data) */}
                              {wardResponse ? (
                                wardResponse.map((value, index) => (
                                  <SelectItem
                                    key={value.code + index}
                                    value={value.name}
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
                {/* select region */}
                <div className="w-full grid gap-3">
                  <Label htmlFor="region">{t('t_region')}</Label>
                  <FormField
                    name="region"
                    render={({ field }) => (
                      <FormItem className="flex-1">
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
              {/* field street */}
              <div className="grid gap-3">
                <Label htmlFor="street">{t('t_street')}</Label>
                <FormField
                  name="street"
                  render={({ field }) => (
                    <FormItem className="flex-1 ">
                      <FormControl>
                        <Input {...field} className="" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="w-fit flex gap-3 flex-col">
                <Label htmlFor="active-1">{t('t_status')}</Label>
                <FormField
                  name="status"
                  render={({ field }) => (
                    <div className="flex flex-col justify-center items-start">
                      <FormItem className="flex flex-row justify-start items-center">
                        <FormControl className="">
                          <Input
                            {...field}
                            disabled={true}
                            className="hover:cursor-not-allowed w-fit"
                          />
                        </FormControl>
                        <ExplainDialog explain={t('t_explain')} />
                      </FormItem>
                      <FormMessage />
                    </div>
                  )}
                />
              </div>
              {/* warehouse spetifications */}
              <div className="w-full flex flex-row gap-3">
                <div className="">
                  <div className="grid gap-3">
                    <Label htmlFor="totalStorageArea">
                      {t('t_storage_size')}
                    </Label>
                    <FormField
                      name="totalStorageArea"
                      render={({ field }) => (
                        <FormItem className="flex-1 ">
                          <FormControl>
                            <Input {...field} className="" type="text" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                <div className="">
                  <div className="grid gap-3">
                    <Label htmlFor="totalSlot">{t('t_slot_size')}</Label>
                    <FormField
                      name="totalSlot"
                      render={({ field }) => (
                        <FormItem className="flex-1 ">
                          <FormControl>
                            <Input {...field} className="" type="text" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
              <div className="">
                <div className="grid gap-3">
                  <Label htmlFor="size">
                    {t('t_warehouse_size') + '(m2)'}{' '}
                  </Label>
                  <FormField
                    name="size"
                    render={({ field }) => (
                      <FormItem className="flex-1 ">
                        <FormControl>
                          <Input
                            {...field}
                            className=""
                            type="text"
                            placeholder="0.0"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button
                  variant="outline"
                  onClick={() => form.reset()}
                  className="hover:cursor-pointer"
                >
                  {t('t_cancel_action')}
                </Button>
              </DialogClose>
              <Button type="submit" className="hover:cursor-pointer">
                {t('t_submit_action')}
              </Button>
            </DialogFooter>
          </form>
          {/* <pre>{JSON.stringify(form.formState.errors, null, 2)}</pre> */}
        </Form>
      </DialogContent>
    </Dialog>
  );
};
