import {type RefObject, useEffect} from 'react';
import {Pagination} from '@shopify/hydrogen';
import useInView from '~/lib/useInView';

/**
 * <PaginatedResourceSection > is a component that encapsulate how the previous and next behaviors throughout your application.
 */

export function PaginatedResourceSection<NodesType>({
  connection,
  children,
  resourcesClassName,
}: {
  connection: React.ComponentProps<typeof Pagination<NodesType>>['connection'];
  children: React.FunctionComponent<{node: NodesType; index: number}>;
  resourcesClassName?: string;
}) {
  const [ref, inView] = useInView();

  useEffect(() => {
    if (inView) {
      ref.current?.click();
    }
  }, [inView, ref]);

  return (
    <Pagination connection={connection}>
      {({nodes, isLoading, PreviousLink, NextLink}) => {
        const resoucesMarkup = nodes.map((node, index) =>
          children({node, index}),
        );

        return (
          <div>
            <PreviousLink className="w-fit block mx-auto p-6 sm:py-12 text-base uppercase">
              {isLoading ? 'Loading...' : <p>Load previous</p>}
            </PreviousLink>

            {resourcesClassName ? (
              <div className={resourcesClassName}>{resoucesMarkup}</div>
            ) : (
              resoucesMarkup
            )}
            <NextLink
              className="w-fit block mx-auto p-6 sm:py-12 text-base uppercase"
              ref={ref as RefObject<HTMLAnchorElement>}
            >
              {isLoading ? 'Loading...' : <span>Load more</span>}
            </NextLink>
          </div>
        );
      }}
    </Pagination>
  );
}
