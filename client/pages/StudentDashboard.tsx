import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { getAuth, clearAuth, PC, PCHistory } from "@/lib/auth";
import { generateQRCode } from "@/lib/qr-generator";
import {
  Plus,
  AlertTriangle,
  History,
  RefreshCw,
  QrCode,
  Download,
  Smartphone,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const auth = getAuth("student");
  const [pcs, setPcs] = useState<PC[]>([]);
  const [history, setHistory] = useState<PCHistory[]>([]);
  const [showQRModal, setShowQRModal] = useState<string | null>(null);
  const [showLostReportModal, setShowLostReportModal] = useState(false);
  const [selectedPCForLost, setSelectedPCForLost] = useState<string | null>(null);
  const [reportingLost, setReportingLost] = useState(false);
  const [lostReportSuccess, setLostReportSuccess] = useState(false);

  useEffect(() => {
    if (!auth) {
      navigate("/student/login");
      return;
    }

    // Simulated PC data
    setPcs([
      {
        id: "PC1",
        serialNumber: "DELL-XPS-20240115",
        model: "XPS 13",
        brand: "Dell",
        purchaseDate: "2024-01-15",
        studentId: auth.user.id,
        qrCode: generateQRCode(auth.user.id, "DELL-XPS-20240115", auth.user.departmentId)
          .qrData,
        status: "active",
        createdAt: "2024-01-15",
      },
      {
        id: "PC2",
        serialNumber: "HP-PAVILION-20231205",
        model: "Pavilion 15",
        brand: "HP",
        purchaseDate: "2023-12-05",
        studentId: auth.user.id,
        qrCode: generateQRCode(auth.user.id, "HP-PAVILION-20231205", auth.user.departmentId)
          .qrData,
        status: "active",
        createdAt: "2023-12-05",
      },
    ]);

    // Simulated history
    setHistory([
      {
        id: "H1",
        pcId: "PC1",
        studentId: auth.user.id,
        action: "registered",
        timestamp: "2024-01-15T10:30:00Z",
        details: "Initial registration",
      },
      {
        id: "H2",
        pcId: "PC1",
        studentId: auth.user.id,
        action: "scanned",
        timestamp: "2024-01-20T14:15:00Z",
        details: "Scanned at Main Gate",
      },
      {
        id: "H3",
        pcId: "PC2",
        studentId: auth.user.id,
        action: "registered",
        timestamp: "2023-12-05T09:00:00Z",
        details: "Initial registration",
      },
    ]);
  }, [auth, navigate]);

  const handleLogout = () => {
    clearAuth("student");
    navigate("/");
  };

  const handleReportLost = async () => {
    if (!selectedPCForLost) {
      toast.error("Please select a PC to report");
      return;
    }

    setReportingLost(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const selectedPC = pcs.find((pc) => pc.id === selectedPCForLost);
      if (!selectedPC) return;

      // Update PC status to blocked/reported
      setPcs((prevPcs) =>
        prevPcs.map((pc) =>
          pc.id === selectedPCForLost ? { ...pc, status: "blocked" } : pc
        )
      );

      // Add history entry
      const newHistoryEntry: PCHistory = {
        id: "H_" + Date.now(),
        pcId: selectedPCForLost,
        studentId: auth.user.id,
        action: "reported",
        timestamp: new Date().toISOString(),
        details: `PC reported as lost/stolen - Serial: ${selectedPC.serialNumber}`,
      };

      setHistory((prevHistory) => [newHistoryEntry, ...prevHistory]);

      setLostReportSuccess(true);
      toast.success(`PC "${selectedPC.brand} ${selectedPC.model}" reported as lost/stolen`);

      // Reset modal after 2 seconds
      setTimeout(() => {
        setShowLostReportModal(false);
        setSelectedPCForLost(null);
        setLostReportSuccess(false);
        setReportingLost(false);
      }, 2000);
    } catch (error) {
      toast.error("Failed to report PC. Please try again.");
      setReportingLost(false);
    }
  };

  if (!auth) return null;

  const { borderColor } = generateQRCode(
    auth.user.id,
    pcs[0]?.serialNumber || "",
    auth.user.departmentId
  );

  return (
    <PortalLayout
      title="Student Dashboard"
      onLogout={handleLogout}
      showLogout={true}
    >
      <div className="space-y-8">
        {/* Welcome Card */}
        <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-0">
          <div className="p-8">
            <h2 className="text-2xl font-bold mb-2">Welcome, {auth.user.name}</h2>
            <p className="text-muted-foreground">Roll No: {auth.user.rollNumber}</p>
            <p className="text-muted-foreground">Department: {auth.user.departmentId}</p>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="grid sm:grid-cols-3 gap-4">
          <Button className="gap-2 rounded-lg" size="lg">
            <Plus className="w-4 h-4" />
            Request New PC
          </Button>
          <Button
            variant="outline"
            className="gap-2 rounded-lg"
            size="lg"
            onClick={() => setShowLostReportModal(true)}
          >
            <AlertTriangle className="w-4 h-4" />
            Report Lost/Stolen
          </Button>
          <Button variant="outline" className="gap-2 rounded-lg" size="lg">
            <History className="w-4 h-4" />
            View Full History
          </Button>
        </div>

        {/* Registered PCs Section */}
        <div>
          <h3 className="text-2xl font-bold mb-6">Registered PCs</h3>

          {pcs.length === 0 ? (
            <Card className="p-8 text-center">
              <Smartphone className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">
                No PCs registered yet. Click "Request New PC" to register your device.
              </p>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {pcs.map((pc) => {
                const { borderColor: color } = generateQRCode(
                  pc.studentId,
                  pc.serialNumber,
                  "CSE"
                );
                return (
                  <Card
                    key={pc.id}
                    className="card-hover overflow-hidden flex flex-col"
                  >
                    <div className="p-6 pb-4">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="text-lg font-bold">{pc.brand}</h4>
                          <p className="text-sm text-muted-foreground">{pc.model}</p>
                        </div>
                        <div
                          className="px-3 py-1 rounded-full text-xs font-semibold"
                          style={{
                            backgroundColor: color + "20",
                            color: color,
                          }}
                        >
                          {pc.status.toUpperCase()}
                        </div>
                      </div>

                      <div className="space-y-2 text-sm mb-4">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Serial Number:</span>
                          <span className="font-medium font-mono">{pc.serialNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Purchase Date:</span>
                          <span className="font-medium">
                            {new Date(pc.purchaseDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Registered:</span>
                          <span className="font-medium">
                            {new Date(pc.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-card border-t border-border p-6 flex flex-col gap-3">
                      <Button
                        variant="outline"
                        className="w-full gap-2 rounded-lg"
                        onClick={() => setShowQRModal(pc.id)}
                      >
                        <QrCode className="w-4 h-4" />
                        View QR Code
                      </Button>
                      <Button variant="outline" className="w-full gap-2 rounded-lg">
                        <Download className="w-4 h-4" />
                        Download QR
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent History */}
        <div>
          <h3 className="text-2xl font-bold mb-6">Recent Activity</h3>
          <Card>
            <div className="divide-y divide-border">
              {history.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No activity recorded yet
                </div>
              ) : (
                history.map((item) => (
                  <div key={item.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium capitalize">{item.action}</p>
                      <p className="text-sm text-muted-foreground">{item.details}</p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-medium">
                        {pcs.find((p) => p.id === item.pcId)?.serialNumber}
                      </p>
                      <p className="text-muted-foreground">
                        {new Date(item.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full">
            <div className="p-8">
              <h3 className="text-xl font-bold mb-4">PC QR Code</h3>
              <div
                className="aspect-square bg-white rounded-lg p-6 mb-4 flex items-center justify-center"
                style={{ border: `3px solid ${borderColor}` }}
              >
                <div className="text-center">
                  <p className="text-xs text-gray-600 font-mono">
                    {pcs.find((p) => p.id === showQRModal)?.qrCode}
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Serial: {pcs.find((p) => p.id === showQRModal)?.serialNumber}
              </p>
              <Button
                className="w-full rounded-lg"
                onClick={() => setShowQRModal(null)}
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Lost Report Modal */}
      <Dialog open={showLostReportModal} onOpenChange={setShowLostReportModal}>
        <DialogContent className="max-w-md rounded-lg">
          {lostReportSuccess ? (
            <div className="text-center py-6">
              <div className="flex justify-center mb-4">
                <CheckCircle className="w-16 h-16 text-green-500" />
              </div>
              <h2 className="text-xl font-bold mb-2">Report Submitted</h2>
              <p className="text-muted-foreground mb-4">
                Your PC has been reported as lost/stolen. Security team has been notified.
              </p>
              <p className="text-sm text-muted-foreground">
                An SMS alert will be sent to security. QR code has been blocked.
              </p>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                  Report Lost/Stolen PC
                </DialogTitle>
                <DialogDescription>
                  Select the PC you want to report as lost or stolen. This will immediately
                  block its QR code.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-4">
                {pcs.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm">No PCs registered</p>
                ) : (
                  pcs.map((pc) => (
                    <div
                      key={pc.id}
                      onClick={() => setSelectedPCForLost(pc.id)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedPCForLost === pc.id
                          ? "border-red-500 bg-red-50 dark:bg-red-950"
                          : "border-border hover:border-red-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">
                            {pc.brand} {pc.model}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {pc.serialNumber}
                          </p>
                        </div>
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            selectedPCForLost === pc.id
                              ? "bg-red-500 border-red-500"
                              : "border-border"
                          }`}
                        >
                          {selectedPCForLost === pc.id && (
                            <span className="text-white text-xs">✓</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowLostReportModal(false);
                    setSelectedPCForLost(null);
                  }}
                  disabled={reportingLost}
                  className="rounded-lg"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReportLost}
                  disabled={!selectedPCForLost || reportingLost}
                  className="gap-2 rounded-lg"
                >
                  {reportingLost ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      Reporting...
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4" />
                      Report as Lost
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </PortalLayout>
  );
}
