'use client';

import * as React from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { fetchApi } from '@/lib/client-fetch';
import { useEffect } from 'react';
import { formatPrice } from '@/lib/utils';
import { paths } from '@/lib/path';

const chartConfig = {
  totalOrders: {
    label: 'Total Orders',
    color: 'var(--primary)',
  },
  revenue: {
    label: 'Revenue',
    color: 'var(--info)',
  },
} satisfies ChartConfig;

interface OrderStatsProps {
  shopId?: string;
}
interface ShopItem {
  id: string;
  name: string;
}

interface StatItem {
  date: string;
  totalOrders: number;
  revenue: number;
}

export function ChartAreaInteractiveSeller({
  shopId: initialShopId,
}: OrderStatsProps) {
  const [timeRange, setTimeRange] = React.useState<string>('90d');
  const [data, setData] = React.useState<StatItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [shops, setShops] = React.useState<ShopItem[]>([]);
  const [selectedShopId, setSelectedShopId] = React.useState<string>(
    () => initialShopId ?? 'all'
  );

  // Fetch Shops
  useEffect(() => {
    let mounted = true;
    async function fetchShops() {
      try {
        const res = await fetchApi(paths.seller.shops.api.fetch_all);
        if (!res.success) throw new Error('Failed to load shops');
        const list = (res.data ?? []) as ShopItem[];
        if (!mounted) return;
        setShops(list ?? []);
        if (initialShopId) setSelectedShopId(initialShopId);
      } catch (err) {
        console.error(err);
        if (mounted) setShops([]);
      }
    }
    fetchShops();
    return () => {
      mounted = false;
    };
  }, [initialShopId]);

  // Fetch Stats
  useEffect(() => {
    let mounted = true;
    async function fetchStats() {
      setLoading(true);
      try {
        const days = parseInt(timeRange);

        const params = new URLSearchParams({ days: String(days) });

        if (selectedShopId && selectedShopId !== 'all') {
          params.set('shopId', selectedShopId);
        }

        const res = await fetchApi(
          `/api/seller/order-stats?${params.toString()}`
        );
        if (!res.success) throw new Error('Failed to load stats');
        const stats = (res.data ?? []) as StatItem[];

        if (!mounted) return;
        setData(stats ?? []);
      } catch (err) {
        console.error(err);
        if (mounted) setData([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchStats();
    return () => {
      mounted = false;
    };
  }, [timeRange, selectedShopId]);

  const totalOrders = data.reduce((s, i) => s + (i?.totalOrders ?? 0), 0);
  const totalRevenue = data.reduce((s, i) => s + (i?.revenue ?? 0), 0);

  const selectedShopName =
    selectedShopId === 'all'
      ? 'All shops'
      : (shops.find((s) => s.id === selectedShopId)?.name ?? 'Selected shop');

  return (
    <Card className="@container/card">
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
          <div>
            <CardTitle>Total Orders</CardTitle>
            <CardDescription>
              {selectedShopName} • {totalOrders} orders •{' '}
              {formatPrice(totalRevenue)}
            </CardDescription>
          </div>
          <CardAction className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Shop Selector */}
            <Select
              value={selectedShopId}
              onValueChange={(val) => setSelectedShopId(val)}
            >
              <SelectTrigger size="sm" className="w-full sm:w-48">
                <SelectValue placeholder="All shops" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value={'all'} className="rounded-lg">
                  All shops
                </SelectItem>
                {shops.map((s) => (
                  <SelectItem key={s.id} value={s.id} className="rounded-lg">
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Time Range Selector */}
            <Select value={timeRange} onValueChange={(v) => setTimeRange(v)}>
              <SelectTrigger
                className="w-full sm:w-40"
                size="sm"
                aria-label="Select time range"
              >
                <SelectValue placeholder="Last 3 months" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="3d" className="rounded-lg">
                  Last 3 days
                </SelectItem>
                <SelectItem value="7d" className="rounded-lg">
                  Last 7 days
                </SelectItem>
                <SelectItem value="30d" className="rounded-lg">
                  Last 30 days
                </SelectItem>
                <SelectItem value="90d" className="rounded-lg">
                  Last 3 months
                </SelectItem>
                <SelectItem value="180d" className="rounded-lg">
                  Last 6 months
                </SelectItem>
                <SelectItem value="365d" className="rounded-lg">
                  Last Year
                </SelectItem>
              </SelectContent>
            </Select>
          </CardAction>
        </div>
      </CardHeader>

      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          {loading ? (
            <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">
              Loading...
            </div>
          ) : data.length === 0 ? (
            <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">
              No data found for this period.
            </div>
          ) : (
            <AreaChart data={data}>
              <defs>
                <linearGradient id="fillOrders" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-totalOrders)"
                    stopOpacity={0.4}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-totalOrders)"
                    stopOpacity={0}
                  />
                </linearGradient>
                <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-revenue)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-revenue)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  });
                }}
              />
              <YAxis yAxisId="left" orientation="left" hide />
              <YAxis yAxisId="right" orientation="right" hide />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Area
                yAxisId="left"
                dataKey="revenue"
                type="natural"
                fill="url(#fillRevenue)"
                stroke="var(--color-revenue)"
                stackId="a"
              />
              <Area
                yAxisId="right"
                dataKey="totalOrders"
                type="natural"
                fill="url(#fillOrders)"
                stroke="var(--color-totalOrders)"
                strokeWidth={2}
                stackId="b"
              />
            </AreaChart>
          )}
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
