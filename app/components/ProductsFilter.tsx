import {Link, useNavigate} from '@remix-run/react';
import {useState, useRef, useEffect} from 'react';
import {Transition} from '@headlessui/react';

export default function ProductsFilter({
  onlyPrice = false,
  searchQuery = '',
  resultTotal = -1,
}: {
  onlyPrice?: boolean;
  searchQuery?: string;
  resultTotal?: number;
}) {
  const navigate = useNavigate();
  const searchRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState(searchQuery);
  const [searchShown, setSearchShown] = useState(!!searchQuery);
  const [sortShown, setSortShown] = useState(false);

  const handleSearchClick = () => {
    setSearchShown(!searchShown);
    if (sortShown) setSortShown(false);
  };

  const handleSortClick = () => {
    setSortShown(!sortShown);
    if (searchShown) setSearchShown(false);
  };

  const submitSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!search) return;
    navigate(`/search?q=${search}`);
  };

  const makeQuery = (query: string) => {
    if (!searchQuery) return query;
    return query + '&q=' + searchQuery;
  };

  return (
    <div className="relative">
      <div
        className={`mt-[1px] w-full flex flex-row justify-between bg-white border *:border-gray-200 relative text-base ${
          !searchShown ? 'border-gray-200' : 'sm:border-transparent'
        }`}
      >
        <div className="border-r">
          <button
            className="py-2 sm:py-4 pl-3 sm:pl-12 uppercase cursor-pointer w-[114px] sm:w-[210px] text-left"
            onClick={handleSortClick}
          >
            {!sortShown ? 'Sort by' : 'Close'}
          </button>
        </div>
        <div className="border-l">
          <button
            className="py-2 sm:py-4 pr-3 sm:pr-12 uppercase cursor-pointer w-[114px] sm:w-[210px] text-right"
            onClick={handleSearchClick}
          >
            {!searchShown ? 'Search' : 'Close'}
          </button>
        </div>
      </div>
      <Transition show={sortShown}>
        <div className="transition duration-300 ease-in-out data-[closed]:opacity-0 bg-white w-full p-3 pb-5 sm:w-[378px] sm:p-12 relative sm:absolute -mt-[32.3px] top-0 sm:top-auto left-0 z-20 sm:mt-0 flex flex-col gap-8 text-base">
          <div className="flex justify-between items-center sm:hidden">
            <button
              className="uppercase border-0 cursor-pointer w-fit outline-0"
              onClick={handleSortClick}
            >
              Close
            </button>
            <span className="uppercase">Sort by</span>
          </div>
          <nav className="flex flex-col gap-4 sm:gap-6">
            {!onlyPrice && (
              <Link
                className="p-0 underline-offset-2 hover:underline"
                to={makeQuery('?sort_by=best_selling&sort_order=asc')}
                prefetch="intent"
                onClick={() => setSortShown(false)}
              >
                Featured
              </Link>
            )}
            <Link
              className="p-0 underline-offset-2 hover:underline"
              to={makeQuery('?sort_by=price&sort_order=asc')}
              prefetch="intent"
              onClick={() => setSortShown(false)}
            >
              Price, Low To High
            </Link>
            <Link
              className="p-0 underline-offset-2 hover:underline"
              to={makeQuery('?sort_by=price&sort_order=desc')}
              prefetch="intent"
              onClick={() => setSortShown(false)}
            >
              Price, High To Low
            </Link>
          </nav>
        </div>
      </Transition>
      <Transition
        show={searchShown}
        afterEnter={() => searchRef.current?.focus()}
      >
        <div className="transition duration-300 ease-in-out data-[closed]:opacity-0 bg-white w-full p-3 pb-4 sm:py-12 sm:px-32 relative sm:absolute -mt-[32.3px] top-0 sm:top-auto sm:mt-0 sm:bottom-0 right-0 z-20 sm:z-30 flex justify-center gap-8 flex-col sm:flex-row items-end text-base">
          <div className="w-full flex items-center justify-between sm:hidden">
            {resultTotal >= 0 ? (
              <div className="uppercase text-base sm:text-[9px]">
                {resultTotal} Results For:
              </div>
            ) : null}
            <button
              className="uppercase border-0 cursor-pointer w-fit"
              onClick={handleSearchClick}
            >
              Close
            </button>
          </div>
          <form
            className="w-full max-w-4xl flex flex-col gap-4"
            onSubmit={submitSearch}
          >
            {resultTotal >= 0 ? (
              <div className="uppercase text-base hidden sm:block sm:text-[9px]">
                {resultTotal} Results For:
              </div>
            ) : null}
            <div className="w-full flex flex-row gap-4 items-center border-b border-black sm:border-gray-200">
              <input
                type="text"
                placeholder="Search"
                className="uppercase py-2 border-0 focus:outline-0 w-full"
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button
                className="uppercase border-0 cursor-pointer w-fit"
                type="submit"
              >
                Enter
              </button>
            </div>
          </form>
          <button
            className="hidden sm:block uppercase border-0 cursor-pointer w-fit absolute right-12 top-1/2 transform -translate-y-1/2 -mt-[1px]"
            onClick={handleSearchClick}
          >
            Close
          </button>
        </div>
      </Transition>
    </div>
  );
}
