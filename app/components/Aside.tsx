import {Transition, TransitionChild} from '@headlessui/react';
import clsx from 'clsx';
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';

type AsideType = 'details' | 'search' | 'cart' | 'mobile' | 'closed';
type DetailType = 'sizeAndFit' | 'careDetails' | 'shippingAndReturns';
type AsideContextValue = {
  type: AsideType;
  open: (mode: AsideType) => void;
  close: () => void;
  detailType: DetailType;
  setDetailType: (type: DetailType) => void;
};

/**
 * A side bar component with Overlay
 * @example
 * ```jsx
 * <Aside type="search" heading="SEARCH">
 *  <input type="search" />
 *  ...
 * </Aside>
 * ```
 */
export function Aside({
  children,
  heading,
  type,
}: {
  children?: React.ReactNode;
  type: AsideType;
  heading: React.ReactNode;
}) {
  const {type: activeType, close} = useAside();
  const expanded = type === activeType;

  useEffect(() => {
    if (expanded) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [expanded]);

  return (
    <Transition show={expanded}>
      <div aria-modal className="absolute w-full h-full z-50" role="dialog">
        <TransitionChild>
          <button
            className="fixed w-full h-full bg-black/20 transition duration-300 data-[closed]:opacity-0"
            onClick={close}
          />
        </TransitionChild>
        <TransitionChild>
          <aside
            className={clsx([
              // Base styles
              'transition ease-in-out duration-500',
              // Shared closed styles
              'data-[closed]:opacity-0',
              // Entering styles
              'data-[enter]:data-[closed]:translate-x-full',
              // Leaving styles
              'data-[leave]:data-[closed]:translate-x-full',
            ])}
          >
            <header className="flex justify-end p-4 sm:px-12 sm:pt-[62px] sm:pb-8">
              {/* <h3>{heading}</h3> */}
              <button
                className="uppercase cursor-pointer text-base hover:underline hover:underline-offset-2"
                onClick={close}
              >
                Close
              </button>
            </header>
            <main>{children}</main>
          </aside>
        </TransitionChild>
      </div>
    </Transition>
  );
}

const AsideContext = createContext<AsideContextValue | null>(null);

Aside.Provider = function AsideProvider({children}: {children: ReactNode}) {
  const [type, setType] = useState<AsideType>('closed');
  const [detailType, setDetailType] = useState<DetailType>('sizeAndFit');

  return (
    <AsideContext.Provider
      value={{
        type,
        open: setType,
        detailType,
        setDetailType,
        close: () => setType('closed'),
      }}
    >
      {children}
    </AsideContext.Provider>
  );
};

export function useAside() {
  const aside = useContext(AsideContext);
  if (!aside) {
    throw new Error('useAside must be used within an AsideProvider');
  }
  return aside;
}
