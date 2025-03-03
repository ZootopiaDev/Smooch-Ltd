import {Suspense} from 'react';
import {defer, redirect, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {Await, useLoaderData, type MetaFunction} from '@remix-run/react';
import type {
  ProductFragment,
  RecommendedProductsProductsPageQuery,
} from 'storefrontapi.generated';
import {
  getSelectedProductOptions,
  Analytics,
  useOptimisticVariant,
  getSeoMeta,
  type SeoConfig,
} from '@shopify/hydrogen';
import type {SelectedOption} from '@shopify/hydrogen/storefront-api-types';
import {getVariantUrl} from '~/lib/variants';
import {ProductPrice} from '~/components/ProductPrice';
import {ProductImage} from '~/components/ProductImage';
import {ProductForm} from '~/components/ProductForm';
import {ProductCard} from '~/components/ProductCard';
import {useAside} from '~/components/Aside';
import {Breadcrumbs} from '~/components/Breadcrumbs';

export const meta: MetaFunction<typeof loader> = ({matches}) => {
  return getSeoMeta(
    ...matches.map((match) => (match?.data as {seo: SeoConfig})?.seo),
  );
};

export async function loader(args: LoaderFunctionArgs) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  return defer({...deferredData, ...criticalData});
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
async function loadCriticalData({
  context,
  params,
  request,
}: LoaderFunctionArgs) {
  const {handle} = params;
  const {storefront} = context;

  if (!handle) {
    throw new Error('Expected product handle to be defined');
  }

  const [{product}] = await Promise.all([
    storefront.query(PRODUCT_QUERY, {
      variables: {handle, selectedOptions: getSelectedProductOptions(request)},
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  if (!product?.id) {
    throw new Response(null, {status: 404});
  }

  const firstVariant = product.variants.nodes[0];
  const firstVariantIsDefault = Boolean(
    firstVariant.selectedOptions.find(
      (option: SelectedOption) =>
        option.name === 'Title' && option.value === 'Default Title',
    ),
  );

  if (firstVariantIsDefault) {
    product.selectedVariant = firstVariant;
  } else {
    // if no selected variant was returned from the selected options,
    // we redirect to the first variant's url with it's selected options applied
    if (!product.selectedVariant) {
      throw redirectToFirstVariant({product, request});
    }
  }

  return {
    product,
    seo: {
      title: product.seo.title,
      description: product.seo.description,
      media: product.images.nodes[0],
    },
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context, params}: LoaderFunctionArgs) {
  // In order to show which variants are available in the UI, we need to query
  // all of them. But there might be a *lot*, so instead separate the variants
  // into it's own separate query that is deferred. So there's a brief moment
  // where variant options might show as available when they're not, but after
  // this deffered query resolves, the UI will update.
  const variants = context.storefront
    .query(VARIANTS_QUERY, {
      variables: {handle: params.handle!},
    })
    .catch((error) => {
      // Log query errors, but don't throw them so the page can still render
      console.error(error);
      return null;
    });

  const recommendedProducts = context.storefront
    .query(RECOMMENDED_PRODUCTS_QUERY)
    .catch((error) => {
      // Log query errors, but don't throw them so the page can still render
      console.error(error);
      return null;
    });

  return {
    variants,
    recommendedProducts,
  };
}

function redirectToFirstVariant({
  product,
  request,
}: {
  product: ProductFragment;
  request: Request;
}) {
  const url = new URL(request.url);
  const firstVariant = product.variants.nodes[0];

  return redirect(
    getVariantUrl({
      pathname: url.pathname,
      handle: product.handle,
      selectedOptions: firstVariant.selectedOptions,
      searchParams: new URLSearchParams(url.search),
    }),
    {
      status: 302,
    },
  );
}

export default function Product() {
  const {product, variants, recommendedProducts} =
    useLoaderData<typeof loader>();
  const selectedVariant = useOptimisticVariant(
    product.selectedVariant,
    variants,
  );

  const {title, descriptionHtml, images, collections} = product;
  const collection = collections.nodes[0];
  return (
    <div>
      <div className="py-3 sm:py-6 px-3 sm:px-12 z-10 absolute">
        <Breadcrumbs
          items={[
            {label: 'Shop'},
            {label: 'Shop All', path: '/collections/all'},
            ...(collection
              ? [
                  {
                    label: collection.title,
                    path: '/collections/' + collection.handle,
                  },
                ]
              : []),
            {label: title},
          ]}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2">
        <div className="flex flex-col">
          {images.nodes.map((image: any) => (
            <ProductImage key={image.id} image={image} />
          ))}
        </div>
        <div className="bg-white sticky self-start -bottom-[13.5rem] sm:bottom-auto flex flex-col gap-4 sm:gap-8 px-3 py-4 sm:px-10 xl:px-[120px] sm:top-1/2 sm:-translate-y-1/2">
          <div className="flex gap-4 justify-between text-md">
            <h1 className="uppercase">{title}</h1>
            <ProductPrice
              price={selectedVariant?.price}
              compareAtPrice={selectedVariant?.compareAtPrice}
            />
          </div>
          <Suspense
            fallback={
              <ProductForm
                product={product}
                selectedVariant={selectedVariant}
                variants={[]}
              />
            }
          >
            <Await
              errorElement="There was a problem loading product variants"
              resolve={variants}
            >
              {(data) => (
                <ProductForm
                  product={product}
                  selectedVariant={selectedVariant}
                  variants={data?.product?.variants.nodes || []}
                />
              )}
            </Await>
          </Suspense>
          <div className="text-base text-[#9E9E9E] sm:-mt-6">
            Pay in 4 payments of $48.75 with Afterpay
          </div>
          <div
            dangerouslySetInnerHTML={{__html: descriptionHtml}}
            className="text-base leading-relaxed text-[#363636]"
          />
          <ProductDetails />
        </div>
        <Analytics.ProductView
          data={{
            products: [
              {
                id: product.id,
                title: product.title,
                price: selectedVariant?.price.amount || '0',
                vendor: product.vendor,
                variantId: selectedVariant?.id || '',
                variantTitle: selectedVariant?.title || '',
                quantity: 1,
              },
            ],
          }}
        />
      </div>
      <RecommendedProducts products={recommendedProducts} />
    </div>
  );
}

function ProductDetails() {
  const {open, setDetailType} = useAside();

  return (
    <div className="text-base flex flex-col gap-4 items-start *:underline *:underline-offset-2">
      <button
        onClick={() => {
          open('details');
          setDetailType('sizeAndFit');
        }}
      >
        Size & Fit
      </button>
      <button
        onClick={() => {
          open('details');
          setDetailType('careDetails');
        }}
      >
        Care Details
      </button>
      <button
        onClick={() => {
          open('details');
          setDetailType('shippingAndReturns');
        }}
      >
        Shipping & Returns
      </button>
    </div>
  );
}

function RecommendedProducts({
  products,
}: {
  products: Promise<RecommendedProductsProductsPageQuery | null> | null;
}) {
  return (
    <div className="mt-16">
      <h1 className="m-3 text-base sm:my-6 sm:mx-12">Styled with</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <Await resolve={products}>
          {(response) => (
            <div className="recommended-products-grid sm:mb-12">
              {response
                ? response.products.nodes.map((product) => (
                    <ProductCard
                      key={product.id}
                      url={`/products/${product.handle}`}
                      image={product.featuredImage}
                      title={product.title}
                      loading="lazy"
                      price={product.priceRange.minVariantPrice}
                      compareAtPrice={
                        product.compareAtPriceRange.minVariantPrice
                      }
                    />
                  ))
                : null}
            </div>
          )}
        </Await>
      </Suspense>
    </div>
  );
}

const PRODUCT_VARIANT_FRAGMENT = `#graphql
  fragment ProductVariant on ProductVariant {
    availableForSale
    compareAtPrice {
      amount
      currencyCode
    }
    id
    image {
      __typename
      id
      url
      altText
      width
      height
    }
    price {
      amount
      currencyCode
    }
    product {
      title
      handle
    }
    selectedOptions {
      name
      value
    }
    sku
    title
    unitPrice {
      amount
      currencyCode
    }
  }
` as const;

const PRODUCT_FRAGMENT = `#graphql
  fragment Product on Product {
    id
    title
    vendor
    handle
    descriptionHtml
    description
    options {
      name
      values
    }
    selectedVariant: variantBySelectedOptions(selectedOptions: $selectedOptions, ignoreUnknownOptions: true, caseInsensitiveMatch: true) {
      ...ProductVariant
    }
    variants(first: 1) {
      nodes {
        ...ProductVariant
      }
    }
    seo {
      description
      title
    }
    images(first: 10) {
      nodes {
        __typename
        id
        url
        altText
        width
        height
      }
    }
    collections(first: 1, reverse: true) {
      nodes {
        title
        handle
      }
    }
    swatch_products: metafield(namespace: "custom", key: "swatch_products") {
      key
      value
      references(first: 10) {
        nodes {
          ... on Product {
            id
            title
            handle
            color: metafield(namespace: "shopify", key: "color-pattern") {
                references(first: 1) {
                  nodes {
                    ... on Metaobject {
                      label: field(key: "label") {
                        value
                      }
                      hex: field(key: "color") {
                        value
                      }
                    }
                  }
                }
              }
          }
        }
      }
    }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
` as const;

const PRODUCT_QUERY = `#graphql
  query Product(
    $country: CountryCode
    $handle: String!
    $language: LanguageCode
    $selectedOptions: [SelectedOptionInput!]!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...Product
    }
  }
  ${PRODUCT_FRAGMENT}
` as const;

const PRODUCT_VARIANTS_FRAGMENT = `#graphql
  fragment ProductVariants on Product {
    variants(first: 250) {
      nodes {
        ...ProductVariant
      }
    }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
` as const;

const VARIANTS_QUERY = `#graphql
  ${PRODUCT_VARIANTS_FRAGMENT}
  query ProductVariants(
    $country: CountryCode
    $language: LanguageCode
    $handle: String!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...ProductVariants
    }
  }
` as const;

const RECOMMENDED_PRODUCTS_QUERY = `#graphql
  fragment RecommendedProduct on Product {
    id
    title
    handle
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    compareAtPriceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    featuredImage {       
      id
      altText
      url
      width
      height
    }
  }
  query RecommendedProductsProductsPage ($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    products(first: 4, sortKey: BEST_SELLING) {
      nodes {
        ...RecommendedProduct
      }
    }
  }
` as const;
