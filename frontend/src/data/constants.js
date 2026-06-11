const DEFAULT_LOCAL_API_BASE_URL = "http://127.0.0.1:8000";

function normalizeApiBaseUrl(value) {
  if (!value) {
    return "";
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
}

const configuredApiBaseUrl = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL);
export const API_BASE_URL = configuredApiBaseUrl || (import.meta.env.DEV ? DEFAULT_LOCAL_API_BASE_URL : "");

export function buildApiUrl(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return API_BASE_URL ? `${API_BASE_URL}${normalizedPath}` : normalizedPath;
}

export const THEME_STORAGE_KEY = "wc26-theme";
export const DEFAULT_SIMULATION_COUNT = 100;
export const DEFAULT_CUSTOM_SIMULATION_COUNT = 100;
export const PUBLIC_SIMULATION_MAX = 5000;
export const TOURNAMENT_TABS = [
  { id: "groups", label: "Group Stage" },
  { id: "knockout", label: "Knockout Stage" },
  { id: "recap", label: "Recap" },
  { id: "stats", label: "Tournament Stats" },
];
export const TROPHY_PNG_URL = "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f3c6.png";

export const CODE_TO_ISO = {
  ALG: "dz",
  ARG: "ar",
  AUS: "au",
  AUT: "at",
  BEL: "be",
  BIH: "ba",
  BRA: "br",
  CAN: "ca",
  CIV: "ci",
  CMR: "cm",
  COL: "co",
  COD: "cd",
  CPV: "cv",
  CRC: "cr",
  CRO: "hr",
  CUW: "cw",
  CZE: "cz",
  DEN: "dk",
  ECU: "ec",
  EGY: "eg",
  ENG: "gb-eng",
  ESP: "es",
  FRA: "fr",
  GER: "de",
  GHA: "gh",
  HAI: "ht",
  HON: "hn",
  IRN: "ir",
  IRQ: "iq",
  ITA: "it",
  JAM: "jm",
  JOR: "jo",
  JPN: "jp",
  KOR: "kr",
  KSA: "sa",
  MAR: "ma",
  MEX: "mx",
  NED: "nl",
  NGA: "ng",
  NZL: "nz",
  NOR: "no",
  PAN: "pa",
  PAR: "py",
  POL: "pl",
  POR: "pt",
  QAT: "qa",
  RSA: "za",
  SEN: "sn",
  SCO: "gb-sct",
  SRB: "rs",
  SUI: "ch",
  SWE: "se",
  TUN: "tn",
  TUR: "tr",
  UKR: "ua",
  URU: "uy",
  USA: "us",
  UZB: "uz",
};
