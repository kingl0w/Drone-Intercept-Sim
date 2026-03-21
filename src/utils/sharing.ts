import type { EvasionMode, CustomInterceptorParams } from "../types/presets";

interface ShareableParams {
  targetKey: string;
  interceptorKey: string;
  launchDistance: number;
  launchAngle: number;
  detectionDelay: number;
  targetAltitude: number;
  windSpeed: number;
  windAngle: number;
  temperature: number;
  evasion: EvasionMode;
  customInterceptor: CustomInterceptorParams;
  useRadarModel: boolean;
  compareMode: boolean;
  compareKey: string;
}

interface EncodedData {
  t: string;
  i: string;
  ld: number;
  la: number;
  dd: number;
  ta: number;
  ws: number;
  wa: number;
  tp: number;
  ev: EvasionMode;
  ci?: CustomInterceptorParams;
  rm?: number;
  cm?: number;
  ck?: string;
}

export function encodeParams(params: ShareableParams): string {
  const data: EncodedData = {
    t: params.targetKey,
    i: params.interceptorKey,
    ld: params.launchDistance,
    la: params.launchAngle,
    dd: params.detectionDelay,
    ta: params.targetAltitude,
    ws: params.windSpeed,
    wa: params.windAngle,
    tp: params.temperature,
    ev: params.evasion,
  };

  if (params.interceptorKey === "custom") data.ci = params.customInterceptor;
  if (params.useRadarModel) data.rm = 1;
  if (params.compareMode) {
    data.cm = 1;
    data.ck = params.compareKey;
  }

  return btoa(JSON.stringify(data));
}

export function decodeParams(hash: string): EncodedData | null {
  try {
    return JSON.parse(atob(hash)) as EncodedData;
  } catch {
    return null;
  }
}
