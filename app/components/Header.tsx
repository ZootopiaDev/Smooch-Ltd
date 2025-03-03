import {Suspense, useEffect, useState} from 'react';
import {Await, NavLink, useLocation} from '@remix-run/react';
import {type CartViewPayload, useAnalytics} from '@shopify/hydrogen';
import type {HeaderQuery, CartApiQueryFragment} from 'storefrontapi.generated';
import type {MenuItem} from '@shopify/hydrogen/storefront-api-types';
import {useAside} from '~/components/Aside';
import cherry from '~/assets/cherry.svg';
import {Transition} from '@headlessui/react';
import clsx from 'clsx';

interface HeaderProps {
  header: HeaderQuery;
  cart: Promise<CartApiQueryFragment | null>;
  isLoggedIn: Promise<boolean>;
  publicStoreDomain: string;
}

type Viewport = 'desktop' | 'mobile';

export function Header({header, cart, publicStoreDomain}: HeaderProps) {
  const {pathname} = useLocation();

  const isHomePage = pathname === '/';

  const {shop, menu} = header;

  return (
    <>
      <div className="w-full text-center text-[10px] leading-normal sm:text-base text-[#767676] p-[4px] sm:p-[12.5px] bg-white z-40 relative">
        Enjoy free UK, EU & US shipping on orders over £110/€150/$180.
      </div>
      <header className="w-full sticky top-0 z-30 text-base">
        <nav
          className={clsx(
            'w-full flex items-center justify-between uppercase hover:bg-white transition-colors duration-300',
            isHomePage ? 'bg-transparent' : 'bg-white',
            'has-[.mobile-shown]:bg-white',
          )}
        >
          <HeaderMobile
            menu={menu}
            primaryDomainUrl={header.shop.primaryDomain.url}
            publicStoreDomain={publicStoreDomain}
          />
          <div className="order-3">
            <NavLink prefetch="intent" to="/" end>
              <img
                alt={shop.name}
                className="w-[93px] h-[28px] sm:w-[126px] sm:h-[40px]"
                src={shop.brand?.logo?.image?.url}
                width={126}
                height={40}
              />
            </NavLink>
          </div>

          <HeaderMenu
            menu={menu}
            viewport="desktop"
            primaryDomainUrl={header.shop.primaryDomain.url}
            publicStoreDomain={publicStoreDomain}
          />
          <div className="order-last">
            <CartToggle cart={cart} />
          </div>
        </nav>
      </header>
    </>
  );
}

export function HeaderMenu({
  menu,
  primaryDomainUrl,
  viewport,
  publicStoreDomain,
}: {
  menu: HeaderProps['header']['menu'];
  primaryDomainUrl: HeaderProps['header']['shop']['primaryDomain']['url'];
  viewport: Viewport;
  publicStoreDomain: HeaderProps['publicStoreDomain'];
}) {
  return (
    <>
      {(menu || FALLBACK_HEADER_MENU).items.map((item, index) => {
        const itemOrder = index === 2 ? index + 1 : index;
        if (!item.url) return null;

        return (
          <HeaderSubMenu
            primaryDomainUrl={primaryDomainUrl}
            publicStoreDomain={publicStoreDomain}
            key={item.id}
            item={item as MenuItem}
            itemOrder={itemOrder}
          />
        );
      })}
    </>
  );
}

