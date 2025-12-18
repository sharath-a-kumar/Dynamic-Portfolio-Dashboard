'use client';

import { useState, useEffect } from 'react';

interface CompanyLogoProps {
  name: string;
  nseCode?: string;
  size?: number;
  className?: string;
  showInitial?: boolean;
}

// Helper to generate a consistent color from string (for icon background)
const stringToColor = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Generate HSL color for better visual consistency
  const h = Math.abs(hash % 360);
  const s = 65 + (hash % 20); // 65-85% saturation
  const l = 45 + (hash % 15); // 45-60% lightness

  return `hsl(${h}, ${s}%, ${l}%)`;
};

// Domain mappings for Indian companies
const DOMAIN_MAP: Record<string, string> = {
  // Banks
  hdfc: 'hdfcbank.com',
  hdfcbank: 'hdfcbank.com',
  icici: 'icicibank.com',
  icicibank: 'icicibank.com',
  sbi: 'sbi.co.in',
  kotak: 'kotak.com',
  kotakbank: 'kotak.com',
  axis: 'axisbank.com',
  axisbank: 'axisbank.com',
  indusind: 'indusind.com',
  yesbank: 'yesbank.in',
  idfc: 'idfcfirstbank.com',
  bob: 'bankofbaroda.in',
  pnb: 'pnbindia.in',
  canara: 'canarabank.com',

  // IT Companies
  tcs: 'tcs.com',
  infosys: 'infosys.com',
  infy: 'infosys.com',
  wipro: 'wipro.com',
  hcl: 'hcltech.com',
  hcltech: 'hcltech.com',
  techm: 'techmahindra.com',
  ltim: 'ltimindtree.com',
  mindtree: 'ltimindtree.com',
  ltimindtree: 'ltimindtree.com',
  persistent: 'persistent.com',
  coforge: 'coforge.com',
  mphasis: 'mphasis.com',
  happiest: 'happiestminds.com',
  kpit: 'kpit.com',

  // Conglomerates
  reliance: 'ril.com',
  tata: 'tata.com',
  tatamotors: 'tatamotors.com',
  tatasteel: 'tatasteel.com',
  tatapower: 'tatapower.com',
  adani: 'adani.com',
  adanient: 'adani.com',
  adaniports: 'adaniports.com',
  bajaj: 'bajaj.com',
  bajajfinance: 'bajajfinserv.in',
  bajajfinserv: 'bajajfinserv.in',
  mahindra: 'mahindra.com',
  godrej: 'godrej.com',

  // Consumer
  itc: 'itcportal.com',
  hul: 'hul.co.in',
  nestle: 'nestle.in',
  britannia: 'britannia.co.in',
  dabur: 'dabur.com',
  marico: 'marico.com',
  asianpaints: 'asianpaints.com',
  titan: 'titan.co.in',
  pidilite: 'pidilite.com',
  dmart: 'dmartindia.com',
  avenue: 'dmartindia.com',

  // Auto
  maruti: 'marutisuzuki.com',
  heromotoco: 'heromotocorp.com',
  hero: 'heromotocorp.com',
  eicher: 'eicher.in',
  ashokleyland: 'ashokleyland.com',

  // Pharma
  sunpharma: 'sunpharma.com',
  cipla: 'cipla.com',
  drreddy: 'drreddys.com',
  divis: 'divislabs.com',
  lupin: 'lupin.com',
  biocon: 'biocon.com',
  torrent: 'torrentpharma.com',
  zydus: 'zyduslife.com',
  apollo: 'apollohospitals.com',
  max: 'maxhealthcare.in',

  // Energy & Utilities
  ongc: 'ongcindia.com',
  ioc: 'iocl.com',
  bpcl: 'bharatpetroleum.in',
  hpcl: 'hindustanpetroleum.com',
  gail: 'gailonline.com',
  ntpc: 'ntpc.co.in',
  powergrid: 'powergrid.in',
  coalindia: 'coalindia.in',

  // Metals
  jsw: 'jsw.in',
  jswsteel: 'jsw.in',
  hindalco: 'hindalco.com',
  vedanta: 'vedantalimited.com',
  sail: 'sail.co.in',
  nmdc: 'nmdc.co.in',

  // Telecom
  airtel: 'airtel.in',
  bharti: 'airtel.in',
  jio: 'jio.com',
  vodafone: 'myvi.in',
  idea: 'myvi.in',

  // Infra & Real Estate
  lt: 'larsentoubro.com',
  larsen: 'larsentoubro.com',
  dlf: 'dlf.in',
  ultratech: 'ultratechcement.com',
  acc: 'acclimited.com',
  ambuja: 'ambujacement.com',

  // Financial Services
  bajajfinsv: 'bajajfinserv.in',
  sbilife: 'sbilife.co.in',
  hdfclife: 'hdfclife.com',
  icicipru: 'iciciprulife.com',
  angel: 'angelone.in',
  zerodha: 'zerodha.com',
  motilal: 'motilaloswal.com',
  cdsl: 'cdslindia.com',
  bse: 'bseindia.com',
  mcx: 'mcxindia.com',
  iex: 'iexindia.com',
  rec: 'recindia.nic.in',
  pfc: 'pfcindia.com',

  // New Age Tech
  zomato: 'zomato.com',
  paytm: 'paytm.com',
  nykaa: 'nykaa.com',
  policybazaar: 'policybazaar.com',
  delhivery: 'delhivery.com',
  cartrade: 'cartrade.com',

  // Others
  irctc: 'irctc.co.in',
  hal: 'hal-india.co.in',
  bel: 'bel-india.in',
  havells: 'havells.com',
  siemens: 'siemens.co.in',
  abb: 'abb.com',
  indigo: 'goindigo.in',
  spicejet: 'spicejet.com',
  tanla: 'tanla.com',
  affle: 'affle.com',
  bls: 'blsinternational.com',
};

