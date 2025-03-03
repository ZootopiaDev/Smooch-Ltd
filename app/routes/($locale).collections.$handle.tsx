import {defer, redirect, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {useLoaderData, type MetaFunction} from '@remix-run/react';
import {
  getPaginationVariables,
  Analytics,
  getSeoMeta,
  type SeoConfig,
} from '@shopify/hydrogen';
import type {ProductItemFragment} from 'storefrontapi.generated';
import {useVariantUrl} from '~/lib/variants';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import {ProductCard} from '~/components/ProductCard';
import ProductsFilter from '~/components/ProductsFilter';
import {type ProductCollectionSortKeys} from '@shopify/hydrogen/storefront-api-types';
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
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 8,
  });

  if (!handle) {
    throw redirect('/collections');
  }

  const url = new URL(request.url);
  const sortBy =
    (url.searchParams
      .get('sort_by')
      ?.toUpperCase() as ProductCollectionSortKeys) || null;
  const sortOrder = (url.searchParams.get('sort_order') as string) || null;

  const [{collection}] = await Promise.all([
    storefront.query(COLLECTION_QUERY, {
      variables: {
        handle,
        ...paginationVariables,
        sortBy,
        reverse: sortOrder === 'desc',
      },
      // Add other queries here, so that they are loaded in parallel
    }),
  ]);

  if (!collection) {
    throw new Response(`Collection ${handle} not found`, {
      status: 404,
    });
  }

  return {
    sort: {by: sortBy, reverse: sortOrder === 'desc'},
    collection,
    seo: {
      title: collection.title + ' Collection',
      description: collection.description,
    },
  };
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
  const {collection, sort} = useLoaderData<typeof loader>();

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
          <Breadcrumbs
            items={[
              {label: 'Shop'},
              {label: 'Shop All', path: '/collections/all'},
              {label: collection.title},
            ]}
          />
        )}
      </div>
      <PaginatedResourceSection
        connection={collection.products}
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
      <Analytics.CollectionView
        data={{
          collection: {
            id: collection.id,
            handle: collection.handle,
          },
        }}
      />
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
      title={product.title}
      price={product.priceRange.minVariantPrice}
      compareAtPrice={product.compareAtPriceRange.minVariantPrice}
      loading={loading}
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

// NOTE: https://shopify.dev/docs/api/storefront/2022-04/objects/collection
const COLLECTION_QUERY = `#graphql
  ${PRODUCT_ITEM_FRAGMENT}
  query Collection(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
    $sortBy: ProductCollectionSortKeys
    $reverse: Boolean
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      products(
        first: $first,
        last: $last,
        before: $startCursor,
        after: $endCursor,
        sortKey: $sortBy,
        reverse: $reverse
      ) {
        nodes {
          ...ProductItem
        }
        pageInfo {
          hasPreviousPage
          hasNextPage
          endCursor
          startCursor
        }
      }
    }
  }
` as const;