function HeaderMobile({
  menu,
  primaryDomainUrl,
  publicStoreDomain,
}: {
  menu: HeaderProps['header']['menu'];
  primaryDomainUrl: HeaderProps['header']['shop']['primaryDomain']['url'];
  publicStoreDomain: HeaderProps['publicStoreDomain'];
}) {
  const getUrl = (url: string) =>
    url.includes('myshopify.com') ||
    url.includes(publicStoreDomain) ||
    url.includes(primaryDomainUrl)
      ? new URL(url).pathname
      : url;

  const [shown, setShown] = useState(false);

  const {pathname} = useLocation();

  useEffect(() => {
    setShown(false);
  }, [pathname]);

  const handleShown = () => {
    setShown((prev) => !prev);
  };

  useEffect(() => {
    if (shown) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [shown]);

  return (
    <div className="sm:hidden group normal-case">
      <button
        className="uppercase p-3 py-[17.5px] sm:py-[27.5px] sm:px-12"
        onClick={handleShown}
      >
        {shown ? 'Close' : 'Menu'}
      </button>
      <Transition show={shown}>
        <div
          className={clsx([
            // Base styles
            'mobile-shown w-full left-0 h-screen bg-white absolute px-3 py-12 flex flex-col gap-12 transition ease-in-out',
            // Shared closed styles
            'data-[closed]:opacity-0',
            // Entering styles
            'data-[enter]:duration-500 data-[enter]:data-[closed]:-translate-x-full',
            // Leaving styles
            'data-[leave]:duration-500 data-[leave]:data-[closed]:-translate-x-full',
          ])}
        >
          {(menu || FALLBACK_HEADER_MENU).items.map((item) => {
            if (item.items.length <= 0 && !item.url) return null;

            return (
              <div
                key={item.id}
                className="text-gray-400 flex flex-col gap-4 group last:ml-auto"
              >
                {item.items.length > 0 ? (
                  <>
                    <span>{item.title}</span>
                    <nav className="flex flex-col gap-4 text-black">
                      {item.items.map((it) => (
                        <NavLink
                          key={it.id}
                          prefetch="intent"
                          to={getUrl(it.url ?? '')}
                          className={({isActive}) =>
                            activeLinkClass({isActive})
                          }
                        >
                          {it.title}
                        </NavLink>
                      ))}
                    </nav>
                  </>
                ) : (
                  <NavLink
                    prefetch="intent"
                    key={item.id}
                    to={getUrl(item.url ?? '')}
                    className={({isActive}) =>
                      'flex items-center gap-2 ' + activeLinkClass({isActive})
                    }
                  >
                    {item.title}
                    <img
                      src={cherry}
                      alt="Cherry"
                      className="w-[96px] h-[96px] aspect-square"
                    />
                  </NavLink>
                )}
              </div>
            );
          })}
        </div>
      </Transition>
    </div>
  );
}

function HeaderSubMenu({
  item,
  itemOrder,
  primaryDomainUrl,
  publicStoreDomain,
}: {
  item: MenuItem;
  itemOrder: number;
  primaryDomainUrl: HeaderProps['header']['shop']['primaryDomain']['url'];
  publicStoreDomain: HeaderProps['publicStoreDomain'];
}) {
  const {close} = useAside();
  const [hovered, setIsHovered] = useState(false);
  const {pathname} = useLocation();
  const hasChild = item.items.length > 0;

  // if the url is internal, we strip the domain
  const getUrl = (url: string) =>
    url.includes('myshopify.com') ||
    url.includes(publicStoreDomain) ||
    url.includes(primaryDomainUrl)
      ? new URL(url).pathname
      : url;

  useEffect(() => {
    setIsHovered(false);
  }, [pathname]);

  if (hasChild) {
    return (
      <div
        className={`hidden sm:block cursor-context-menu underline-offset-2 group hover:underline order-${itemOrder}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="p-3 py-[17.5px] sm:py-[27.5px] sm:px-12">
          {item.title}
        </div>
        <Transition show={hovered}>
          <div
            className={clsx([
              // Base styles
              '-z-[1] w-full bg-white absolute -mt-6 px-12 py-16 left-0 transition ease-in-out',
              // Shared closed styles
              'data-[closed]:opacity-0',
              // Entering styles
              'data-[enter]:duration-500 data-[enter]:data-[closed]:-translate-y-full',
              // Leaving styles
              'data-[leave]:duration-500 data-[leave]:data-[closed]:-translate-y-full',
            ])}
          >
            <h3 className="capitalize text-gray-400">Categories</h3>

            <div className="flex flex-col mt-4 gap-4 capitalize">
              {item.items.map((it) => (
                <NavLink
                  key={it.id}
                  onClick={close}
                  prefetch="intent"
                  to={getUrl(it.url ?? '')}
                  className={({isActive}) => activeLinkClass({isActive})}
                >
                  {it.title}
                </NavLink>
              ))}
            </div>
          </div>
        </Transition>
      </div>
    );
  } else {
    return (
      <NavLink
        className={`hidden sm:block underline-offset-2 hover:underline p-3 py-[17.5px] sm:py-[27.5px] sm:px-12 order-${itemOrder}`}
        end
        prefetch="intent"
        to={getUrl(item.url ?? '')}
      >
        {item.title}
      </NavLink>
    );
  }
}

function CartBadge({count}: {count: number | null}) {
  const {open} = useAside();
  const {publish, shop, cart, prevCart} = useAnalytics();

  return (
    <a
      className="p-3 py-[17.5px] sm:py-[27.5px] sm:px-12 underline-offset-2 hover:underline"
      href="/cart"
      onClick={(e) => {
        e.preventDefault();
        open('cart');
        publish('cart_viewed', {
          cart,
          prevCart,
          shop,
          url: window.location.href || '',
        } as CartViewPayload);
      }}
    >
      Cart {count === null ? <span>&nbsp;</span> : <>({count})</>}
    </a>
  );
}

function CartToggle({cart}: Pick<HeaderProps, 'cart'>) {
  return (
    <Suspense fallback={<CartBadge count={null} />}>
      <Await resolve={cart}>
        {(cart) => {
          if (!cart) return <CartBadge count={0} />;
          return <CartBadge count={cart.totalQuantity || 0} />;
        }}
      </Await>
    </Suspense>
  );
}

const FALLBACK_HEADER_MENU = {
  id: 'gid://shopify/Menu/199655587896',
  items: [
    {
      id: 'gid://shopify/MenuItem/461609500728',
      resourceId: null,
      tags: [],
      title: 'Collections',
      type: 'HTTP',
      url: '/collections',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609533496',
      resourceId: null,
      tags: [],
      title: 'Blog',
      type: 'HTTP',
      url: '/blogs/journal',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609566264',
      resourceId: null,
      tags: [],
      title: 'Policies',
      type: 'HTTP',
      url: '/policies',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609599032',
      resourceId: 'gid://shopify/Page/92591030328',
      tags: [],
      title: 'About',
      type: 'PAGE',
      url: '/pages/about',
      items: [],
    },
  ],
};

function activeLinkClass({isActive}: {isActive: boolean}) {
  const baseClass = 'text-black underline-offset-2 hover:underline';
  if (isActive) return baseClass + ' underline';
  return baseClass;
}
