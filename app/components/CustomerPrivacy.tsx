import {Transition} from '@headlessui/react';
import {useEffect, useState} from 'react';

export default function CustomerPrivacy() {
  const [showBanner, setShowBanner] = useState(false);
  const [status, setStatus] = useState({
    accepted: false,
    loading: false,
  });

  useEffect(() => {
    document.addEventListener('visitorConsentCollected', (event) => {
      console.log('Visitor Consent:');
      console.log(event.detail);
      const {analyticsAllowed} = event.detail;
      if (!analyticsAllowed) setShowBanner(true);
    });
  }, []);

  const decline = () => {
    window.Shopify.customerPrivacy.setTrackingConsent(
      {
        analytics: false,
        marketing: false,
        preferences: false,
      },
      () => console.log('Consent captured declined.'),
    );
  };

  const accept = () => {
    setStatus((prevState) => ({...prevState, loading: true}));
    window.Shopify.customerPrivacy.setTrackingConsent(
      {
        analytics: true,
        marketing: true,
        preferences: true,
      },
      () => {
        setStatus({loading: false, accepted: true});
        setTimeout(() => setShowBanner(false), 1000);
        console.log('Consent captured accepted.');
      },
    );
  };

  return (
    <Transition show={showBanner}>
      <div className="transition duration-300 ease-in data-[closed]:opacity-0 bg-[#CDC4D9] fixed bottom-0 z-20 w-[calc(100%-16px)] max-w-[411px] text-base font-medium px-4 py-[18px] mx-2 mb-6 sm:mx-[18px] sm:mb-[38px] flex gap-6 flex-col">
        <p>
          We use Cookies to enhance your experience, analyze site traffic,
          assist in our marketing efforts, and understand how you interact with
          our site and services. By clicking “Accept” you are providing consent
          to set Cookies on your device.
        </p>
        <div className="flex gap-3">
          <button type="button" onClick={decline} className="text-[#9E9E9E]">
            Cookie Preferences
          </button>
          <button type="button" onClick={accept}>
            {status.loading
              ? 'Loading...'
              : status.accepted
              ? 'Accepted'
              : 'Accept'}
          </button>
        </div>
      </div>
    </Transition>
  );
}
