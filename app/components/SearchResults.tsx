import {type RegularSearchReturn} from '~/lib/search';
import {PaginatedResourceSection} from './PaginatedResourceSection';
import {type ProductItemFragment} from 'storefrontapi.generated';
import {ProductCard} from './ProductCard';
import {useVariantUrl} from '~/lib/variants';

type SearchItems = RegularSearchReturn['result']['items'];
type PartialSearchResult<ItemType extends keyof SearchItems> = Pick<
  SearchItems,
  ItemType
> &
  Pick<RegularSearchReturn, 'term'> & {total: number};

type SearchResultsProps = RegularSearchReturn & {
  children: (args: SearchItems & {term: string}) => React.ReactNode;
};

export function SearchResults({
  term,
  result,
  children,
}: Omit<SearchResultsProps, 'error' | 'type'>) {
  if (!result?.total) {
    return null;
  }

  return children({...result.items, term});
}
SearchResults.Products = SearchResultsProducts;
SearchResults.Empty = SearchResultsEmpty;

function SearchResultsProducts({
  term,
  products,
  total,
}: PartialSearchResult<'products'>) {
  if (!products?.nodes.length) {
    return null;
  }

  return (
    <div className="search-result">
      <div className="py-3 sm:py-6 px-3 sm:px-12 z-10 absolute">
        <div className="text-base gap-1 hidden sm:flex">
          {total} results for{' '}
          <span className="font-medium uppercase">{`"${term}"`}</span>
        </div>
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

function SearchResultsEmpty() {
  return (
    <p className="text-center text-base mt-12">
      No results, try a different search.
    </p>
  );
}
