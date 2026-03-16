'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import React from 'react';
import { useRouter } from 'next/navigation';
import { DrawerDetailsViewer } from '@/features/shared/components/table/drawer-details-viewer';

type SellerShopListItem = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logoUrl?: string | null;
  coverUrl?: string | null;
  status: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  ratingAvg: number;
  ratingCount: number;
  createdAt: string;
  updatedAt: string;
};

export function TableCellViewerSeller({ item }: { item: SellerShopListItem }) {
  const router = useRouter();

  const trigger = (
    <Button variant="link" className="text-foreground w-fit px-0 text-left">
      {item.name}
    </Button>
  );

  const footerAction = (
    <Button onClick={() => router.push(`/seller/shops/${item.id}/edit`)}>
      Edit Shop
    </Button>
  );

  return (
    <DrawerDetailsViewer
      title={item.name}
      description="Shop Details"
      trigger={trigger}
      footerAction={footerAction}
    >
      <div className="w-full flex justify-center items-center mb-3">
        <div className="w-full relative">
          {item.coverUrl && (
            <Image
              src={item.coverUrl}
              alt="shop cover"
              width={0}
              height={0}
              sizes="100vw"
              className="w-full h-32 object-cover rounded-lg"
            />
          )}
          <div className="absolute left-5 -bottom-5">
            <Avatar className="w-16 h-16 border-4 border-white">
              <AvatarImage src={item.logoUrl || ''} alt={item.name} />
              <AvatarFallback>{item.name[0]}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 mt-6">
        <Label>Status</Label>
        <Badge
          variant={item.status === 'ACTIVE' ? 'default' : 'secondary'}
          className="w-fit"
        >
          {item.status}
        </Badge>
      </div>

      <div className="flex flex-col gap-3">
        <Label>Slug</Label>
        <p className="text-muted-foreground">{item.slug}</p>
      </div>

      {item.description && (
        <div className="flex flex-col gap-3">
          <Label>Description</Label>
          <p className="text-muted-foreground">{item.description}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-3">
          <Label>Contact Email</Label>
          <p className="text-muted-foreground text-sm">
            {item.contactEmail || '—'}
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Label>Contact Phone</Label>
          <p className="text-muted-foreground text-sm">
            {item.contactPhone || '—'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-3">
          <Label>Rating</Label>
          <p className="text-muted-foreground">
            {item.ratingAvg.toFixed(1)} ({item.ratingCount})
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Label>Created</Label>
          <p className="text-muted-foreground text-sm">
            {new Date(item.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </DrawerDetailsViewer>
  );
}
