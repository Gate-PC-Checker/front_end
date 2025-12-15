// Simple QR code data generator
// In production, you'd use a library like qrcode.react or jsqr
export function generateQRData(
  studentId: string,
  pcSerial: string,
  departmentId: string
): string {
  const timestamp = new Date().toISOString();
  // In production, this would be encrypted
  return `${studentId}_${pcSerial}_${departmentId}_${timestamp}`;
}

export function generateQRCode(
  studentId: string,
  pcSerial: string,
  departmentId: string
): {
  qrData: string;
  borderColor: string;
} {
  const qrData = generateQRData(studentId, pcSerial, departmentId);
  // Color rotates monthly
  const month = new Date().getMonth();
  const colors = [
    "#2563eb", // blue
    "#0891b2", // cyan
    "#059669", // green
    "#dc2626", // red
    "#9333ea", // purple
    "#ea580c", // orange
    "#d97706", // amber
    "#7c3aed", // violet
    "#06b6d4", // sky
    "#10b981", // emerald
    "#f59e0b", // yellow
    "#ec4899", // pink
  ];
  const borderColor = colors[month % colors.length];

  return { qrData, borderColor };
}

export function decodeQRData(qrData: string): {
  studentId: string;
  pcSerial: string;
  departmentId: string;
  timestamp: string;
} | null {
  try {
    const parts = qrData.split("_");
    if (parts.length !== 4) return null;

    return {
      studentId: parts[0],
      pcSerial: parts[1],
      departmentId: parts[2],
      timestamp: parts[3],
    };
  } catch {
    return null;
  }
}
