import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import './animated-search-bar.css';

export const dummyData = [
  'React',
  'Vue',
  'Svelte',
  'Next.js',
  'Napier88',
  'Gatsby',
  'NewtonScript',
  'Angular',
  'Scala',
  'Groovy',
  'Haskell',
  'Lua',
  'R',
];

type AnimatedSearchBarProps = {
  inputId?: string;
  label?: string;
  placeholder?: string;
  data?: string[];
  showResults?: boolean;
  onQueryChange?: (value: string) => void;
};

const GooeyFilter = () => (
  <svg className="gooey-search-filter" aria-hidden="true" focusable="false">
    <defs>
      <filter id="goo-effect">
        <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
        <feColorMatrix
          in="blur"
          type="matrix"
          values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -15"
          result="goo"
        />
        <feComposite in="SourceGraphic" in2="goo" operator="atop" />
      </filter>
    </defs>
  </svg>
);

const SearchIcon = ({ isUnsupported }: { isUnsupported: boolean }) => (
  <motion.svg
    initial={{ opacity: 0, scale: 0.8, x: -4, filter: isUnsupported ? 'none' : 'blur(5px)' }}
    animate={{ opacity: 1, scale: 1, x: 0, filter: 'blur(0px)' }}
    exit={{ opacity: 0, scale: 0.8, x: -4, filter: isUnsupported ? 'none' : 'blur(5px)' }}
    transition={{ delay: 0.1, duration: 1, type: 'spring', bounce: 0.15 }}
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <circle cx="10.8" cy="10.8" r="6.5" stroke="currentColor" strokeWidth="1.8" />
    <path d="m16 16 4.2 4.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </motion.svg>
);

const LoadingIcon = () => (
  <svg className="loading-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" aria-label="Ładowanie" role="status">
    <rect width="256" height="256" fill="none" />
    <line x1="128" y1="32" x2="128" y2="64" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" />
    <line x1="195.88" y1="60.12" x2="173.25" y2="82.75" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" opacity="0.8" />
    <line x1="224" y1="128" x2="192" y2="128" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" opacity="0.65" />
    <line x1="195.88" y1="195.88" x2="173.25" y2="173.25" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" opacity="0.5" />
    <line x1="128" y1="224" x2="128" y2="192" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" opacity="0.35" />
    <line x1="60.12" y1="195.88" x2="82.75" y2="173.25" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" opacity="0.25" />
    <line x1="32" y1="128" x2="64" y2="128" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" opacity="0.15" />
    <line x1="60.12" y1="60.12" x2="82.75" y2="82.75" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16" opacity="0.1" />
  </svg>
);

const InfoIcon = ({ index }: { index: number }) => (
  <motion.svg
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ delay: index * 0.12 + 0.3 }}
    viewBox="0 0 20.2832 19.9316"
    className="info-icon"
    aria-hidden="true"
    fill="none"
  >
    <path
      d="M7.49991 0.876892C3.84222 0.876892 0.877075 3.84204 0.877075 7.49972C0.877075 11.1574 3.84222 14.1226 7.49991 14.1226C11.1576 14.1226 14.1227 11.1574 14.1227 7.49972C14.1227 3.84204 11.1576 0.876892 7.49991 0.876892ZM1.82707 7.49972C1.82707 4.36671 4.36689 1.82689 7.49991 1.82689C10.6329 1.82689 13.1727 4.36671 13.1727 7.49972C13.1727 10.6327 10.6329 13.1726 7.49991 13.1726C4.36689 13.1726 1.82707 10.6327 1.82707 7.49972ZM8.24992 4.49999C8.24992 4.9142 7.91413 5.24999 7.49992 5.24999C7.08571 5.24999 6.74992 4.9142 6.74992 4.49999C6.74992 4.08577 7.08571 3.74999 7.49992 3.74999C7.91413 3.74999 8.24992 4.08577 8.24992 4.49999ZM6.00003 5.99999H6.50003H7.50003C7.77618 5.99999 8.00003 6.22384 8.00003 6.49999V9.99999H8.50003H9.00003V11H8.50003H7.50003H6.50003H6.00003V9.99999H6.50003H7.00003V6.99999H6.50003H6.00003V5.99999Z"
      fill="currentColor"
      fillRule="evenodd"
      clipRule="evenodd"
    />
  </motion.svg>
);

const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

export const isUnsupportedBrowser = () => {
  if (typeof navigator === 'undefined') return false;

  const ua = navigator.userAgent.toLowerCase();
  const isSafari = ua.includes('safari')
    && !ua.includes('chrome')
    && !ua.includes('chromium')
    && !ua.includes('android')
    && !ua.includes('firefox');

  return isSafari || ua.includes('crios');
};

const buttonVariants = {
  initial: { x: 0, width: 100 },
  step1: { x: 0, width: 100 },
  step2: { x: -30, width: 180 },
};

const iconVariants = {
  hidden: { x: -50, opacity: 0 },
  visible: { x: 16, opacity: 1 },
};

