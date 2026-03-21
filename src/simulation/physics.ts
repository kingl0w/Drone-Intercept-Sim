export const G = 9.81;
export const DEG2RAD = Math.PI / 180;
export const TWO_PI = Math.PI * 2;

//isa atmosphere model, returns density in kg/m^3
export function airDensity(altitudeMeters: number, temperatureCelsius: number): number {
  const baseTemperature = 288.15;
  const lapseRate = 0.0065;
  const seaLevelDensity = 1.225;

  const adjustedBaseTemp = baseTemperature + temperatureCelsius - 15;
  const localTemperature = adjustedBaseTemp - lapseRate * altitudeMeters;

  if (localTemperature <= 0) return 0.1;

  //g/(R*L) - 1 for dry air
  return seaLevelDensity * Math.pow(localTemperature / adjustedBaseTemp, 4.256);
}

//signed angular difference [-PI, PI]
export function angleDiff(angleA: number, angleB: number): number {
  let diff = angleA - angleB;
  while (diff > Math.PI) diff -= TWO_PI;
  while (diff < -Math.PI) diff += TWO_PI;
  return diff;
}

//deterministic pseudo-random hash, returns [0, 1)
export function jinkHash(n: number): number {
  return (Math.sin(n * 127.1 + 311.7) * 43758.5453) % 1;
}
