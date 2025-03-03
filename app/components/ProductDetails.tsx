import {Tab, TabGroup, TabList, TabPanel, TabPanels} from '@headlessui/react';
import {Link} from '@remix-run/react';
import {useAside} from './Aside';
import {useState, useEffect} from 'react';

export function ProductDetails() {
  const {detailType} = useAside();
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (detailType === 'sizeAndFit') setSelectedIndex(0);
    if (detailType === 'careDetails') setSelectedIndex(1);
    if (detailType === 'shippingAndReturns') setSelectedIndex(2);
  }, [detailType]);

  return (
    <nav className="text-base">
      <TabGroup selectedIndex={selectedIndex} onChange={setSelectedIndex}>
        <TabList className="flex gap-9 sm:gap-14 *:cursor-pointer hover:*:underline data-[selected]:*:underline *:underline-offset-2">
          <Tab>Size & Fit</Tab>
          <Tab>Care Details</Tab>
          <Tab>Shipping & Returns</Tab>
        </TabList>
        <TabPanels className="mt-16 sm:mt-20 max-h-[calc(100vh-150px)] overflow-auto">
          <TabPanel>
            <SizeFit />
          </TabPanel>
          <TabPanel>
            <CareDetails />
          </TabPanel>
          <TabPanel>
            <ShipAndReturn />
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </nav>
  );
}

function SizeFit() {
  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col gap-5">
        <h2 className="uppercase">Fit Guide</h2>
        <ul className="list-disc pl-5 pt-2 flex flex-col gap-3">
          <li>Fit: Tight — A close fit that hugs the body</li>
          <li>Length: Hip — Intended to hit at or below the hip</li>
          <li>{`Model is 5'10"/178cm wearing a size S`}</li>
        </ul>
      </div>
      <div className="flex flex-col gap-5">
        <h2 className="uppercase">Product Measurements</h2>
        <table>
          <thead>
            <tr className="*:font-normal border-b border-gray-200 *:pb-1">
              <th className="text-left">Size</th>
              <th className="text-center">S</th>
              <th className="text-right">M</th>
            </tr>
          </thead>
          <tbody>
            <tr className="*:pt-3 *:py-1">
              <td className="text-left">Bust</td>
              <td className="text-center">81 - 84</td>
              <td className="text-right">91 - 94</td>
            </tr>
            <tr className="*:py-1">
              <td className="text-left">Waist</td>
              <td className="text-center">61 - 64</td>
              <td className="text-right">71 - 74</td>
            </tr>
            <tr className="*:py-1">
              <td className="text-left">Length</td>
              <td className="text-center">120</td>
              <td className="text-right">122</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="flex flex-col gap-5">
        <h2 className="">How to measure</h2>
        <ul className="list-disc pl-5 pt-2 flex flex-col gap-3">
          <li>
            Bust — Measure around the fullest part of your chest (keep the
            measurement tape under your arms!)
          </li>
          <li>
            Waist — Measure around the natural waistline and keep the tape
            comfortably loose
          </li>
          <li>Hips — Measure around the fullest part of your hips</li>
        </ul>
      </div>
    </div>
  );
}

function CareDetails() {
  return <p>Dry clean only.</p>;
}

function ShipAndReturn() {
  const {close} = useAside();
  return (
    <div className="flex flex-col gap-7 sm:gap-[154px]">
      <div className="flex flex-col gap-7 sm:gap-2">
        <h2 className="uppercase">Shipping & Delivery</h2>
        <p>
          Free standard shipping on orders over $100 and free express shipping
          on orders over $250.
          <br />
          <br />
          Please see our shipping information for delivery timelines.
        </p>
        <Link
          className="sm:mt-8 text-[#9E9E9E] hover:underline underline-offset-2"
          to="/pages/shipping-delivery"
          onClick={() => close()}
        >
          See Shipping Details
        </Link>
      </div>
      <div className="flex flex-col gap-7 sm:gap-2">
        <h2 className="uppercase">Return & Exchanges</h2>
        <p className="sm:mt-6">
          Orders may be returned up to 21 days after your order has shipped.
          Returns must be in new condition with original tags attached, unworn,
          unwashed, and free of any alterations. All returns must be accompanied
          by the original packaging and any included accessories (gloves,
          removable straps, neck scarves, etc.)
          <br />
          <br />
          Any item that shows signs of wear (stains, odor, missing tags, missing
          accessories, etc.) will automatically incur a 25% restocking fee.
          Final sale items are not eligible for return or exchange. If received,
          they will not be accepted and will be returned to you at your expense.
        </p>
        <Link
          className="sm:mt-[154px] text-[#9E9E9E] hover:underline underline-offset-2"
          to="/pages/return-exchange"
          onClick={() => close()}
        >
          See Full Policy
        </Link>
      </div>
    </div>
  );
}
