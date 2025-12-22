import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, spacing, fontSize, borderRadius } from '../lib/theme';

const hapticNotification = (type: Haptics.NotificationFeedbackType) => {
  if (Platform.OS !== 'web') Haptics.notificationAsync(type);
};

export type ScanMode = 'sell' | 'manage';

interface BarcodeScannerProps {
  visible: boolean;
  onClose: () => void;
  onScan: (barcode: string, mode: ScanMode) => void;
  initialMode?: ScanMode;
  showModeToggle?: boolean;
}

export function BarcodeScanner({ 
  visible, 
  onClose, 
  onScan,
  initialMode = 'sell',
  showModeToggle = true,
}: BarcodeScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [mode, setMode] = useState<ScanMode>(initialMode);

  useEffect(() => {
    if (visible) {
      setScanned(false);
      setMode(initialMode);
    }
  }, [visible, initialMode]);

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (!scanned) {
      setScanned(true);
      hapticNotification(Haptics.NotificationFeedbackType.Success);
      onScan(data, mode);
      onClose();
    }
  };

  const toggleMode = () => {
    const newMode = mode === 'sell' ? 'manage' : 'sell';
    setMode(newMode);
    hapticNotification(Haptics.NotificationFeedbackType.Warning);
  };

  const getModeInfo = () => {
    if (mode === 'sell') {
      return {
        label: 'Mode Vente',
        icon: 'cart-outline' as const,
        description: 'Scanner pour ajouter au panier',
        color: colors.primary,
      };
    }
    return {
      label: 'Mode Gestion',
      icon: 'create-outline' as const,
      description: 'Scanner pour créer ou modifier',
      color: colors.success,
    };
  };

  const modeInfo = getModeInfo();

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {!permission?.granted ? (
          <View style={styles.permissionContainer}>
            <Ionicons name="camera-outline" size={64} color={colors.textMuted} />
            <Text style={styles.permissionTitle}>Accès caméra requis</Text>
            <Text style={styles.permissionText}>
              Nous avons besoin d'accéder à la caméra pour scanner les codes-barres
            </Text>
            <TouchableOpacity
              style={styles.permissionButton}
              onPress={requestPermission}
            >
              <Text style={styles.permissionButtonText}>Autoriser l'accès</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: [
                'ean13',
                'ean8',
                'upc_a',
                'upc_e',
                'code39',
                'code128',
                'qr',
              ],
            }}
            onBarcodeScanned={handleBarcodeScanned}
          >
            {/* Scanner Overlay */}
            <View style={styles.overlay}>
              {/* Top - Mode Toggle */}
              <View style={styles.overlaySection}>
                {showModeToggle && (
                  <TouchableOpacity 
                    style={[styles.modeToggle, { borderColor: modeInfo.color }]}
                    onPress={toggleMode}
                  >
                    <Ionicons name={modeInfo.icon} size={20} color={modeInfo.color} />
                    <View style={styles.modeToggleTextContainer}>
                      <Text style={[styles.modeToggleLabel, { color: modeInfo.color }]}>
                        {modeInfo.label}
                      </Text>
                      <Text style={styles.modeToggleDescription}>
                        {modeInfo.description}
                      </Text>
                    </View>
                    <View style={[styles.modeToggleSwitch, { backgroundColor: modeInfo.color }]}>
                      <Ionicons name="swap-horizontal" size={16} color={colors.textInverse} />
                    </View>
                  </TouchableOpacity>
                )}
              </View>
              
              {/* Middle with cutout */}
              <View style={styles.middleSection}>
                <View style={styles.overlaySection} />
                <View style={styles.scanArea}>
                  <View style={[styles.corner, styles.cornerTopLeft, { borderColor: modeInfo.color }]} />
                  <View style={[styles.corner, styles.cornerTopRight, { borderColor: modeInfo.color }]} />
                  <View style={[styles.corner, styles.cornerBottomLeft, { borderColor: modeInfo.color }]} />
                  <View style={[styles.corner, styles.cornerBottomRight, { borderColor: modeInfo.color }]} />
                </View>
                <View style={styles.overlaySection} />
              </View>
              
              {/* Bottom */}
              <View style={styles.overlaySection}>
                <Text style={styles.instructionText}>
                  Positionnez le code-barres dans le cadre
                </Text>
                <Text style={[styles.modeHint, { color: modeInfo.color }]}>
                  {mode === 'sell' ? '🛒 Vente' : '✏️ Gestion'}
                </Text>
              </View>
            </View>

            {/* Close Button */}
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={28} color={colors.textInverse} />
            </TouchableOpacity>
          </CameraView>
        )}
      </View>
    </Modal>
  );
}

const { width } = Dimensions.get('window');
const scanAreaSize = width * 0.7;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.text,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  permissionTitle: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.textInverse,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  permissionText: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  permissionButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
  },
  permissionButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textInverse,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
  },
  overlaySection: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  middleSection: {
    flexDirection: 'row',
    height: scanAreaSize,
  },
  scanArea: {
    width: scanAreaSize,
    height: scanAreaSize,
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: colors.primary,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 8,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 8,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 8,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 8,
  },
  instructionText: {
    fontSize: fontSize.md,
    color: colors.textInverse,
    textAlign: 'center',
  },
  modeHint: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    marginTop: spacing.md,
  },
  modeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  modeToggleTextContainer: {
    flex: 1,
  },
  modeToggleLabel: {
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  modeToggleDescription: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  modeToggleSwitch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: spacing.lg,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

