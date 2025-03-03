import {Link} from '@remix-run/react';
import {Fragment} from 'react';

type Props = {
  items: Breadcrumbs[];
};

type Breadcrumbs = {
  label: string;
  path?: string;
};

export function Breadcrumbs({items}: Props) {
  return (
    <div className="text-base flex gap-1 flex-wrap">
      {items.map((item) => (
        <Fragment key={item.label}>
          <span className="text-nowrap">
            {item.path ? (
              <Link
                to={item.path}
                className="hover:underline underline-offset-2 text-nowrap"
              >
                {item.label}
              </Link>
            ) : (
              item.label
            )}
          </span>
          <span className="last:hidden">{`>`}</span>
        </Fragment>
      ))}
    </div>
  );
}
