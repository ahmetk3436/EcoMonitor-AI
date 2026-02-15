import { Share } from 'react-native';
import { hapticSuccess, hapticError } from './haptics';
import type { SatelliteAlert } from '../types/satellite';

interface AlertDetailShareData {
  id: string;
  changeType: string;
  confidence: string;
  latitude: string;
  longitude: string;
  summary: string;
  severity: string;
  detectedAt: string;
}

export async function shareAlert(alert: SatelliteAlert | AlertDetailShareData): Promise<void> {
  // Determine if this is a SatelliteAlert (has coordinates object) or AlertDetailShareData (has latitude/longitude strings)
  const isSatelliteAlert = 'coordinates' in alert && typeof (alert as SatelliteAlert).coordinates === 'object';

  let changeLabel: string;
  let confidencePercent: string;
  let locationStr: string;
  let detectedDate: string;
  let summaryText: string;
  let severityText: string;

  if (isSatelliteAlert) {
    const sa = alert as SatelliteAlert;
    changeLabel = sa.changeType.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    confidencePercent = String(Math.round(sa.confidence * 100));
    locationStr = `${sa.coordinates.label} (${sa.coordinates.lat}, ${sa.coordinates.lng})`;
    detectedDate = new Date(sa.detectedAt).toLocaleDateString();
    summaryText = sa.summary;
    severityText = sa.severity.toUpperCase();
  } else {
    const ad = alert as AlertDetailShareData;
    changeLabel = ad.changeType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    confidencePercent = ad.confidence;
    locationStr = `${parseFloat(ad.latitude).toFixed(4)}, ${parseFloat(ad.longitude).toFixed(4)}`;
    detectedDate = new Date(ad.detectedAt).toLocaleDateString();
    summaryText = ad.summary;
    severityText = ad.severity.toUpperCase();
  }

  const message = `EcoMonitor AI Alert

Change Detected: ${changeLabel}
Confidence: ${confidencePercent}%
Severity: ${severityText}

Location: ${locationStr}

Summary:
${summaryText}

Detected: ${detectedDate}

Download EcoMonitor AI to track environmental changes in real-time.`;

  try {
    const result = await Share.share({
      message,
      title: 'EcoMonitor Alert',
    });

    if (result.action === Share.sharedAction) {
      hapticSuccess();
    }
  } catch (error: any) {
    hapticError();
    console.error('Share failed:', error);
  }
}

export interface AlertShareData {
  changeType: string;
  confidence: string;
  latitude: string;
  longitude: string;
  summary: string;
  severity: string;
  detectedAt: string;
}

export async function shareAlertDetail(alertData: AlertShareData): Promise<void> {
  const message = `EcoMonitor AI Alert

Change Detected: ${alertData.changeType}
Confidence: ${alertData.confidence}%
Severity: ${alertData.severity.toUpperCase()}

Location: ${alertData.latitude}, ${alertData.longitude}
Detected: ${alertData.detectedAt}

Summary:
${alertData.summary}

Download EcoMonitor AI to track environmental changes in real-time.`;

  await Share.share({
    message,
    title: 'EcoMonitor Alert'
  });
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
