import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { getAuth, clearAuth, storeAuth, PC, PCHistory } from "@/lib/auth";
import { listMyDevices, reportLostDevice, getMeProfile, normalizeImageUrl } from "@/lib/backend";
import { QRCodeSVG } from "qrcode.react";
import {
  Plus,
  AlertTriangle,
  History,
  QrCode,
  Laptop,
  AlertCircle,
  CheckCircle,
  Building,
  Mail,
  Fingerprint,
  Calendar,
  ShieldAlert,
  Sparkles,
  Download,
  Camera,
  User,
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

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "https://gateguard-backend-zzto.onrender.com").replace(/\/+$/, "");

export default function StudentDashboard() {
  const navigate = useNavigate();
  const auth = getAuth("student");
  const [pcs, setPcs] = useState<PC[]>([]);
  const [history, setHistory] = useState<PCHistory[]>([]);
  const [departmentName, setDepartmentName] = useState<string>(auth?.user?.departmentId || "");
  const [profilePhoto, setProfilePhoto] = useState<string | undefined>(auth?.user?.photo);
  const [imgError, setImgError] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [userEmail, setUserEmail] = useState<string>(auth?.user?.email || "");
  const [showQRModal, setShowQRModal] = useState<string | null>(null);
  const [showLostReportModal, setShowLostReportModal] = useState(false);
  const [selectedPCForLost, setSelectedPCForLost] = useState<string | null>(null);
  const [reportingLost, setReportingLost] = useState(false);
  const [lostReportSuccess, setLostReportSuccess] = useState(false);
  const [brokenQrImages, setBrokenQrImages] = useState<Set<string>>(new Set());
  const photoInputRef = useRef<HTMLInputElement>(null);

  const buildQrFallbackUrl = (pc: PC) => {
    const qrData = pc.qrCode || pc.serialNumber;
    return `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(qrData || "N/A")}`;
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const token = sessionStorage.getItem("gateguard_access_token");
    if (!token) return;

    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("profile_image", file);

      const res = await fetch(`${API_BASE_URL}/api/auth/me/`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      const finalUrl = normalizeImageUrl(data.profile_image);

      setProfilePhoto(finalUrl);
      setImgError(false);

      if (auth) {
        storeAuth("student", token, { ...auth.user, photo: finalUrl });
      }

      toast.success("Profile photo updated successfully!");
    } catch {
      toast.error("Failed to upload photo. Please try again.");
    } finally {
      setUploadingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  };

  useEffect(() => {
    if (!auth) {
      navigate("/student/login");
      return;
    }

    const loadData = async () => {
      try {
        const [profile, response] = await Promise.all([
          getMeProfile().catch(() => null),
          listMyDevices(),
        ]);

        const devices = Array.isArray(response) ? response : response.results || [];

        const firstDeviceWithDpt = devices.find((d: any) => d.dpt_name);
        const resolvedDptName = (profile && (profile.dpt_name || profile.dpt_code))
          || (firstDeviceWithDpt && firstDeviceWithDpt.dpt_name)
          || (auth?.user?.departmentName)
          || "Engineering of Science";

        setDepartmentName(resolvedDptName);

        if (profile) {
          if (profile.profile_image) {
            const normalized = normalizeImageUrl(profile.profile_image);
            if (normalized) {
              setProfilePhoto(normalized);
              setImgError(false);
              if (auth) {
                storeAuth("student", auth.token, { ...auth.user, photo: normalized });
              }
            }
          }
          if (profile.email) {
            setUserEmail(profile.email);
          }
        }

        const mappedPcs: PC[] = devices.map((device: any) => ({
          id: device.id,
          serialNumber: device.serial_number || device.asset_tag || "N/A",
          model: device.model_name || "",
          brand: device.brand || "",
          purchaseDate: device.created_at || "",
          studentId: auth.user.id,
          qrCode: device.qr_token ? String(device.qr_token) : "",
          qrImage: normalizeImageUrl(device.qr_image),
          status: (device.status || "ACTIVE").toLowerCase() === "stolen"
            ? "blocked"
            : (device.status || "ACTIVE").toLowerCase() === "decommissioned"
              ? "replaced"
              : "active",
          rawStatus: device.status || "ACTIVE",
          createdAt: device.created_at || new Date().toISOString(),
        }));

        setPcs(mappedPcs);
        setHistory([]);
      } catch (error) {
        toast.error("Failed to load your registered PCs");
      }
    };

    loadData();
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
      await reportLostDevice(selectedPCForLost);

      const selectedPC = pcs.find((pc) => pc.id === selectedPCForLost);
      if (!selectedPC) return;

      setPcs((prevPcs) =>
        prevPcs.map((pc) =>
          pc.id === selectedPCForLost ? { ...pc, status: "blocked" } : pc
        )
      );

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

  const selectedQrPc = pcs.find((p) => p.id === showQRModal) || null;

  return (
    <PortalLayout
      title="Employee Portal"
      onLogout={handleLogout}
      showLogout={true}
    >
      <div className="space-y-8">
        {/* Hero User Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-r from-primary/15 via-secondary/15 to-accent/15 p-8 sm:p-10 shadow-xl backdrop-blur-xl">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-accent/20 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
            {/* Profile Photo Card */}
            <div className="relative group flex-shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden p-1 bg-gradient-to-br from-primary via-secondary to-accent shadow-lg shadow-primary/25 relative">
                {profilePhoto && !imgError ? (
                  <img
                    src={profilePhoto}
                    alt={auth.user.name}
                    className="w-full h-full rounded-xl object-cover bg-background"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <div className="w-full h-full rounded-xl bg-background/90 flex flex-col items-center justify-center text-primary font-bold text-lg border border-border">
                    {auth.user.name
                      ? auth.user.name
                          .split(" ")
                          .map((n: string) => n[0])
                          .filter(Boolean)
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()
                      : "EM"}
                  </div>
                )}

                {/* Upload Hover Overlay */}
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="absolute inset-1 rounded-xl bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer"
                  title="Change Profile Photo"
                >
                  <Camera className="w-5 h-5 mb-0.5" />
                  <span className="text-[10px] font-semibold">
                    {uploadingPhoto ? "..." : "Change"}
                  </span>
                </button>
              </div>

              {/* Hidden file input */}
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </div>

            <div className="flex-1 space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                <Fingerprint className="w-3.5 h-3.5" />
                Employee Account
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                {auth.user.name}
              </h1>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 sm:gap-6 pt-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5 font-medium">
                  <Fingerprint className="w-4 h-4 text-primary" />
                  ID: <span className="font-mono font-bold text-foreground">{auth.user.rollNumber}</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <Building className="w-4 h-4 text-secondary" />
                  <span className="text-foreground">{departmentName}</span>
                </div>
                {userEmail && (
                  <div className="flex items-center gap-1.5 font-medium">
                    <Mail className="w-4 h-4 text-accent" />
                    <span>{userEmail}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-0 w-full sm:w-auto">
              <Button
                variant="destructive"
                className="gap-2 rounded-xl shadow-md hover:shadow-lg transition-all"
                onClick={() => setShowLostReportModal(true)}
              >
                <AlertTriangle className="w-4 h-4" />
                Report Lost / Stolen
              </Button>
            </div>
          </div>
        </div>

        {/* Registered PCs Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Registered Laptops & PCs</h2>
              <p className="text-sm text-muted-foreground">Devices registered and verified under your account</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
              {pcs.length} {pcs.length === 1 ? "Device" : "Devices"} Total
            </span>
          </div>

          {pcs.length === 0 ? (
            <Card className="p-12 text-center border-dashed border-2 rounded-3xl bg-card/50">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 text-primary">
                <Laptop className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold mb-1">No PCs Registered Yet</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
                Your department administrator hasn't registered a PC for your account yet. Contact them to issue your device sticker.
              </p>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {pcs.map((pc) => {
                const isActive = pc.status === "active";
                return (
                  <Card
                    key={pc.id}
                    className="relative overflow-hidden rounded-3xl border border-border/80 bg-card/80 backdrop-blur-sm p-6 sm:p-7 shadow-lg hover:shadow-xl transition-all duration-300 group flex flex-col justify-between"
                  >
                    <div className="space-y-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/15 to-secondary/15 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                            <Laptop className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                              {pc.brand} {pc.model}
                            </h3>
                            <p className="text-xs text-muted-foreground font-mono">
                              SN: <span className="font-semibold text-foreground">{pc.serialNumber}</span>
                            </p>
                          </div>
                        </div>

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                            isActive
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              : "bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/20"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-red-500"}`} />
                          {pc.status}
                        </span>
                      </div>

                      {/* Device QR Code Visual Presentation */}
                      <div className="relative rounded-2xl p-5 bg-gradient-to-b from-muted/50 to-muted/20 border border-border/60 flex flex-col sm:flex-row items-center justify-center gap-6">
                        <div className="relative p-3 bg-white rounded-2xl shadow-md border-2 border-primary/20 flex items-center justify-center">
                          <QRCodeSVG
                            id={`qr-svg-${pc.id}`}
                            value={pc.qrCode || pc.serialNumber}
                            size={140}
                            level="H"
                            includeMargin={false}
                          />
                        </div>

                        <div className="space-y-2.5 text-xs text-center sm:text-left flex-1">
                          <div>
                            <span className="text-muted-foreground font-medium block">QR Security Token:</span>
                            <span className="font-mono text-xs text-primary font-bold break-all">{pc.qrCode || pc.serialNumber}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground font-medium block">Registered Date:</span>
                            <span className="font-medium text-foreground">
                              {new Date(pc.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 mt-6 border-t border-border/60 flex items-center gap-3">
                      <Button
                        className="flex-1 gap-2 rounded-xl"
                        variant="outline"
                        onClick={() => setShowQRModal(pc.id)}
                      >
                        <QrCode className="w-4 h-4 text-primary" />
                        Enlarge QR Code
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* QR Enlargement Modal */}
      {selectedQrPc && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in-50">
          <Card className="max-w-sm w-full p-6 rounded-3xl border border-white/20 shadow-2xl bg-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Verification QR Code</h3>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full w-8 h-8 p-0"
                onClick={() => setShowQRModal(null)}
              >
                ✕
              </Button>
            </div>

            <div className="p-6 bg-white rounded-2xl shadow-inner border border-primary/20 flex items-center justify-center mb-4">
              <QRCodeSVG
                value={selectedQrPc.qrCode || selectedQrPc.serialNumber}
                size={220}
                level="H"
                includeMargin={false}
              />
            </div>

            <div className="text-center space-y-1 mb-5">
              <p className="font-bold text-sm">{selectedQrPc?.brand} {selectedQrPc?.model}</p>
              <p className="text-xs text-muted-foreground font-mono">SN: {selectedQrPc?.serialNumber}</p>
            </div>

            <Button
              className="w-full rounded-xl"
              onClick={() => setShowQRModal(null)}
            >
              Done
            </Button>
          </Card>
        </div>
      )}

      {/* Lost Report Modal */}
      <Dialog open={showLostReportModal} onOpenChange={setShowLostReportModal}>
        <DialogContent className="max-w-md rounded-3xl p-6 sm:p-8">
          {lostReportSuccess ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Report Submitted</h2>
              <p className="text-muted-foreground text-sm">
                Your device status has been changed to <strong className="text-red-500">BLOCKED</strong>. Campus security has been alerted.
              </p>
            </div>
          ) : (
            <>
              <DialogHeader>
                <div className="w-12 h-12 rounded-2xl bg-destructive/15 text-destructive flex items-center justify-center mb-2">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <DialogTitle className="text-xl font-bold">
                  Report Lost / Stolen PC
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  Select your PC to flag it immediately. Campus gate scanners will flag this serial number on all exit/entry attempts.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-4">
                {pcs.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm">No registered PCs found</p>
                ) : (
                  pcs.map((pc) => (
                    <div
                      key={pc.id}
                      onClick={() => setSelectedPCForLost(pc.id)}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                        selectedPCForLost === pc.id
                          ? "border-destructive bg-destructive/10"
                          : "border-border/80 hover:border-destructive/40 bg-muted/30"
                      }`}
                    >
                      <div>
                        <p className="font-bold text-sm">
                          {pc.brand} {pc.model}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          SN: {pc.serialNumber}
                        </p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          selectedPCForLost === pc.id
                            ? "bg-destructive border-destructive text-white"
                            : "border-muted-foreground/40"
                        }`}
                      >
                        {selectedPCForLost === pc.id && <span className="text-[10px]">✓</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowLostReportModal(false);
                    setSelectedPCForLost(null);
                  }}
                  disabled={reportingLost}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReportLost}
                  disabled={!selectedPCForLost || reportingLost}
                  className="gap-2 rounded-xl shadow-md"
                >
                  {reportingLost ? "Reporting..." : "Confirm Stolen Report"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </PortalLayout>
  );
}
