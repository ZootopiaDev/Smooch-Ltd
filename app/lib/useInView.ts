import {type RefObject, useEffect, useRef, useState} from 'react';

interface UseInViewOptions extends IntersectionObserverInit {}

const useInView = (
  options: UseInViewOptions = {},
): [RefObject<HTMLElement>, boolean] => {
  const [inView, setInView] = useState<boolean>(false);
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting);
    }, options);

    const currentRef = ref.current;

    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [options]);

  return [ref as RefObject<HTMLElement>, inView];
};

export default useInView;
