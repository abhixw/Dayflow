import { useRef, useState } from "react";
import { User as UserIcon, Pencil } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { WorkJourney } from "@/components/common/WorkJourney";
import { ProfileForm } from "@/components/forms/ProfileForm";
import { useMe, useUpdateMe, useUpdateMyProfilePicture } from "@/hooks/useEmployees";
import { formatDate, formatRole } from "@/utils/formatters";
import type { ApiError } from "@/types/auth";
import type { EmployeeUpdatePayload } from "@/types/employee";

function ReadOnlyField({ label, value, emptyText }: { label: string; value: string; emptyText?: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-sm text-slate-900">{value || <span className="text-slate-400">{emptyText ?? "—"}</span>}</p>
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
    return <LoadingState label="Loading your profile..." />;
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

  // About Me — built entirely from real fields; each piece is omitted, not
  // faked, when the underlying data isn't set.
  const jobLine = employee.jobTitle && employee.department
    ? `${employee.name} is a ${employee.jobTitle} in the ${employee.department} department.`
    : employee.jobTitle
      ? `${employee.name} is a ${employee.jobTitle}.`
      : employee.department
        ? `${employee.name} is part of the ${employee.department} department.`
        : `${employee.name}'s job details haven't been set up yet.`;

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
            {employee.jobTitle || "Job title not assigned"} · {employee.department || "Department not assigned"}
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
        <h2 className="text-base font-semibold text-slate-900">About me</h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-700">{jobLine}</p>
        <div className="mt-3 flex flex-col gap-1 text-sm text-slate-500">
          <p>
            Joined Dayflow:{" "}
            {employee.joiningDate ? (
              <span className="text-slate-700">{formatDate(employee.joiningDate)}</span>
            ) : (
              <span className="text-slate-400">Joining date not available</span>
            )}
          </p>
          {employee.address && <p>Location: <span className="text-slate-700">{employee.address}</span></p>}
        </div>
      </Card>

      <WorkJourney joiningDate={employee.joiningDate} />

      <Card className="p-6">
        <h2 className="text-base font-semibold text-slate-900">Job details</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ReadOnlyField label="Employee ID" value={employee.employeeId} />
          <ReadOnlyField label="Role" value={formatRole(employee.role)} />
          <ReadOnlyField label="Department" value={employee.department} emptyText="Department not assigned" />
          <ReadOnlyField label="Job title" value={employee.jobTitle} emptyText="Job title not assigned" />
          <ReadOnlyField label="Joining date" value={formatDate(employee.joiningDate)} emptyText="Joining date not available" />
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
              <ReadOnlyField label="Phone" value={employee.phone ?? ""} emptyText="Not provided" />
              <ReadOnlyField label="Address" value={employee.address ?? ""} emptyText="Not provided" />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
