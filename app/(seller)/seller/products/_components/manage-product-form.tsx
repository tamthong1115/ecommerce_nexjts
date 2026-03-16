'use client';

import * as React from 'react';
import { FormProvider, useForm, FieldPath } from 'react-hook-form';
import { ManageProductFormInput } from './productSchema';
import ProductGeneralInfo from './product-general-info-step';
import ProductImagesStep from './product-images-step';
import VariantsStep from './product-variants-step';
import ProductTagsStep from './product-tags-step';
import { manageProductSchema } from './productSchema';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { CheckCircle2 } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Currency, ProductStatus, Visibility } from '@/lib/generated/prisma';
import { toast } from 'sonner';

type Props = {
  product?: ManageProductFormInput;
  onSubmit: (productData: ManageProductFormInput) => void;
  isLoading?: boolean;
};

const STEPS = [
  { label: 'General Info', key: 'General' },
  { label: 'Images', key: 'Images' },
  { label: 'Variants', key: 'Variants' },
  { label: 'Tags', key: 'Tags' },
] as const;

export default function ManageProductForm({
  product,
  onSubmit,
  isLoading,
}: Props) {
  const [step, setStep] = React.useState<number>(0);
  const [isNavigating, setIsNavigating] = React.useState(false);

  const formMethods = useForm<ManageProductFormInput>({
    mode: 'all',
    resolver: zodResolver(manageProductSchema) as any,
    defaultValues: product
      ? {
          title: product.title,
          slug: product.slug,
          origin: product.origin,
          description: product.description,
          status: product.status as ManageProductFormInput['status'],
          visibility:
            product.visibility as ManageProductFormInput['visibility'],
          attributes: product.attributes,
          categoryId: product.categoryId,
          currency: product.currency as ManageProductFormInput['currency'],
          shopId: product.shopId,
          images: product.images ?? [],
          variants: product.variants ?? [],
          keywords: product.keywords ?? [],
        }
      : {
          title: '',
          slug: '',
          origin: null,
          description: null,
          status: ProductStatus.DRAFT as ManageProductFormInput['status'],
          visibility:
            Visibility.PRIVATE as ManageProductFormInput['visibility'],
          attributes: null,
          categoryId: '',
          currency: Currency.VND as ManageProductFormInput['currency'],
          shopId: undefined,
          images: [],
          variants: [],
          keywords: [],
        },
  });

  const { handleSubmit, trigger } = formMethods;

  const stepFieldSets: FieldPath<ManageProductFormInput>[][] = [
    [
      'title',
      'slug',
      'origin',
      'description',
      'status',
      'visibility',
      'categoryId',
      'attributes',
    ],
    ['images'],
    ['variants'],
    ['keywords'],
  ];

  // centralized navigation that validates before moving forward
  const navigateTo = async (targetIndex: number) => {
    if (targetIndex === step) return;
    // allow immediate backward navigation
    if (targetIndex < step) {
      setStep(targetIndex);
      return;
    }

    // moving forward: validate current step first
    setIsNavigating(true);
    try {
      const ok = await trigger(stepFieldSets[step]);
      if (!ok) return;
      setStep(targetIndex);
    } finally {
      setIsNavigating(false);
    }
  };

  const next = async () => {
    // validate only this step's fields (same as clicking sidebar to next)
    setIsNavigating(true);
    try {
      const ok = await trigger(stepFieldSets[step]);
      if (!ok) return;
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
    } finally {
      setIsNavigating(false);
    }
  };

  const back = () => setStep((s) => Math.max(s - 1, 0));

  const onFinalSubmit = (data: ManageProductFormInput) => {
    onSubmit(data);
  };

  const onInvalidSubmit = (errors: any) => {
    console.error('Validation Failed:', errors);
    toast('The form has errors on a previous step. Check the console.');
  };

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <FormProvider {...formMethods}>
      <form
        onSubmit={handleSubmit(onFinalSubmit, onInvalidSubmit)}
        className="flex flex-col md:flex-row gap-6"
      >
        {/* --- Sidebar --- */}
        <aside className="w-full md:w-64 space-y-4">
          <Card className="p-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold">
                Product Setup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {STEPS.map((s, index) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => navigateTo(index)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-all',
                    step === index
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'hover:bg-muted'
                  )}
                  disabled={isNavigating}
                >
                  <span>{s.label}</span>
                  {index < step ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : null}
                </button>
              ))}
            </CardContent>
          </Card>

          <div>
            <Progress value={progress} />
            <p className="text-sm text-muted-foreground mt-1 text-center">
              Step {step + 1} of {STEPS.length}
            </p>
          </div>
        </aside>

        {/* --- Main Content --- */}
        <div className="flex-1">
          <Card>
            <CardHeader>
              <CardTitle>{STEPS[step].label}</CardTitle>
            </CardHeader>

            <Separator />

            <CardContent className="pt-6 space-y-6">
              {step === 0 && <ProductGeneralInfo />}
              {step === 1 && <ProductImagesStep />}
              {step === 2 && <VariantsStep />}
              {step === 3 && <ProductTagsStep />}
            </CardContent>
          </Card>

          {/* --- Navigation buttons --- */}
          <div className="flex justify-between mt-6">
            {step > 0 ? (
              <Button
                type="button"
                variant="outline"
                onClick={back}
                disabled={isLoading || isNavigating}
              >
                Back
              </Button>
            ) : (
              <div />
            )}

            {step < STEPS.length - 1 ? (
              <Button
                type="button"
                onClick={next}
                disabled={isLoading || isNavigating}
              >
                Next
              </Button>
            ) : (
              <Button type="submit" disabled={isLoading || isNavigating}>
                {isLoading ? 'Saving...' : 'Save product'}
              </Button>
            )}
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
