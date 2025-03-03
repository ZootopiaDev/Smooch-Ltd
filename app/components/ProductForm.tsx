import {Link} from '@remix-run/react';
import {
  type CartViewPayload,
  type VariantOption,
  useAnalytics,
  VariantSelector,
} from '@shopify/hydrogen';
import type {
  ProductFragment,
  ProductVariantFragment,
} from 'storefrontapi.generated';
import {AddToCartButton} from '~/components/AddToCartButton';
import {useAside} from '~/components/Aside';
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from '@headlessui/react';
import clsx from 'clsx';

export function ProductForm({
  product,
  selectedVariant,
  variants,
}: {
  product: ProductFragment;
  selectedVariant: ProductFragment['selectedVariant'];
  variants: Array<ProductVariantFragment>;
}) {
  const {open} = useAside();
  const {publish, shop, cart, prevCart} = useAnalytics();

  return (
    <div className="grid grid-cols-4 gap-y-4 sm:gap-y-8 gap-x-2">
      <ColorOptions
        productId={product.id}
        options={product.swatch_products?.references?.nodes?.sort((a, b) =>
          a.handle.localeCompare(b.handle),
        )}
      />
      <VariantSelector
        handle={product.handle}
        options={product.options
          .filter((option) => option.name !== 'Color')
          .sort((a, b) => a.name.localeCompare(b.name))}
        variants={variants}
      >
        {({option}) => {
          return <VariantOptions option={option} />;
        }}
      </VariantSelector>
      <div className="col-span-3">
        <AddToCartButton
          disabled={!selectedVariant || !selectedVariant.availableForSale}
          onClick={() => {
            open('cart');
            publish('cart_viewed', {
              cart,
              prevCart,
              shop,
              url: window.location.href || '',
            } as CartViewPayload);
          }}
          lines={
            selectedVariant
              ? [
                  {
                    merchandiseId: selectedVariant.id,
                    quantity: 1,
                    selectedVariant,
                  },
                ]
              : []
          }
        >
          {selectedVariant?.availableForSale ? 'ADD TO CART' : 'Select a Size'}
        </AddToCartButton>
      </div>
    </div>
  );
}

export function ColorOptions({
  productId,
  options,
}: {
  productId: ProductFragment['id'];
  options: ProductFragment['swatch_products']['references']['nodes'];
}) {
  if (!options) return null;
  return (
    <div className="product-options col-span-4">
      <div className="product-options-grid gap-6">
        {options?.map(
          (
            option: ProductFragment['swatch_products']['references']['nodes'],
          ) => {
            return (
              <Link
                className="pb-2"
                key={option.id}
                prefetch="intent"
                replace
                to={`/products/${option.handle}`}
                style={{
                  borderBottom:
                    productId == option.id
                      ? '1px solid black'
                      : '1px solid transparent',
                }}
              >
                <span
                  className="rounded-full block w-[14px] h-[14px] relative border border-gray-400"
                  style={{
                    backgroundColor:
                      option?.color?.references?.nodes[0]?.hex?.value,
                  }}
                ></span>
              </Link>
            );
          },
        )}
      </div>
    </div>
  );
}

function VariantOptions({option}: {option: VariantOption}) {
  return (
    <Listbox>
      <div className="relative h-full">
        <ListboxButton className="group relative w-full text-base border border-gray-300 bg-white px-2 lowercase text-left h-full outline-0 flex justify-between items-center gap-2">
          <span>{option.value}</span>
          <span className="rotate-90 group-data-[open]:-rotate-90 w-fit h-fit block transition-transform">{`<`}</span>
        </ListboxButton>
        <ListboxOptions
          modal={false}
          className="absolute z-10 mt-1 max-h-56 w-full overflow-auto bg-white text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none data-[closed]:data-[leave]:opacity-0 data-[leave]:transition data-[leave]:duration-100 data-[leave]:ease-in lowercase"
        >
          {option.values.map(({value, isAvailable, to, isActive}) => (
            <ListboxOption
              key={option.name + value}
              value={value}
              className={clsx(
                'cursor-pointer data-[focus]:bg-gray-100 px-2 py-3 w-full block',
                !isAvailable && 'text-gray-300',
                isActive && 'font-medium',
              )}
              as={Link}
              to={to}
              replace
              preventScrollReset
            >
              {value}
            </ListboxOption>
          ))}
        </ListboxOptions>
      </div>
    </Listbox>
  );
}
