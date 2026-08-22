import { useRef, useState } from "react";
import { User as UserIcon, Pencil } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { ProfileForm } from "@/components/forms/ProfileForm";
import { useMe, useUpdateMe, useUpdateMyProfilePicture } from "@/hooks/useEmployees";
import { formatDate, formatRole } from "@/utils/formatters";
import type { ApiError } from "@/types/auth";
import type { EmployeeUpdatePayload } from "@/types/employee";

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-sm text-slate-900">{value || "—"}</p>
    </div>
  );
}

export default function Profile() {
  const { data: employee, isLoading, isError, refetch } = useMe();
  const updateMe = useUpdateMe();
  const updatePicture = useUpdateMyProfilePicture();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pictureError, setPictureError] = useState<string | null>(null);

  if (isLoading) {
    return <LoadingState label="Loading profile..." />;
  }

  if (isError || !employee) {
    return <ErrorState message="Unable to load your profile." onRetry={() => refetch()} />;
  }

  async function handleSave(payload: EmployeeUpdatePayload) {
    setSaveError(null);
    try {
      await updateMe.mutateAsync(payload);
      setIsEditing(false);
    } catch (err) {
      setSaveError((err as ApiError).message);
    }
  }

  async function handlePictureChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setPictureError("Please choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPictureError("Image must be smaller than 5MB.");
      return;
    }

    setPictureError(null);
    try {
      await updatePicture.mutateAsync(file);
    } catch (err) {
      setPictureError((err as ApiError).message);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-slate-900">Profile</h1>

      <Card className="flex items-center gap-4 p-6">
        <div className="relative">
          {employee.profilePictureUrl ? (
            <img
              src={employee.profilePictureUrl}
              alt=""
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-600">
              <UserIcon className="h-7 w-7" aria-hidden="true" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <p className="text-lg font-semibold text-slate-900">{employee.name}</p>
          <p className="text-sm text-slate-500">
            {employee.jobTitle} · {employee.department}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePictureChange}
            aria-label="Upload profile picture"
          />
          <Button
            type="button"
            variant="secondary"
            isLoading={updatePicture.isPending}
            onClick={() => fileInputRef.current?.click()}
          >
            Change photo
          </Button>
        </div>
      </Card>
      {pictureError && <Alert variant="error">{pictureError}</Alert>}

      <Card className="p-6">
        <h2 className="text-base font-semibold text-slate-900">Job details</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ReadOnlyField label="Employee ID" value={employee.employeeId} />
          <ReadOnlyField label="Role" value={formatRole(employee.role)} />
          <ReadOnlyField label="Department" value={employee.department} />
          <ReadOnlyField label="Job title" value={employee.jobTitle} />
          <ReadOnlyField label="Joining date" value={formatDate(employee.joiningDate)} />
          <ReadOnlyField label="Email" value={employee.email} />
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Personal details</h2>
          {!isEditing && (
            <Button type="button" variant="ghost" onClick={() => setIsEditing(true)}>
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Edit
            </Button>
          )}
        </div>

        {saveError && (
          <div className="mt-4">
            <Alert variant="error">{saveError}</Alert>
          </div>
        )}

        <div className="mt-4">
          {isEditing ? (
            <ProfileForm
              defaultValues={{ phone: employee.phone ?? "", address: employee.address ?? "" }}
              onCancel={() => {
                setIsEditing(false);
                setSaveError(null);
              }}
              onSubmit={handleSave}
              isSubmitting={updateMe.isPending}
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ReadOnlyField label="Phone" value={employee.phone ?? ""} />
              <ReadOnlyField label="Address" value={employee.address ?? ""} />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
