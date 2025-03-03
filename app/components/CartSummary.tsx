import type {CartApiQueryFragment} from 'storefrontapi.generated';
import type {CartLayout} from '~/components/CartMain';
import {CartForm, Money, type OptimisticCart} from '@shopify/hydrogen';
import {useAside} from './Aside';
import {Link} from '@remix-run/react';

type CartSummaryProps = {
  cartHasItems: boolean;
  cart: OptimisticCart<CartApiQueryFragment | null>;
  layout: CartLayout;
};

export function CartSummary({cartHasItems, cart, layout}: CartSummaryProps) {
  const className =
    layout === 'page' ? 'cart-summary-page' : 'cart-summary-aside text-base';

  return (
    <div
      aria-labelledby="cart-summary"
      className={className + (!cartHasItems && ' text-[#9E9E9E]')}
    >
      <div className="w-full flex flex-col gap-3 text-base">
        <div className="w-full flex justify-between text-[12px]">
          <h1 className="uppercase font-medium">Subtotal</h1>
          {cartHasItems ? (
            <div className="font-medium">
              {cart.cost?.subtotalAmount?.amount ? (
                <Money data={cart.cost?.subtotalAmount} />
              ) : (
                '-'
              )}
            </div>
          ) : null}
        </div>
        <p>Shipping, taxes, and discount codes are calculated at checkout.</p>
      </div>
      {/* <CartDiscounts discountCodes={cart.discountCodes} /> */}
      <CartCheckoutActions
        cartHasItems={cartHasItems}
        checkoutUrl={cart?.checkoutUrl}
        layout={layout}
      />
    </div>
  );
}
function CartCheckoutActions({
  cartHasItems,
  checkoutUrl,
  layout,
}: {
  cartHasItems: boolean;
  checkoutUrl?: string;
  layout?: CartSummaryProps['layout'];
}) {
  const {close} = useAside();

  return (
    <div className="w-full uppercase my-3 sm:my-8 text-md">
      {cartHasItems && checkoutUrl ? (
        <a
          href={checkoutUrl}
          target="_self"
          className="block bg-black text-white text-center p-4"
        >
          Check Out
        </a>
      ) : layout === 'aside' ? (
        <button
          className="w-full cursor-pointer block border border-gray-300 text-center p-4"
          onClick={close}
        >
          Back to Shop
        </button>
      ) : (
        <Link
          className="w-full cursor-pointer block border border-gray-300 text-center p-4"
          to="/collections/all"
        >
          Back to Shop
        </Link>
      )}
    </div>
  );
}

function CartDiscounts({
  discountCodes,
}: {
  discountCodes?: CartApiQueryFragment['discountCodes'];
}) {
  const codes: string[] =
    discountCodes
      ?.filter((discount) => discount.applicable)
      ?.map(({code}) => code) || [];

  return (
    <div>
      {/* Have existing discount, display it with a remove option */}
      <dl hidden={!codes.length}>
        <div>
          <dt>Discount(s)</dt>
          <UpdateDiscountForm>
            <div className="cart-discount">
              <code>{codes?.join(', ')}</code>
              &nbsp;
              <button>Remove</button>
            </div>
          </UpdateDiscountForm>
        </div>
      </dl>

      {/* Show an input to apply a discount */}
      <UpdateDiscountForm discountCodes={codes}>
        <div>
          <input type="text" name="discountCode" placeholder="Discount code" />
          &nbsp;
          <button type="submit">Apply</button>
        </div>
      </UpdateDiscountForm>
    </div>
  );
}

function UpdateDiscountForm({
  discountCodes,
  children,
}: {
  discountCodes?: string[];
  children: React.ReactNode;
}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.DiscountCodesUpdate}
      inputs={{
        discountCodes: discountCodes || [],
      }}
    >
      {children}
    </CartForm>
  );
}