export const GooeySearchBar = ({
  inputId = 'animated-search-input',
  label = 'Szukaj',
  placeholder = 'Wpisz szukaną frazę',
  data = dummyData,
  showResults = true,
  onQueryChange,
}: AnimatedSearchBarProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState({
    step: 1,
    searchData: [] as string[],
    searchText: '',
    isLoading: false,
  });
  const debouncedSearchText = useDebounce(state.searchText, 500);
  const isUnsupported = useMemo(() => isUnsupportedBrowser(), []);

  const handleButtonClick = () => {
    setState((previous) => ({ ...previous, step: 2 }));
  };

  const handleSearch = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setState((previous) => ({ ...previous, searchText: value }));
    onQueryChange?.(value);
  };

  useEffect(() => {
    if (state.step === 2) {
      inputRef.current?.focus();
      return;
    }

    setState((previous) => ({ ...previous, searchText: '', searchData: [], isLoading: false }));
  }, [state.step]);

  useEffect(() => {
    let isCancelled = false;

    if (!debouncedSearchText) {
      setState((previous) => ({ ...previous, searchData: [], isLoading: false }));
      return () => {
        isCancelled = true;
      };
    }

    setState((previous) => ({ ...previous, isLoading: true }));
    const handler = window.setTimeout(() => {
      if (isCancelled) return;

      const filteredData = data.filter((item) => item.toLowerCase().includes(debouncedSearchText.trim().toLowerCase()));
      setState((previous) => ({ ...previous, searchData: filteredData, isLoading: false }));
    }, 500);

    return () => {
      isCancelled = true;
      window.clearTimeout(handler);
    };
  }, [data, debouncedSearchText]);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    const syncRestoredValue = () => {
      const value = input.value;
      setState((previous) => ({ ...previous, searchText: value, step: value ? 2 : previous.step }));
      onQueryChange?.(value);
    };

    input.addEventListener('component-search-restore', syncRestoredValue);
    return () => input.removeEventListener('component-search-restore', syncRestoredValue);
  }, [onQueryChange]);

  return (
    <div className={`gooey-search-wrapper ${isUnsupported ? 'no-goo' : ''}`}>
      <GooeyFilter />
      <div className="gooey-search-content">
        <motion.div
          className="gooey-search-content-inner"
          initial="initial"
          animate={state.step === 1 ? 'step1' : 'step2'}
          transition={{ duration: 0.75, type: 'spring', bounce: 0.15 }}
        >
          {showResults && (
            <AnimatePresence mode="popLayout">
              <motion.div
                key="search-results"
                className="gooey-search-results"
                role="listbox"
                aria-label="Wyniki wyszukiwania"
                exit={{ scale: 0, opacity: 0 }}
                transition={{ delay: isUnsupported ? 0.5 : 1.25, duration: 0.5 }}
              >
                <AnimatePresence mode="popLayout">
                  {state.searchData.map((item, index) => (
                    <motion.div
                      key={item}
                      className="gooey-search-result"
                      role="option"
                      initial={{ y: 0, scale: 0.3, filter: isUnsupported ? 'none' : 'blur(10px)' }}
                      animate={{ y: (index + 1) * 50, scale: 1, filter: 'blur(0px)' }}
                      exit={{ y: isUnsupported ? 0 : -4, scale: 0.8 }}
                      transition={{ duration: 0.75, delay: index * 0.12, type: 'spring', bounce: 0.35 }}
                    >
                      <InfoIcon index={index} />
                      <span>{item}</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            </AnimatePresence>
          )}

          <motion.div
            variants={buttonVariants}
            onClick={handleButtonClick}
            onKeyDown={(event) => {
              if (state.step === 1 && (event.key === 'Enter' || event.key === ' ')) {
                event.preventDefault();
                handleButtonClick();
              }
            }}
            whileHover={{ scale: state.step === 2 ? 1 : 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="gooey-search-button"
            role={state.step === 1 ? 'button' : undefined}
            tabIndex={state.step === 1 ? 0 : -1}
            aria-label={state.step === 1 ? label : undefined}
          >
            <span className={`gooey-search-label ${state.step === 2 ? 'is-hidden' : ''}`}>{label}</span>
            <input
              ref={inputRef}
              id={inputId}
              type="text"
              className={`gooey-search-input ${state.step === 1 ? 'is-collapsed' : ''}`}
              placeholder={placeholder}
              aria-label={label}
              value={state.searchText}
              onChange={handleSearch}
              tabIndex={state.step === 1 ? -1 : 0}
            />
          </motion.div>

          <AnimatePresence mode="wait">
            {state.step === 2 && (
              <motion.div
                key="icon"
                className="gooey-search-icon"
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={iconVariants}
                transition={{ delay: 0.1, duration: 0.85, type: 'spring', bounce: 0.15 }}
                aria-hidden="true"
              >
                {!state.isLoading ? <SearchIcon isUnsupported={isUnsupported} /> : <LoadingIcon />}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default GooeySearchBar;
