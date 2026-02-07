import { Share } from 'react-native';
import type { SatelliteAlert } from '../types/satellite';

export async function shareAlert(alert: SatelliteAlert): Promise<void> {
  const changeLabel = alert.changeType.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  const confidencePercent = Math.round(alert.confidence * 100);
  const detectedDate = new Date(alert.detectedAt).toLocaleDateString();

  const message = `EcoMonitor AI Alert

Change Type: ${changeLabel}
Confidence: ${confidencePercent}%
Location: ${alert.coordinates.label} (${alert.coordinates.lat}, ${alert.coordinates.lng})
Detected: ${detectedDate}

${alert.summary}

Monitor environmental changes with EcoMonitor AI`;

  try {
    await Share.share({
      message,
      title: 'EcoMonitor AI - Environmental Alert',
    });
  } catch {
    // User dismissed or share failed - ignore
  }
}

export async function shareAnalysisSummary(
  locationLabel: string,
  changeCount: number,
  avgConfidence: number,
): Promise<void> {
  const message = `I just analyzed ${locationLabel} with EcoMonitor AI!

${changeCount} environmental changes detected (avg confidence: ${avgConfidence}%).

Track environmental changes from space with EcoMonitor AI`;

  try {
    await Share.share({
      message,
      title: 'EcoMonitor AI - Analysis Results',
    });
  } catch {
    // User dismissed or share failed - ignore
  }
}
