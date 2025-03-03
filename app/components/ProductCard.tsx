import type {ProductItemFragment} from 'storefrontapi.generated';
import {Image, Money} from '@shopify/hydrogen';
import type {MoneyV2} from '@shopify/hydrogen/storefront-api-types';
import {Link} from '@remix-run/react';

type ProductCardProps = {
  url: string;
  image: ProductItemFragment['featuredImage'];
  title: ProductItemFragment['title'];
  price: MoneyV2;
  compareAtPrice?: MoneyV2 | null;
  loading?: 'eager' | 'lazy';
};

export function ProductCard(product: ProductCardProps) {
  return (
    <Link className="group overflow-hidden relative" to={product.url}>
      {product.image ? (
        <div className="relative z-0">
          <Image
            data={product.image}
            aspectRatio="5/7"
            loading={product.loading}
            sizes="(min-width: 45em) 20vw, 50vw"
            className="group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      ) : null}
      <div className="p-3 flex flex-col gap-1 z-10 absolute bottom-0 w-full text-base">
        <h4 className="uppercase">{product.title}</h4>
        {product.compareAtPrice && product.compareAtPrice.amount !== '0.0' ? (
          <div className="product-price-on-sale">
            {product.price ? <Money data={product.price} /> : null}
            <s className="text-gray-500">
              <Money data={product.compareAtPrice} />
            </s>
          </div>
        ) : (
          <Money data={product.price} />
        )}
      </div>
    </Link>
  );
}
