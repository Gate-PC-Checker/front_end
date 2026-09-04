import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { getAuth, clearAuth, Student } from "@/lib/auth";
import { listUsers, createDevice, normalizeImageUrl } from "@/lib/backend";
import { generateQRCode } from "@/lib/qr-generator";
import {
  AlertCircle,
  CheckCircle,
  Loader,
  ArrowLeft,
  Download,
  RefreshCw,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

type RegistrationStep = "select-student" | "enter-details" | "verify-serial" | "success";

interface PCDetails {
  serialNumber: string;
  model: string;
  brand: string;
  purchaseDate: string;
}

interface RegistrationData {
  student: Student | null;
  pc: PCDetails;
  qrImage: string;
  qrToken: string;
  borderColor: string;
}

export default function DepartmentPCRegistration() {
  const navigate = useNavigate();
  const auth = getAuth("department");
  const departmentId = auth?.user?.dptId || auth?.user?.id;

  const [step, setStep] = useState<RegistrationStep>("select-student");
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  const [pcDetails, setPcDetails] = useState<PCDetails>({
    serialNumber: "",
    model: "",
    brand: "",
    purchaseDate: "",
  });

  const [serialError, setSerialError] = useState("");
  const [isValidatingSerial, setIsValidatingSerial] = useState(false);
  const [registrationData, setRegistrationData] = useState<RegistrationData | null>(null);
  const [generalError, setGeneralError] = useState("");

  useEffect(() => {
    if (!auth) {
      navigate("/dept/login");
      return;
    }

    loadStudents();
  }, [auth, navigate]);

  const loadStudents = async () => {
    setIsLoadingStudents(true);
    try {
      const response = await listUsers();
      const users = Array.isArray(response) ? response : response.results || [];
      const mappedUsers: Student[] = users.map((user: any) => ({
        id: user.id,
        rollNumber: user.username || user.email || "N/A",
        name: `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.username,
        email: user.email || "",
        phone: user.phone || "",
        departmentId: auth?.user.code || user.dpt || "",
        photo: normalizeImageUrl(user.profile_image),
      }));
      setStudents(mappedUsers);
    } catch (err) {
      setGeneralError("Failed to load students");
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.rollNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    setStep("enter-details");
  };

  const handleInputChange = (field: keyof PCDetails, value: string) => {
    setPcDetails((prev) => ({
      ...prev,
      [field]: field === "serialNumber" ? value.toUpperCase() : value,
    }));
    setSerialError("");
  };

  const validateSerial = async () => {
    setSerialError("");
    setIsValidatingSerial(true);

    try {
      if (!pcDetails.serialNumber) {
        throw new Error("Please enter serial number");
      }

      if (!pcDetails.model || !pcDetails.brand || !pcDetails.purchaseDate) {
        throw new Error("Please fill in all PC details");
      }

      const createdDevice: any = await createDevice({
        asset_tag: pcDetails.serialNumber,
        brand: pcDetails.brand,
        model_name: pcDetails.model,
        serial_number: pcDetails.serialNumber,
        owner: selectedStudent?.id,
        dpt: departmentId || undefined,
      });

      if (selectedStudent) {
        const qrToken = createdDevice?.qr_token || pcDetails.serialNumber;
        const qrImage = createdDevice?.qr_image || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrToken)}`;

        setRegistrationData({
          student: selectedStudent,
          pc: pcDetails,
          qrImage,
          qrToken,
          borderColor: "#2563eb",
        });

        setStep("success");
      }
    } catch (err) {
      setSerialError(err instanceof Error ? err.message : "Validation failed");
    } finally {
      setIsValidatingSerial(false);
    }
  };

  const handleLogout = () => {
    clearAuth("department");
    navigate("/");
  };

  if (!auth) return null;

  return (
    <PortalLayout
      title="PC Registration"
      onLogout={handleLogout}
      showLogout={true}
    >
      <div className="max-w-3xl mx-auto">
        {generalError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{generalError}</AlertDescription>
          </Alert>
        )}

        {/* Step 1: Select Student */}
        {step === "select-student" && (
          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-6">Step 1: Select Employee</h2>
            <p className="text-muted-foreground mb-6">
              Choose an employee to register their PC
            </p>

            <div className="mb-6">
              <Input
                placeholder="Search by name or ID number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-lg"
              />
            </div>

            {isLoadingStudents ? (
              <div className="text-center py-12">
                <Loader className="w-8 h-8 animate-spin mx-auto text-primary" />
                <p className="text-muted-foreground mt-4">Loading employees...</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {filteredStudents.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No employees found
                  </p>
                ) : (
                  filteredStudents.map((student) => (
                    <Card
                      key={student.id}
                      className="p-4 cursor-pointer hover:bg-muted/50 transition-colors border-2 hover:border-primary"
                      onClick={() => handleSelectStudent(student)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {student.photo ? (
                            <img
                              src={normalizeImageUrl(student.photo)}
                              alt={student.name}
                              className="w-10 h-10 rounded-xl object-cover border border-border"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs uppercase">
                              {student.name
                                ? student.name
                                    .split(" ")
                                    .map((n: string) => n[0])
                                    .filter(Boolean)
                                    .slice(0, 2)
                                    .join("")
                                : "EM"}
                            </div>
                          )}
                          <div>
                            <p className="font-bold">{student.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {student.rollNumber}
                            </p>
                          </div>
                        </div>
                        <span className="text-muted-foreground">→</span>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            )}
          </Card>
        )}

        {/* Step 2: Enter PC Details */}
        {step === "enter-details" && selectedStudent && (
          <Card className="p-8">
            <Button
              variant="ghost"
              className="mb-6 gap-2"
              onClick={() => {
                setStep("select-student");
                setSelectedStudent(null);
                setPcDetails({ serialNumber: "", model: "", brand: "", purchaseDate: "" });
              }}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>

            <h2 className="text-2xl font-bold mb-2">Step 2: Enter PC Details</h2>
            <div className="mb-6 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Employee:</p>
              <div className="flex items-center gap-3 mt-2">
                {selectedStudent.photo ? (
                  <img
                    src={normalizeImageUrl(selectedStudent.photo)}
                    alt={selectedStudent.name}
                    className="w-10 h-10 rounded-xl object-cover border border-border"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs uppercase">
                    {selectedStudent.name
                      ? selectedStudent.name
                          .split(" ")
                          .map((n: string) => n[0])
                          .filter(Boolean)
                          .slice(0, 2)
                          .join("")
                      : "EM"}
                  </div>
                )}
                <div>
                  <p className="font-bold">{selectedStudent.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedStudent.rollNumber}
                  </p>
                </div>
              </div>
            </div>

            {serialError && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{serialError}</AlertDescription>
              </Alert>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                validateSerial();
              }}
              className="space-y-4"
            >
              <div>
                <label htmlFor="serialNumber" className="block text-sm font-medium mb-2">
                  PC Serial Number *
                </label>
                <Input
                  id="serialNumber"
                  placeholder="e.g., DELL-XPS-20240115"
                  value={pcDetails.serialNumber}
                  onChange={(e) => handleInputChange("serialNumber", e.target.value)}
                  className="rounded-lg font-mono"
                  disabled={isValidatingSerial}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Unique identifier for the device
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="brand" className="block text-sm font-medium mb-2">
                    Brand *
                  </label>
                  <Input
                    id="brand"
                    placeholder="e.g., Dell, HP, Lenovo"
                    value={pcDetails.brand}
                    onChange={(e) => handleInputChange("brand", e.target.value)}
                    className="rounded-lg"
                    disabled={isValidatingSerial}
                  />
                </div>

                <div>
                  <label htmlFor="model" className="block text-sm font-medium mb-2">
                    Model *
                  </label>
                  <Input
                    id="model"
                    placeholder="e.g., XPS 13, Pavilion 15"
                    value={pcDetails.model}
                    onChange={(e) => handleInputChange("model", e.target.value)}
                    className="rounded-lg"
                    disabled={isValidatingSerial}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="purchaseDate" className="block text-sm font-medium mb-2">
                  Purchase Date *
                </label>
                <Input
                  id="purchaseDate"
                  type="date"
                  value={pcDetails.purchaseDate}
                  onChange={(e) => handleInputChange("purchaseDate", e.target.value)}
                  className="rounded-lg"
                  disabled={isValidatingSerial}
                />
              </div>

              <Button
                type="submit"
                className="w-full rounded-lg gap-2 mt-6"
                disabled={isValidatingSerial}
                size="lg"
              >
                {isValidatingSerial ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Validating Serial Number...
                  </>
                ) : (
                  "Verify & Generate QR Code"
                )}
              </Button>
            </form>
          </Card>
        )}

        {/* Step 3: Success - QR Code Generated */}
        {step === "success" && registrationData && (
          <Card className="p-8">
            <div className="text-center mb-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold">PC Successfully Registered!</h2>
              <p className="text-muted-foreground mt-2">
                QR code has been generated and is ready to print and attach to the device.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* Details */}
              <div className="space-y-4">
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-xs text-muted-foreground font-semibold mb-2">
                    STUDENT
                  </p>
                  <div className="flex items-center gap-3">
                    {registrationData.student.photo ? (
                      <img
                        src={normalizeImageUrl(registrationData.student.photo)}
                        alt={registrationData.student.name}
                        className="w-10 h-10 rounded-xl object-cover border border-border"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs uppercase">
                        {registrationData.student.name
                          ? registrationData.student.name
                              .split(" ")
                              .map((n: string) => n[0])
                              .filter(Boolean)
                              .slice(0, 2)
                              .join("")
                          : "EM"}
                      </div>
                    )}
                    <div>
                      <p className="font-bold">{registrationData.student.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {registrationData.student.rollNumber}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold mb-1">
                      BRAND / MODEL
                    </p>
                    <p className="font-medium">
                      {registrationData.pc.brand} {registrationData.pc.model}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold mb-1">
                      SERIAL NUMBER
                    </p>
                    <p className="font-medium font-mono">
                      {registrationData.pc.serialNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold mb-1">
                      PURCHASE DATE
                    </p>
                    <p className="font-medium">
                      {new Date(registrationData.pc.purchaseDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center justify-center">
                <div
                  className="bg-white rounded-xl p-4 flex items-center justify-center mb-3 shadow-md border-4"
                  style={{
                    borderColor: registrationData.borderColor,
                    boxShadow: `0 0 20px ${registrationData.borderColor}40`,
                  }}
                >
                  <img
                    src={registrationData.qrImage}
                    alt={`QR code for ${registrationData.pc.serialNumber}`}
                    className="w-52 h-52 object-contain rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(registrationData.qrToken)}`;
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center font-mono mb-4">
                  Token: {registrationData.qrToken}
                </p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-900">
                <strong>Next Steps:</strong> Print this QR code on a durable vinyl sticker with the
                campus logo and attach it to the device. Send SMS confirmation to the employee.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="gap-2 rounded-lg"
                size="lg"
                onClick={() => {
                  const link = document.createElement("a");
                  link.href = registrationData.qrImage;
                  link.download = `QR_${registrationData.pc.serialNumber}.png`;
                  link.target = "_blank";
                  link.click();
                }}
              >
                <Download className="w-4 h-4" />
                Download QR
              </Button>
              <Button
                className="gap-2 rounded-lg"
                size="lg"
                onClick={() => {
                  setStep("select-student");
                  setSelectedStudent(null);
                  setPcDetails({
                    serialNumber: "",
                    model: "",
                    brand: "",
                    purchaseDate: "",
                  });
                  setRegistrationData(null);
                }}
              >
                <RefreshCw className="w-4 h-4" />
                Register Another PC
              </Button>
            </div>
          </Card>
        )}
      </div>
    </PortalLayout>
  );
}
