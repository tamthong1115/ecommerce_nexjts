'use client';

import { AddressCard } from '@/features/account/components/table-address';
import {
  createAddress,
  getAddress,
} from '@/features/account/address/address.action';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { fetchApi } from '@/lib/client-fetch';
import { env } from '@/lib/env';
import {
  districtResponse,
  provinceResponse,
  wardResponse,
} from '@/types/customer.data-types';
import { AddressDTO } from '@/features/account/address/address.dto';
import { SelectContent, SelectGroup } from '@radix-ui/react-select';
import { MapPin, MapPinX, MapPlus } from 'lucide-react';
import { useActionState, useEffect, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';

type FormState = {
  success: boolean;
  message?: string;
  newAddress?: AddressDTO;
};

const initialState: FormState = {
  success: false,
  message: '',
};

export default function AddressPage() {
  const t = useTranslations('customer.address');
  const [address, setAddress] = useState<AddressDTO[]>([]);
  const [isPendingTransition, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const searchParams = useSearchParams();
  const callBackUrl = searchParams.get('callbackUrl');
  const route = useRouter();

  // FIX 1: The state should hold the Array (data property of the response type)
  // We use indexed access types ['data'] to get the array type from the wrapper
  const [cityResponse, setCityResponse] = useState<
    provinceResponse['data'] | null
  >(null);
  const [districtResponse, setDistrictResponse] = useState<
    districtResponse['data'] | null
  >(null);
  const [wardResponse, setWardResponse] = useState<wardResponse['data'] | null>(
    null
  );

  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    async (prevState, formData) => {
      const rawData = {
        phone: formData.get('phone'),
        line1: formData.get('line1'),
        ward: formData.get('ward'),
        district: formData.get('district'),
        city: formData.get('city'),
        country: formData.get('country'),
      };
      formData.set('data', JSON.stringify(rawData));

      try {
        const res = await createAddress(formData);

        if (res.success) {
          toast.success(t('toast_create_success'));
          if (callBackUrl) {
            route.push(decodeURIComponent(callBackUrl));
          }
          return { success: true, newAddress: res.data };
        } else {
          toast.error(res.message || t('toast_create_failed'));
          return { success: false, message: res.message };
        }
      } catch (err: any) {
        toast.error(t('toast_create_failed'));
        return { success: false, message: err.message };
      }
    },
    initialState
  );

  useEffect(() => {
    startTransition(async () => {
      const res = await getAddress();
      if (res?.success && res.data) setAddress(res.data);
    });

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
  }, []);

  const handleSelectCity = async (provinceName: string) => {
    setDistrictResponse(null);
    setWardResponse(null);

    // FIX 3: Find directly on the array (removed .data)
    const provinceCode = cityResponse?.find(
      (item) => item.name === provinceName
    );

    if (provinceCode) {
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

  useEffect(() => {
    if (state.success) {
      setDialogOpen(false);
      setDistrictResponse(null);
      setWardResponse(null);

      if (state.newAddress) {
        setAddress((prev) => [state.newAddress!, ...prev]);
      } else {
        startTransition(async () => {
          const res = await getAddress();
          if (res?.success && res.data) setAddress(res.data);
        });
      }
    }
  }, [state.success, state.newAddress]);

  const handleDefaultChanged = (newDefaultId: string) => {
    setAddress((prevAddresses) =>
      prevAddresses.map((addr) => ({
        ...addr,
        isDefault: addr.id === newDefaultId,
      }))
    );
  };

  const renderAddressList = () => {
    if (isPendingTransition) {
      return <p className="text-center mt-10">{t('loading')}</p>;
    }

    if (address.length === 0) {
      return (
        <div className="mt-12 flex flex-col items-center gap-4 text-muted-foreground">
          <MapPinX className="w-12 h-12 opacity-50" />
          <p className="text-xl font-medium">{t('empty')}</p>
        </div>
      );
    }

    return (
      <div className="mt-6 grid gap-4">
        {address.map((addr) => (
          <AddressCard
            key={addr.id}
            address={addr}
            onSuccess={() => handleDefaultChanged(addr.id)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="p-4 w-full min-h-fit">
      <div className="w-full flex justify-between items-center gap-6">
        <div className="flex items-center gap-3 px-5 py-2 bg-linear-90 from-primary/90 to-chart-3/90 rounded-xl shadow-lg w-fit">
          <MapPin className="w-6 h-6 text-background" />
          <h2 className="text-xl md:text-2xl font-medium text-background">
            {t('title')}
          </h2>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" variant="outline">
              <MapPlus className="w-6 h-6" />
              <p>{t('add_new')}</p>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form action={formAction}>
              <DialogHeader>
                <DialogTitle>{t('modal_title')}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 mt-2">
                <div className="grid gap-3">
                  <Label htmlFor="phone">{t('phone')}</Label>
                  <Input id="phone" name="phone" />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="line1">{t('line1')}</Label>
                  <Input id="line1" name="line1" required />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="city">{t('city')}</Label>
                  <Select
                    name="city"
                    required={true}
                    onValueChange={(value) => handleSelectCity(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('t_city_placeholder')} />
                    </SelectTrigger>
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
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="district">{t('district')}</Label>
                  <Select
                    name="district"
                    required={true}
                    disabled={!districtResponse}
                    onValueChange={(value) => handleSelectDistrict(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('t_district_placeholder')} />
                    </SelectTrigger>
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
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="ward">{t('ward')}</Label>
                  <Select name="ward" required={true} disabled={!wardResponse}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('t_ward_placeholder')} />
                    </SelectTrigger>
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
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="country">{t('country')}</Label>
                  <Input
                    id="country"
                    name="country"
                    defaultValue={t('country_default')}
                    readOnly
                  />
                </div>
              </div>
              <DialogFooter className="mt-2">
                <DialogClose asChild>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    {t('cancel')}
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={isPending}>
                  {isPending ? t('saving') : t('save')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {renderAddressList()}
    </div>
  );
}
