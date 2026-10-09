import type { CSSProperties } from 'react';

export interface ElectricLogoProps {
  src?: string;
  color?: string;
  glowColor?: string;
  scale?: number;
  intensity?: number;
  glow?: number;
  thickness?: number;
  strands?: number;
  bend?: number;
  crackle?: number;
  arcs?: number;
  flicker?: number;
  fill?: number;
  speed?: number;
  /** Segundos que tarda el efecto en aparecer por completo (por defecto 1,4). */
  intro?: number;
  interactive?: boolean;
  cursorIntensity?: number;
  cursorRadius?: number;
  theme?: 'dark' | 'light';
  onRender?: (canvas: HTMLCanvasElement) => void;
  onError?: () => void;
  className?: string;
  style?: CSSProperties;
}

declare const ElectricLogo: (props: ElectricLogoProps) => JSX.Element;
export default ElectricLogo;

export declare const prepareShape: (src?: string) => Promise<unknown>;
