import {defer, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {Await, useLoaderData, type MetaFunction} from '@remix-run/react';
import {
  Image,
  getPaginationVariables,
  getSeoMeta,
  type SeoConfig,
} from '@shopify/hydrogen';
import type {
  AlbumCollectionQuery,
  ArticleItemFragment,
} from 'storefrontapi.generated';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import {Suspense} from 'react';
import {ProductCard} from '~/components/ProductCard';

export const meta: MetaFunction<typeof loader> = ({matches}) => {
  return getSeoMeta(
    ...matches.map((match) => (match?.data as {seo: SeoConfig})?.seo),
  );
};

export async function loader(args: LoaderFunctionArgs) {
  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData({
    ...args,
    collectionId: criticalData?.blog?.collection?.value || null,
  });

  return defer({...deferredData, ...criticalData});
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
async function loadCriticalData({
  context,
  request,
  params,
}: LoaderFunctionArgs) {
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 4,
  });

  if (!params.albumHandle) {
    throw new Response(`album not found`, {status: 404});
  }

  const [{blog}] = await Promise.all([
    context.storefront.query(BLOGS_QUERY, {
      variables: {
        albumHandle: params.albumHandle,
        ...paginationVariables,
      },
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  if (!blog?.articles) {
    throw new Response('Not found', {status: 404});
  }

  return {
    blog,
    seo: {
      title: blog.seo?.title || blog.title,
      description: blog.seo?.description,
    },
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({
  context,
  collectionId,
}: LoaderFunctionArgs & {collectionId: string | null}) {
  const collectionProducts = context.storefront.query(ALBUM_COLLECTION_QUERY, {
    variables: {
      id: collectionId || '',
    },
    // Add other queries here, so that they are loaded in parallel
  });

  return {collectionProducts};
}

export default function Blog() {
  const {blog, collectionProducts} = useLoaderData<typeof loader>();
  const {articles} = blog;

  return (
    <div className="">
      <div className="">
        <PaginatedResourceSection connection={articles}>
          {({node: article, index}) => (
            <ArticleItem
              article={article}
              key={article.id}
              loading={index < 2 ? 'eager' : 'lazy'}
            />
          )}
        </PaginatedResourceSection>
        <CollectionProducts
          title={blog.title}
          collection={collectionProducts}
        />
      </div>
    </div>
  );
}

function ArticleItem({
  article,
  loading,
}: {
  article: ArticleItemFragment;
  loading?: HTMLImageElement['loading'];
}) {
  return (
    <div
      className="flex items-stretch *:w-full md:*:w-1/2 flex-col md:flex-row md:even:flex-row-reverse"
      key={article.id}
    >
      {article.image && (
        <div className="">
          <Image
            alt={article.image.altText || article.title}
            aspectRatio="7/5"
            data={article.image}
            loading={loading}
            sizes="(min-width: 768px) 50vw, 100vw"
          />
        </div>
      )}
      <div
        className="flex items-center justify-center px-3 py-[108px] md:py-8 xl:px-[131px]"
        style={{
          background: article?.background?.value ?? undefined,
        }}
      >
        <div
          dangerouslySetInnerHTML={{__html: article.contentHtml}}
          className={`prose xl:prose-md ${
            article?.darkTheme?.value ? 'prose-invert' : ''
          }`}
        />
      </div>
    </div>
  );
}

function CollectionProducts({
  title,
  collection,
}: {
  title: string;
  collection: Promise<AlbumCollectionQuery | null> | null;
}) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Await resolve={collection}>
        {(response) => {
          if (response?.collection?.products)
            return (
              <div className="mt-16">
                <h1 className="m-3 text-base sm:my-6 sm:mx-12">Shop {title}</h1>
                <div className="recommended-products-grid sm:mb-12">
                  {response?.collection?.products.nodes.map((product) => (
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
                  ))}
                </div>
              </div>
            );
        }}
      </Await>
    </Suspense>
  );
}

// NOTE: https://shopify.dev/docs/api/storefront/latest/objects/blog
const BLOGS_QUERY = `#graphql
  query Blog(
    $language: LanguageCode
    $albumHandle: String!
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(language: $language) {
    blog(handle: $albumHandle) {
      title
      seo {
        title
        description
      }
      collection: metafield(namespace: "custom", key: "collection") {
        value
      }
      articles(
        first: $first,
        last: $last,
        before: $startCursor,
        after: $endCursor
      ) {
        nodes {
          ...ArticleItem
        }
        pageInfo {
          hasPreviousPage
          hasNextPage
          hasNextPage
          endCursor
          startCursor
        }

      }
    }
  }
  fragment ArticleItem on Article {
    author: authorV2 {
      name
    }
    contentHtml
    handle
    id
    image {
      id
      altText
      url
      width
      height
    }
    publishedAt
    title
    blog {
      handle
    }
    background: metafield(namespace: "custom", key: "background_color") {
      value
    }
    darkTheme: metafield(namespace: "custom", key: "dark_theme") {
      value
    }
  }
` as const;

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

const ALBUM_COLLECTION_QUERY = `#graphql
  ${PRODUCT_ITEM_FRAGMENT}
  query AlbumCollection(
    $id: ID!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    collection(id: $id) {
      id
      handle
      title
      description
      products(first: 4) {
        nodes {
          ...ProductItem
        }
      }
    }
  }
` as const;
