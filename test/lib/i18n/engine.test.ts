import { describe, expect, it, beforeEach, vi } from 'vitest';
import { deepSet } from '@/lib/i18n/build';
import { validateTranslationValue } from '@/lib/i18n/validate';

vi.mock('@/lib/db', () => ({
  prisma: {
    glossaryTerm: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
}));

describe('lib/i18n core engine', () => {
  describe('deepSet', () => {
    it('sets nested properties properly', () => {
      const obj: any = {};
      deepSet(obj, ['a', 'b', 'c'], 'hello');
      expect(obj.a.b.c).toBe('hello');
    });

    it('overrides existing values without destroying siblings', () => {
      const obj: any = { user: { name: 'Alice', age: 30 } };
      deepSet(obj, ['user', 'name'], 'Bob');
      expect(obj.user.name).toBe('Bob');
      expect(obj.user.age).toBe(30);
    });
  });

  describe('validateTranslationValue', () => {
    it('detects empty strings', async () => {
      const res = await validateTranslationValue({ locale: 'vi', value: '   ' });
      expect(res.valid).toBe(false);
      expect(res.errors[0]).toContain('cannot be empty');
    });

    it('flags forbidden raw HTML tags', async () => {
      const res = await validateTranslationValue({
        locale: 'vi',
        value: 'Click <script>alert(1)</script> here',
      });
      expect(res.valid).toBe(false);
      expect(res.errors[0]).toContain('Raw HTML tag');
    });

    it('allows safe inline HTML tags', async () => {
      const res = await validateTranslationValue({
        locale: 'vi',
        value: 'Welcome <b>John</b> to our platform!',
      });
      expect(res.valid).toBe(true);
      expect(res.errors).toHaveLength(0);
    });

    it('validates placeholder presence', async () => {
      const res = await validateTranslationValue({
        locale: 'vi',
        value: 'Hello {name}',
        params: ['name', 'count'],
      });
      expect(res.valid).toBe(false);
      expect(res.errors[0]).toContain('{count}');
    });

    it('enforces maxLength for buttons and labels', async () => {
      const res = await validateTranslationValue({
        locale: 'vi',
        value: 'This is an exceedingly long label text that exceeds the UI threshold',
        kind: 'BUTTON',
      });
      expect(res.valid).toBe(false);
      expect(res.errors[0]).toContain('exceeds maximum limit');
    });
  });
});
