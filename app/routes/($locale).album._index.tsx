import {defer, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {Link, useLoaderData, type MetaFunction} from '@remix-run/react';
import {
  getPaginationVariables,
  getSeoMeta,
  Image,
  type SeoConfig,
} from '@shopify/hydrogen';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import cherry from '~/assets/cherry.svg';

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
async function loadCriticalData({context, request}: LoaderFunctionArgs) {
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 10,
  });

  const [{blogs}] = await Promise.all([
    context.storefront.query(BLOGS_QUERY, {
      variables: {
        ...paginationVariables,
      },
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  return {blogs, seo: {title: 'Albums'}};
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: LoaderFunctionArgs) {
  return {};
}

export default function Album() {
  const {blogs} = useLoaderData<typeof loader>();

  const formatDate = (date: string) => {
    const newDate = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      year: '2-digit',
    }).format(new Date(date));
    const result = newDate.replace(/(\d{2})$/, "'$1");

    return result;
  };

  return (
    <div className="blogs">
      <PaginatedResourceSection
        connection={blogs}
        resourcesClassName="grid grid-cols-1 sm:grid-cols-2"
      >
        {({node: blog}) => {
          if (blog.articles.nodes.length <= 0) return null;
          const image = blog?.articles?.nodes[0]?.image;
          return (
            <Link
              className="blog"
              key={blog.handle}
              prefetch="intent"
              to={`/album/${blog.handle}`}
            >
              <div className="relative overflow-hidden">
                {image && (
                  <Image
                    className="grayscale-[85%] hover:grayscale-0 transition-all duration-300"
                    alt={image?.altText || 'Album Image'}
                    aspectRatio="7/5"
                    data={image}
                    key={image.id}
                    sizes="(min-width: 45em) 50vw, 100vw"
                  />
                )}

                <div className="flex w-full justify-between absolute bottom-0 text-white text-base font-medium py-6 px-3">
                  <h3>{blog.title}</h3>
                  <p>
                    {blog.releaseDate && formatDate(blog.releaseDate.value)}
                  </p>
                </div>
              </div>
            </Link>
          );
        }}
      </PaginatedResourceSection>
      <img
        src={cherry}
        alt="Cherry"
        className="w-[172px] h-[172px] aspect-square ml-auto my-6 hidden sm:block"
      />
    </div>
  );
}

// NOTE: https://shopify.dev/docs/api/storefront/latest/objects/blog
const BLOGS_QUERY = `#graphql
  query Blogs(
    $country: CountryCode
    $endCursor: String
    $first: Int
    $language: LanguageCode
    $last: Int
    $startCursor: String
  ) @inContext(country: $country, language: $language) {
    blogs(
      first: $first,
      last: $last,
      before: $startCursor,
      after: $endCursor
    ) {
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      nodes {
        title
        handle
        seo {
          title
          description
        }
        releaseDate: metafield(namespace: "custom", key: "release_date") {
          value
        }
        articles(first: 1) {
          nodes {
            image {
              id
              altText
              height
              width
              url
              __typename
            }
          }
        }
      }
    }
  }
` as const;
