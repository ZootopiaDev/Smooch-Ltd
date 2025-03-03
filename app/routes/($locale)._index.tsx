import {defer, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {Await, useLoaderData, Link, type MetaFunction} from '@remix-run/react';
import {Suspense} from 'react';
import type {
  ProductItemFragment,
  RecommendedProductsHomePageQuery,
} from 'storefrontapi.generated';
import background from '~/assets/bg.png';
import backgroundMobile from '~/assets/bg-mobile.jpg';
import {ProductCard} from '~/components/ProductCard';
import {
  getPaginationVariables,
  getSeoMeta,
  type SeoConfig,
} from '@shopify/hydrogen';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import {useVariantUrl} from '~/lib/variants';

export const meta: MetaFunction<typeof loader> = ({matches}) => {
  return getSeoMeta(
    ...matches.map((match) => (match?.data as {seo: SeoConfig})?.seo),
  );
};

export async function loader(args: LoaderFunctionArgs) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  return defer({
    ...deferredData,
    seo: {
      titleTemplate: '%s',
    },
  });
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context, request}: LoaderFunctionArgs) {
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 4,
  });

  const recommendedProducts = context.storefront
    .query(RECOMMENDED_PRODUCTS_QUERY, {
      variables: {
        ...paginationVariables,
      },
    })
    .catch((error) => {
      // Log query errors, but don't throw them so the page can still render
      console.error(error);
      return null;
    });

  return {
    recommendedProducts,
  };
}

export default function Homepage() {
  const data = useLoaderData<typeof loader>();
  return (
    <div className="-mt-[48px] sm:-mt-[68px]">
      <Banner />
      <RecommendedProducts products={data.recommendedProducts} />
    </div>
  );
}

function Banner() {
  return (
    <div>
      <img
        src={backgroundMobile}
        alt="Big Banner"
        className="w-full h-[calc(100vh-23px)] object-cover sm:hidden"
      />
      <img
        src={background}
        alt="Big Banner"
        className="w-full hidden sm:block h-[calc(100vh-38.3px)] object-cover"
      />
    </div>
  );
}

function RecommendedProducts({
  products,
}: {
  products: Promise<RecommendedProductsHomePageQuery | null>;
}) {
  return (
    <div className="recommended-products">
      <Suspense fallback={<div>Loading...</div>}>
        <Await resolve={products}>
          {(response) => (
            <>
              {response ? (
                <PaginatedResourceSection
                  connection={response.products}
                  resourcesClassName="products-grid sm:mb-12"
                >
                  {({
                    node: product,
                    index,
                  }: {
                    node: ProductItemFragment;
                    index: number;
                  }) => (
                    <ProductItem
                      key={product.id}
                      product={product}
                      loading={index < 8 ? 'eager' : undefined}
                    />
                  )}
                </PaginatedResourceSection>
              ) : null}
            </>
          )}
        </Await>
      </Suspense>
    </div>
  );
}

function ProductItem({
  product,
  loading,
}: {
  product: ProductItemFragment;
  loading?: 'eager' | 'lazy';
}) {
  const variant = product.variants.nodes[0];
  const variantUrl = useVariantUrl(product.handle, variant.selectedOptions);
  return (
    <ProductCard
      key={product.id}
      url={variantUrl}
      image={product.featuredImage}
      loading={loading}
      title={product.title}
      price={product.priceRange.minVariantPrice}
      compareAtPrice={product.compareAtPriceRange.minVariantPrice}
    />
  );
}

const PRODUCT_ITEM_FRAGMENT = `#graphql
  fragment MoneyProductItem on MoneyV2 {
    amount
    currencyCode
  }
  fragment ProductItem on Product {
    id
    handle
    title
    featuredImage {
      id
      altText
      url
      width
      height
    }
    priceRange {
      minVariantPrice {
        ...MoneyProductItem
      }
      maxVariantPrice {
        ...MoneyProductItem
      }
    }
    compareAtPriceRange {
      minVariantPrice {
        ...MoneyProductItem
      }
    }
    variants(first: 1) {
      nodes {
        selectedOptions {
          name
          value
        }
      }
    }
  }
` as const;

const RECOMMENDED_PRODUCTS_QUERY = `#graphql
  query RecommendedProductsHomePage (
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String)
    @inContext(country: $country, language: $language) {
    products(first: $first, last: $last, before: $startCursor, after: $endCursor, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...ProductItem
      }
      pageInfo {
        hasPreviousPage
        hasNextPage
        startCursor
        endCursor
      }
    }
  }
  ${PRODUCT_ITEM_FRAGMENT}
` as const;
