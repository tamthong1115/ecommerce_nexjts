import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/with-auth';
import { disableVoucherService } from '@/features/voucher/services/voucher.service';
import { prisma } from '@/lib/db';
import * as authLib from '@/lib/auth';

vi.mock('@/lib/auth', () => ({
  getSessionUser: vi.fn(),
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock('@/lib/db', () => ({
  prisma: {
    voucher: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe('P0 Security Vulnerabilities & Fixes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('withAdmin route guard', () => {
    it('returns 401 when user is not authenticated', async () => {
      vi.mocked(authLib.getSessionUser).mockResolvedValue(null as any);

      const handler = vi.fn().mockResolvedValue(NextResponse.json({ ok: true }));
      const wrapped = withAdmin(handler);
      const req = new NextRequest('http://localhost:3000/api/manager/shop');

      const response = await wrapped(req);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.code).toBe(401);
      expect(handler).not.toHaveBeenCalled();
    });

    it('returns 403 when authenticated user is not an admin', async () => {
      vi.mocked(authLib.getSessionUser).mockResolvedValue({
        user: { id: 'user-1', role: 'user', email: 'user@test.com' },
        session: { id: 's-1' },
      } as any);

      const handler = vi.fn().mockResolvedValue(NextResponse.json({ ok: true }));
      const wrapped = withAdmin(handler);
      const req = new NextRequest('http://localhost:3000/api/manager/shop');

      const response = await wrapped(req);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.code).toBe(403);
      expect(handler).not.toHaveBeenCalled();
    });

    it('calls handler successfully when user has admin role', async () => {
      vi.mocked(authLib.getSessionUser).mockResolvedValue({
        user: { id: 'admin-1', role: 'admin', email: 'admin@test.com' },
        session: { id: 's-2' },
      } as any);

      const handler = vi.fn().mockResolvedValue(NextResponse.json({ ok: true }));
      const wrapped = withAdmin(handler);
      const req = new NextRequest('http://localhost:3000/api/manager/shop');

      const response = await wrapped(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(handler).toHaveBeenCalledWith('admin-1', req);
    });
  });

  describe('disableVoucherService permission check', () => {
    it('rejects non-admin from disabling platform voucher (shopId is null)', async () => {
      vi.mocked(prisma.voucher.findUnique).mockResolvedValue({
        id: 'v-system',
        shopId: null,
        shop: null,
      } as any);

      await expect(
        disableVoucherService('v-system', 'regular-user-id', false)
      ).rejects.toThrow('You do not have permission to disable platform vouchers');
    });

    it('allows admin to disable platform voucher', async () => {
      vi.mocked(prisma.voucher.findUnique).mockResolvedValue({
        id: 'v-system',
        shopId: null,
        shop: null,
      } as any);
      vi.mocked(prisma.voucher.update).mockResolvedValue({
        id: 'v-system',
        isActive: false,
      } as any);

      const result = await disableVoucherService('v-system', 'admin-id', true);
      expect(result.success).toBe(true);
      expect(prisma.voucher.update).toHaveBeenCalledWith({
        where: { id: 'v-system' },
        data: { isActive: false },
      });
    });

    it('rejects user who is not a member of the shop from disabling shop voucher', async () => {
      vi.mocked(prisma.voucher.findUnique).mockResolvedValue({
        id: 'v-shop-1',
        shopId: 'shop-1',
        shop: {
          id: 'shop-1',
          members: [],
        },
      } as any);

      await expect(
        disableVoucherService('v-shop-1', 'attacker-id', false)
      ).rejects.toThrow('You do not have permission to disable this shop voucher');
    });
  });
});
