import {defer, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {useLoaderData, Link, type MetaFunction} from '@remix-run/react';
import {
  getPaginationVariables,
  getSeoMeta,
  type SeoConfig,
} from '@shopify/hydrogen';
import type {
  CollectionFragment,
  ProductItemFragment,
} from 'storefrontapi.generated';
import {useVariantUrl} from '~/lib/variants';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import {ProductCard} from '~/components/ProductCard';
import ProductsFilter from '~/components/ProductsFilter';
import {type ProductSortKeys} from '@shopify/hydrogen/storefront-api-types';
import {Breadcrumbs} from '~/components/Breadcrumbs';
import {useMemo} from 'react';

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

  return defer({
    ...deferredData,
    ...criticalData,
    seo: {title: 'All Collections'},
  });
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
async function loadCriticalData({context, request}: LoaderFunctionArgs) {
  const {storefront} = context;
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 8,
  });

  const url = new URL(request.url);
  const sortBy = url.searchParams
    .get('sort_by')
    ?.toUpperCase() as ProductSortKeys;
  const sortOrder = url.searchParams.get('sort_order') as string;

  const [{products}] = await Promise.all([
    storefront.query(CATALOG_QUERY, {
      variables: {
        ...paginationVariables,
        sortBy,
        reverse: sortOrder === 'desc',
      },
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  return {sort: {by: sortBy, reverse: sortOrder === 'desc'}, products};
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: LoaderFunctionArgs) {
  return {};
}

const getSortByName = (sort: string, reverse: boolean) => {
  if (sort === 'BEST_SELLING') return 'Featured';
  if (sort === 'PRICE' && !reverse) return 'Price, Low to High';
  if (sort === 'PRICE' && reverse) return 'Price, Hight to Low';

  return null;
};

export default function Collection() {
  const {products, sort} = useLoaderData<typeof loader>();

  const sortBreadcrumb = useMemo(
    () => getSortByName(sort.by, sort.reverse),
    [sort.by, sort.reverse],
  );

  return (
    <div className="collection">
      <ProductsFilter />
      <div className="py-3 sm:py-6 px-3 sm:px-12 z-10 absolute">
        {sortBreadcrumb ? (
          <div className="text-base flex gap-1">
            Sorted by <span className="font-medium">{sortBreadcrumb}</span>
          </div>
        ) : (
          <Breadcrumbs items={[{label: 'Shop'}, {label: 'Shop All'}]} />
        )}
      </div>
      <PaginatedResourceSection
        connection={products}
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

// NOTE: https://shopify.dev/docs/api/storefront/2024-01/objects/product
const CATALOG_QUERY = `#graphql
  query Catalog(
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
    $sortBy: ProductSortKeys
    $reverse: Boolean
  ) @inContext(country: $country, language: $language) {
    products(first: $first, last: $last, before: $startCursor, after: $endCursor, sortKey: $sortBy, reverse: $reverse) {
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
