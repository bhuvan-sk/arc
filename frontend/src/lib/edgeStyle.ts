import { Transport } from '../api/types';

export interface EdgeStyleConfig {
  strokeDasharray: string;
  strokeWidth: number;
  flowAnimation: boolean;
  glow: boolean;
  opacity: number;
  dashOffset?: string;
}

export function computeEdgeStyle(
  transport: Transport | string,
  isTraced: boolean = false
): EdgeStyleConfig {
  if (isTraced) {
    return {
      strokeDasharray: '0',
      strokeWidth: 2.5,
      flowAnimation: false,
      glow: true,
      opacity: 1,
    };
  }

  switch (transport) {
    case 'async':
      return {
        strokeDasharray: '6 5',
        strokeWidth: 1.6,
        flowAnimation: true,
        glow: false,
        opacity: 0.75,
      };
    case 'replication':
      return {
        strokeDasharray: '2 6',
        strokeWidth: 1.8,
        flowAnimation: true,
        glow: false,
        opacity: 0.7,
      };
    case 'bidirectional':
      return {
        strokeDasharray: '0',
        strokeWidth: 1.8,
        flowAnimation: false,
        glow: false,
        opacity: 0.8,
      };
    case 'sync':
    default:
      return {
        strokeDasharray: '0',
        strokeWidth: 1.6,
        flowAnimation: false,
        glow: false,
        opacity: 0.7,
      };
  }
}
