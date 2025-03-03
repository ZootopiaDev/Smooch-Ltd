import {json, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {useLoaderData, type MetaFunction} from '@remix-run/react';
import {
  getPaginationVariables,
  Analytics,
  getSeoMeta,
  type SeoConfig,
} from '@shopify/hydrogen';
import {SearchResults} from '~/components/SearchResults';
import {type RegularSearchReturn} from '~/lib/search';
import ProductsFilter from '~/components/ProductsFilter';
import {type SearchSortKeys} from '@shopify/hydrogen/storefront-api-types';

export const meta: MetaFunction<typeof loader> = ({matches}) => {
  return getSeoMeta(
    ...matches.map((match) => (match?.data as {seo: SeoConfig})?.seo),
  );
};

export async function loader({request, context}: LoaderFunctionArgs) {
  const searchPromise = regularSearch({request, context});

  searchPromise.catch((error: Error) => {
    console.error(error);
    return {term: '', result: null, error: error.message};
  });

  return {
    ...(await searchPromise),
    seo: {
      title: 'Search',
    },
  };
}

/**
 * Renders the /search route
 */
export default function SearchPage() {
  const {term, result, error} = useLoaderData<typeof loader>();

  return (
    <div className="search">
      <ProductsFilter
        onlyPrice={true}
        searchQuery={term}
        resultTotal={result?.total}
      />
      {error && (
        <p className="text-center" style={{color: 'red'}}>
          {error}
        </p>
      )}
      {!term || !result?.total ? (
        <SearchResults.Empty />
      ) : (
        <SearchResults result={result} term={term}>
          {({products, term}) => (
            <div>
              <SearchResults.Products
                products={products}
                term={term}
                total={result?.total}
              />
            </div>
          )}
        </SearchResults>
      )}
      <Analytics.SearchView data={{searchTerm: term, searchResults: result}} />
    </div>
  );
}

/**
 * Regular search query and fragments
 * (adjust as needed)
 */
const SEARCH_PRODUCT_FRAGMENT = `#graphql
  fragment MoneyProductItem on MoneyV2 {
    amount
    currencyCode
  }
  
  fragment SearchProduct on Product {
    __typename
    handle
    id
    publishedAt
    title
    trackingParameters
    vendor
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
    featuredImage {
      id
      altText
      url
      width
      height
    }
    variants(first: 1) {
      nodes {
        id
        image {
          url
          altText
          width
          height
        }
        price {
          amount
          currencyCode
        }
        compareAtPrice {
          amount
          currencyCode
        }
        selectedOptions {
          name
          value
        }
        product {
          handle
          title
        }
      }
    }
  }
` as const;

const PAGE_INFO_FRAGMENT = `#graphql
  fragment PageInfoFragment on PageInfo {
    hasNextPage
    hasPreviousPage
    startCursor
    endCursor
  }
` as const;

// NOTE: https://shopify.dev/docs/api/storefront/latest/queries/search
export const SEARCH_QUERY = `#graphql
  query RegularSearch(
    $country: CountryCode
    $endCursor: String
    $first: Int
    $language: LanguageCode
    $last: Int
    $term: String!
    $startCursor: String
    $sortBy: SearchSortKeys
    $reverse: Boolean
  ) @inContext(country: $country, language: $language) {
    products: search(
      after: $endCursor,
      before: $startCursor,
      first: $first,
      last: $last,
      query: $term,
      sortKey: $sortBy,
      reverse: $reverse,
      types: [PRODUCT],
      unavailableProducts: HIDE,
    ) {
      nodes {
        ...on Product {
          ...SearchProduct
        }
      }
      pageInfo {
        ...PageInfoFragment
      }
    }
  }
  ${SEARCH_PRODUCT_FRAGMENT}
  ${PAGE_INFO_FRAGMENT}
` as const;

/**
 * Regular search fetcher
 */
async function regularSearch({
  request,
  context,
}: Pick<
  LoaderFunctionArgs,
  'request' | 'context'
>): Promise<RegularSearchReturn> {
  const {storefront} = context;
  const url = new URL(request.url);
  const variables = getPaginationVariables(request, {pageBy: 8});
  const term = String(url.searchParams.get('q') || '');
  const sortBy = url.searchParams
    .get('sort_by')
    ?.toUpperCase() as SearchSortKeys;
  const sortOrder = url.searchParams.get('sort_order') as string;

  // Search articles, pages, and products for the `q` term
  const {errors, ...items} = await storefront.query(SEARCH_QUERY, {
    variables: {...variables, term, sortBy, reverse: sortOrder === 'desc'},
  });

  if (!items) {
    throw new Error('No search data returned from Shopify API');
  }

  const total = Object.values(items).reduce(
    (acc, {nodes}) => acc + nodes.length,
    0,
  );

  const error = errors
    ? errors.map(({message}) => message).join(', ')
    : undefined;

  return {type: 'regular', term, error, result: {total, items}};
}