// Get domain from company name
const getDomain = (companyName: string): string => {
  const cleanName = companyName
    .toLowerCase()
    .replace(/\s(ltd|limited|ind|india|industries|corp|corporation|inc|pvt|private)\.?$/gi, '')
    .replace(/[^\w\s]/g, '')
    .trim()
    .replace(/\s+/g, '');

  return DOMAIN_MAP[cleanName] || `${cleanName}.com`;
};

// Multiple logo sources with fallbacks
const getLogoUrls = (name: string, nseCode?: string): string[] => {
  const domain = getDomain(name);
  const urls: string[] = [];

  // 1. Google Favicon (most reliable, works for most sites)
  urls.push(`https://www.google.com/s2/favicons?domain=${domain}&sz=128`);

  // 2. DuckDuckGo icons (good fallback)
  urls.push(`https://icons.duckduckgo.com/ip3/${domain}.ico`);

  // 3. Favicon.io
  urls.push(`https://favicon.io/favicon/${domain}`);

  // 4. Direct favicon from domain
  urls.push(`https://${domain}/favicon.ico`);

  return urls;
};

export function CompanyLogo({
  name,
  nseCode,
  size = 40,
  className = '',
  showInitial = true,
}: CompanyLogoProps) {
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
  const [allFailed, setAllFailed] = useState(false);

  const logoUrls = getLogoUrls(name, nseCode);
  const initial = name.substring(0, 2).toUpperCase();
  const bgColor = stringToColor(name);

  // Reset state when name changes
  useEffect(() => {
    setCurrentUrlIndex(0);
    setAllFailed(false);
  }, [name]);

  const handleError = () => {
    if (currentUrlIndex < logoUrls.length - 1) {
      setCurrentUrlIndex((prev) => prev + 1);
    } else {
      setAllFailed(true);
    }
  };

  // Show initial avatar if all sources failed
  if (allFailed) {
    if (!showInitial) return null;
    return (
      <div
        className={`flex items-center justify-center rounded-lg font-bold text-white shadow-sm select-none ${className}`}
        style={{
          width: size,
          height: size,
          backgroundColor: bgColor,
          fontSize: size * 0.35,
        }}
        title={name}
      >
        {initial}
      </div>
    );
  }

  return (
    <img
      src={logoUrls[currentUrlIndex]}
      alt={`${name} logo`}
      width={size}
      height={size}
      className={`rounded-lg object-contain bg-white p-1 shadow-sm border border-border ${className}`}
      onError={handleError}
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
      loading="lazy"
    />
  );
}

export default CompanyLogo;
