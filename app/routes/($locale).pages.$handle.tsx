import {defer, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {useLoaderData, type MetaFunction} from '@remix-run/react';
import {getSeoMeta, type SeoConfig} from '@shopify/hydrogen';

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
async function loadCriticalData({context, params}: LoaderFunctionArgs) {
  if (!params.handle) {
    throw new Error('Missing page handle');
  }

  const [{page}] = await Promise.all([
    context.storefront.query(PAGE_QUERY, {
      variables: {
        handle: params.handle,
      },
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  if (!page) {
    throw new Response('Not Found', {status: 404});
  }

  return {
    page,
    seo: {
      title: page.title,
      description: page.seo?.description,
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

export default function Page() {
  const {page} = useLoaderData<typeof loader>();

  return (
    <div className="text-base p-3 pt-12 sm:p-12 flex gap-12 flex-col sm:flex-row">
      <header>
        <h1 className="whitespace-nowrap w-[161px]">{page.title}</h1>
      </header>
      <main dangerouslySetInnerHTML={{__html: page.body}} className="prose" />
    </div>
  );
}

const PAGE_QUERY = `#graphql
  query Page(
    $language: LanguageCode,
    $country: CountryCode,
    $handle: String!
  )
  @inContext(language: $language, country: $country) {
    page(handle: $handle) {
      id
      title
      body
      seo {
        description
        title
      }
    }
  }
` as const;
