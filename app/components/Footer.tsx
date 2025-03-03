import {Suspense} from 'react';
import {Await, NavLink} from '@remix-run/react';
import type {FooterQuery, HeaderQuery} from 'storefrontapi.generated';

interface FooterProps {
  footer: Promise<FooterQuery | null>;
  header: HeaderQuery;
  publicStoreDomain: string;
}

export function Footer({
  footer: footerPromise,
  header,
  publicStoreDomain,
}: FooterProps) {
  return (
    <Suspense>
      <Await resolve={footerPromise}>
        {(footer) => (
          <footer className="p-4 pb-3 pt-[92px] sm:p-12 sm:pb-5 flex flex-col text-base gap-11 mt-auto">
            <div className="flex justify-between flex-col gap-7 lg:flex-row">
              <FooterForm />
              {footer?.menu && header.shop.primaryDomain?.url && (
                <FooterMenu
                  menu={footer.menu}
                  primaryDomainUrl={header.shop.primaryDomain.url}
                  publicStoreDomain={publicStoreDomain}
                />
              )}
              <p className="sm:hidden">© 2024 Smooch | Site by PEOPLE___JPG</p>
            </div>
          </footer>
        )}
      </Await>
    </Suspense>
  );
}

function FooterForm() {
  return (
    <form className="flex flex-col gap-6 text-base">
      <label htmlFor="email" className="text-base">
        Subcribe for email + receive 10% off first purchase
      </label>
      <div className="w-full lg:max-w-4xl flex flex-row gap-4 items-center border-b border-gray-200 pb-3">
        <input
          type="text"
          placeholder="Email"
          className="border-0 focus:outline-0 w-full"
        />
        <button className="uppercase border-0 cursor-pointer w-fit text-[#9E9E9E]">
          {`-->`}
        </button>
      </div>
    </form>
  );
}

function FooterMenu({
  menu,
  primaryDomainUrl,
  publicStoreDomain,
}: {
  menu: FooterQuery['menu'];
  primaryDomainUrl: FooterProps['header']['shop']['primaryDomain']['url'];
  publicStoreDomain: string;
}) {
  return (
    <nav
      className="grid grid-cols-2 sm:grid-cols-3 gap-16 text-base lg:w-1/2"
      role="navigation"
    >
      {(menu || FALLBACK_FOOTER_MENU).items.map((item) => {
        if (!item.url) return null;
        // if the url is internal, we strip the domain
        const getUrl = (url: string) =>
          url.includes('myshopify.com') ||
          url.includes(publicStoreDomain) ||
          url.includes(primaryDomainUrl)
            ? new URL(url).pathname
            : url;
        const isExternal = (url: string) => !url.startsWith('/');

        return (
          <div
            key={item.id}
            className="flex flex-col gap-10 last:order-first sm:last:order-none sm:last:col-span-3 [&:nth-child(-n+2)]:hidden sm:[&:nth-child(-n+2)]:flex group [&:nth-child(2)]:justify-self-center [&:nth-child(3)]:justify-self-end"
          >
            <h3 className="hidden sm:block group-last:hidden">{item.title}</h3>
            {item.items.length > 0 ? (
              <div className="flex flex-col gap-[5px] sm:gap-3 group-last:justify-end group-last:sm:flex-row group-last:xl:gap-12">
                {item.items.map((it) => {
                  return isExternal(getUrl(it.url ?? '') ?? '') ? (
                    <a
                      href={getUrl(it.url ?? '')}
                      key={it.id}
                      rel="noopener noreferrer"
                      target="_blank"
                      className="hover:underline underline-offset-2"
                    >
                      {it.title}
                    </a>
                  ) : (
                    <NavLink
                      key={it.id}
                      prefetch="intent"
                      to={getUrl(it.url ?? '')}
                      className="hover:underline underline-offset-2"
                    >
                      {it.title}
                    </NavLink>
                  );
                })}
                <p className="hidden group-last:sm:block">
                  © 2024 Smooch | Site by PEOPLE___JPG
                </p>
              </div>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}

const FALLBACK_FOOTER_MENU = {
  id: 'gid://shopify/Menu/199655620664',
  items: [
    {
      id: 'gid://shopify/MenuItem/461633060920',
      resourceId: 'gid://shopify/ShopPolicy/23358046264',
      tags: [],
      title: 'Privacy Policy',
      type: 'SHOP_POLICY',
      url: '/policies/privacy-policy',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461633093688',
      resourceId: 'gid://shopify/ShopPolicy/23358013496',
      tags: [],
      title: 'Refund Policy',
      type: 'SHOP_POLICY',
      url: '/policies/refund-policy',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461633126456',
      resourceId: 'gid://shopify/ShopPolicy/23358111800',
      tags: [],
      title: 'Shipping Policy',
      type: 'SHOP_POLICY',
      url: '/policies/shipping-policy',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461633159224',
      resourceId: 'gid://shopify/ShopPolicy/23358079032',
      tags: [],
      title: 'Terms of Service',
      type: 'SHOP_POLICY',
      url: '/policies/terms-of-service',
      items: [],
    },
  ],
};

function activeLinkStyle({
  isActive,
  isPending,
}: {
  isActive: boolean;
  isPending: boolean;
}) {
  return {
    fontWeight: isActive ? 'bold' : undefined,
    color: isPending ? 'grey' : 'white',
  };
}
