"use client";

import Link from "next/link";
import { ArrowLeft, ImagePlus, Loader2, Trash2, Upload, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type {
  ManageHallCore,
  ManageHallEditorPayload,
  ManageHallPhoto,
} from "@/features/admin/schemas/manage-hall.schema";

type ManageHallEditorClientProps = {
  mode: "create" | "edit";
  initialData: {
    hall: ManageHallCore;
    host: ManageHallEditorPayload["host"];
    amenities: ManageHallEditorPayload["amenities"];
    photos: ManageHallPhoto[];
    amenityCatalog: ManageHallEditorPayload["amenityCatalog"];
  };
};

type EditablePhoto = {
  clientId: string;
  id?: string;
  path: string;
  altText: string;
  sortOrder: number;
  isCover: boolean;
  url: string | null;
};

type EditableState = {
  hall: ManageHallCore;
  host: {
    id: string;
    name: string | null;
    email: string | null;
  };
  amenities: {
    amenityIds: string[];
    customAmenities: string[];
  };
  photos: EditablePhoto[];
};

function toNullableNumber(raw: string) {
  const normalized = raw.trim();
  if (normalized.length === 0) {
    return null;
  }

  const value = Number(normalized);
  if (!Number.isFinite(value)) {
    return null;
  }

  return value;
}

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (slug.length > 0) {
    return slug;
  }

  return `hall-${Date.now()}`;
}

function createEditableState(initialData: ManageHallEditorClientProps["initialData"]): EditableState {
  return {
    hall: {
      ...initialData.hall,
      id: initialData.hall.id?.trim() || undefined,
      description: initialData.hall.description ?? null,
      addressLine2: initialData.hall.addressLine2 ?? null,
      postalCode: initialData.hall.postalCode ?? null,
      coverPhotoUrl: initialData.hall.coverPhotoUrl ?? null,
      latitude: initialData.hall.latitude ?? null,
      longitude: initialData.hall.longitude ?? null,
    },
    host: {
      id: initialData.host.id,
      name: initialData.host.name,
      email: initialData.host.email,
    },
    amenities: {
      amenityIds: [...initialData.amenities.amenityIds],
      customAmenities: [...initialData.amenities.customAmenities],
    },
    photos: initialData.photos.map((photo, index) => ({
      clientId: `${photo.id ?? "photo"}-${index}-${crypto.randomUUID()}`,
      id: photo.id,
      path: photo.path,
      altText: photo.altText ?? "",
      sortOrder: photo.sortOrder,
      isCover: photo.isCover,
      url: photo.url,
    })),
  };
}

function resolvePhotoPreviewUrl(photo: EditablePhoto) {
  if (photo.url) {
    return photo.url;
  }

  if (
    photo.path.startsWith("http://") ||
    photo.path.startsWith("https://") ||
    photo.path.startsWith("//")
  ) {
    return photo.path;
  }

  return null;
}

export function ManageHallEditorClient({ mode, initialData }: ManageHallEditorClientProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [state, setState] = useState<EditableState>(() => createEditableState(initialData));
  const [removedPhotoIds, setRemovedPhotoIds] = useState<string[]>([]);
  const [manualImageUrl, setManualImageUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const hasSavedHall = Boolean(state.hall.id);

  const customAmenitiesText = useMemo(
    () => state.amenities.customAmenities.join("\n"),
    [state.amenities.customAmenities],
  );

  function updateHallField<K extends keyof ManageHallCore>(key: K, value: ManageHallCore[K]) {
    setState((current) => ({
      ...current,
      hall: {
        ...current.hall,
        [key]: value,
      },
    }));
  }

  function handleAmenityToggle(amenityId: string, checked: boolean) {
    setState((current) => {
      const nextIds = checked
        ? [...current.amenities.amenityIds, amenityId]
        : current.amenities.amenityIds.filter((id) => id !== amenityId);

      return {
        ...current,
        amenities: {
          ...current.amenities,
          amenityIds: Array.from(new Set(nextIds)),
        },
      };
    });
  }

  function handleCustomAmenitiesChange(value: string) {
    const lines = value
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    setState((current) => ({
      ...current,
      amenities: {
        ...current.amenities,
        customAmenities: Array.from(new Set(lines)),
      },
    }));
  }

  function appendPhoto(path: string, url: string | null) {
    const normalizedPath = path.trim();
    if (normalizedPath.length === 0) {
      return;
    }

    setState((current) => {
      const hasCover = current.photos.some((photo) => photo.isCover);
      const nextPhotos = [
        ...current.photos,
        {
          clientId: `photo-${crypto.randomUUID()}`,
          path: normalizedPath,
          altText: "",
          sortOrder: current.photos.length,
          isCover: !hasCover,
          url,
        },
      ];

      return {
        ...current,
        photos: nextPhotos,
      };
    });
  }

  function removePhoto(photoClientId: string) {
    setState((current) => {
      const target = current.photos.find((photo) => photo.clientId === photoClientId);
      if (!target) {
        return current;
      }

      if (target.id) {
        setRemovedPhotoIds((existing) => Array.from(new Set([...existing, target.id as string])));
      }

      const nextPhotos = current.photos
        .filter((photo) => photo.clientId !== photoClientId)
        .map((photo, index) => ({
          ...photo,
          sortOrder: index,
        }));

      if (nextPhotos.length > 0 && !nextPhotos.some((photo) => photo.isCover)) {
        nextPhotos[0] = {
          ...nextPhotos[0],
          isCover: true,
        };
      }

      return {
        ...current,
        photos: nextPhotos,
      };
    });
  }

  function setCoverPhoto(photoClientId: string) {
    setState((current) => ({
      ...current,
      photos: current.photos.map((photo) => ({
        ...photo,
        isCover: photo.clientId === photoClientId,
      })),
    }));
  }

  async function uploadImageFile(file: File) {
    if (!state.hall.id) {
      toast.error("Save the hall first before uploading photos.");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const presignedResponse = await fetch("/api/halls/photos/presigned-upload", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          hallId: state.hall.id,
          fileName: file.name,
          contentType: file.type || "application/octet-stream",
        }),
      });

      const presignedPayload = (await presignedResponse.json().catch(() => null)) as
        | { error?: string; uploadUrl?: string; path?: string }
        | null;

      if (!presignedResponse.ok || !presignedPayload?.uploadUrl || !presignedPayload.path) {
        throw new Error(presignedPayload?.error ?? "Unable to get upload URL.");
      }

      const uploadResponse = await fetch(presignedPayload.uploadUrl, {
        method: "PUT",
        headers: {
          "content-type": file.type || "application/octet-stream",
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file.");
      }

      appendPhoto(presignedPayload.path, URL.createObjectURL(file));
      toast.success("Photo uploaded.");
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : "Failed to upload image.";
      setError(message);
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  }

  async function handleUploadInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    await uploadImageFile(file);
    event.target.value = "";
  }

  function handleAddImageUrl() {
    const nextUrl = manualImageUrl.trim();
    if (nextUrl.length === 0) {
      return;
    }

    appendPhoto(nextUrl, nextUrl);
    setManualImageUrl("");
  }

  async function syncFromServer(hallId: string) {
    const response = await fetch(`/api/admin/halls/${hallId}`, { cache: "no-store" });
    const payload = (await response.json().catch(() => null)) as
      | ManageHallEditorPayload
      | { error?: string }
      | null;

    if (!response.ok || !payload || "error" in payload) {
      throw new Error(
        payload && "error" in payload && payload.error ? payload.error : "Failed to refresh hall data.",
      );
    }

    const nextState = createEditableState(
      payload as ManageHallEditorClientProps["initialData"],
    );
    setState(nextState);
    setRemovedPhotoIds([]);
  }

  async function saveHall() {
    setIsSaving(true);
    setError(null);

    try {
      const slugToUse = state.hall.slug.trim().length > 0 ? state.hall.slug.trim() : slugify(state.hall.name);

      const payload = {
        hall: {
          ...state.hall,
          slug: slugToUse,
          name: state.hall.name.trim(),
          hostUserId: state.hall.hostUserId.trim(),
          description: state.hall.description?.trim() || null,
          addressLine1: state.hall.addressLine1.trim(),
          addressLine2: state.hall.addressLine2?.trim() || null,
          city: state.hall.city.trim(),
          state: state.hall.state.trim(),
          postalCode: state.hall.postalCode?.trim() || null,
          country: state.hall.country.trim(),
          latitude: state.hall.latitude ?? null,
          longitude: state.hall.longitude ?? null,
          coverPhotoUrl: state.hall.coverPhotoUrl?.trim() || null,
        },
        amenities: {
          amenityIds: state.amenities.amenityIds,
          customAmenities: state.amenities.customAmenities,
        },
        photos: state.photos.map((photo, index) => ({
          id: photo.id,
          path: photo.path.trim(),
          altText: photo.altText.trim() || null,
          sortOrder: index,
          isCover: photo.isCover,
        })),
        removedPhotoIds,
      };

      const endpoint = state.hall.id ? `/api/admin/halls/${state.hall.id}` : "/api/admin/halls";
      const method = state.hall.id ? "PATCH" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = (await response.json().catch(() => null)) as
        | { error?: string; hallId?: string }
        | null;

      if (!response.ok) {
        throw new Error(result?.error ?? "Unable to save hall.");
      }

      const nextHallId = result?.hallId ?? state.hall.id;
      if (!nextHallId) {
        throw new Error("Unable to resolve hall ID after save.");
      }

      if (!state.hall.id) {
        toast.success("Hall created.");
        router.replace(`/admin/halls/${nextHallId}`);
        return;
      }

      await syncFromServer(nextHallId);
      toast.success("Hall updated.");
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Failed to save hall.";
      setError(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <Button asChild type="button" variant="outline" className="gap-2 border-zinc-300 bg-white">
          <Link href="/admin/halls">
            <ArrowLeft className="size-4" />
            Back
          </Link>
        </Button>

        <Button
          type="button"
          className="gap-2"
          onClick={() => {
            void saveHall();
          }}
          disabled={isSaving}
        >
          {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
          Save Hall
        </Button>
      </div>

      {error ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,860px)_minmax(0,476px)]">
        <div className="space-y-4">
          <Card className="gap-4 rounded-[14px] border-zinc-200 py-4">
            <CardHeader className="px-4">
              <CardTitle className="text-xl">Basic Information</CardTitle>
              <CardDescription>Edit only database-backed hall fields and photo records.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-4">
              <div className="flex items-center gap-3 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-3">
                <div className="flex size-10 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-600">
                  <UserRound className="size-5" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-medium uppercase tracking-[0.06em] text-zinc-500">Host</p>
                  <p className="text-sm font-semibold text-zinc-900">
                    {state.host.name?.trim() || "Unassigned Host"}
                  </p>
                  <p className="text-xs text-zinc-600">{state.host.email?.trim() || "No email available"}</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="hall-name">Hall Name</Label>
                  <Input
                    id="hall-name"
                    value={state.hall.name}
                    onChange={(event) => {
                      const nextName = event.target.value;
                      updateHallField("name", nextName);

                      if (mode === "create" && state.hall.slug.trim().length === 0) {
                        updateHallField("slug", slugify(nextName));
                      }
                    }}
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="hall-status">Status</Label>
                  <Select
                    value={state.hall.status}
                    onValueChange={(value) => updateHallField("status", value as ManageHallCore["status"])}
                  >
                    <SelectTrigger id="hall-status">
                      <SelectValue placeholder="Select hall status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">draft</SelectItem>
                      <SelectItem value="published">published</SelectItem>
                      <SelectItem value="archived">archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hall-description">Description</Label>
                <Textarea
                  id="hall-description"
                  className="min-h-24"
                  value={state.hall.description ?? ""}
                  onChange={(event) => updateHallField("description", event.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="gap-4 rounded-[14px] border-zinc-200 py-4">
            <CardHeader className="px-4">
              <CardTitle className="text-xl">Address and Location</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 px-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="address-line-1">Address Line 1</Label>
                <Input
                  id="address-line-1"
                  value={state.hall.addressLine1}
                  onChange={(event) => updateHallField("addressLine1", event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postal-code">Postal Code</Label>
                <Input
                  id="postal-code"
                  value={state.hall.postalCode ?? ""}
                  onChange={(event) => updateHallField("postalCode", event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address-line-2">Address Line 2 (optional)</Label>
                <Input
                  id="address-line-2"
                  value={state.hall.addressLine2 ?? ""}
                  onChange={(event) => updateHallField("addressLine2", event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={state.hall.country}
                  onChange={(event) => updateHallField("country", event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={state.hall.city}
                  onChange={(event) => updateHallField("city", event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={state.hall.state}
                  onChange={(event) => updateHallField("state", event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude (optional)</Label>
                <Input
                  id="latitude"
                  value={state.hall.latitude ?? ""}
                  onChange={(event) => updateHallField("latitude", toNullableNumber(event.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude (optional)</Label>
                <Input
                  id="longitude"
                  value={state.hall.longitude ?? ""}
                  onChange={(event) => updateHallField("longitude", toNullableNumber(event.target.value))}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="gap-4 rounded-[14px] border-zinc-200 py-4">
            <CardHeader className="px-4">
              <CardTitle className="text-xl">Pricing and Capacity</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 px-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="max-capacity">Maximum Capacity</Label>
                <Input
                  id="max-capacity"
                  type="number"
                  min={1}
                  value={state.hall.maxCapacity}
                  onChange={(event) =>
                    updateHallField("maxCapacity", Number.parseInt(event.target.value || "0", 10))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cleaning-fee">Cleaning Fee (MYR)</Label>
                <Input
                  id="cleaning-fee"
                  type="number"
                  min={0}
                  value={state.hall.cleaningFeeMyr}
                  onChange={(event) =>
                    updateHallField("cleaningFeeMyr", Number.parseInt(event.target.value || "0", 10))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="base-price">Base Price (MYR)</Label>
                <Input
                  id="base-price"
                  type="number"
                  min={0}
                  value={state.hall.basePriceMyr}
                  onChange={(event) =>
                    updateHallField("basePriceMyr", Number.parseInt(event.target.value || "0", 10))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="service-fee">Service Fee (MYR)</Label>
                <Input
                  id="service-fee"
                  type="number"
                  min={0}
                  value={state.hall.serviceFeeMyr}
                  onChange={(event) =>
                    updateHallField("serviceFeeMyr", Number.parseInt(event.target.value || "0", 10))
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card className="gap-4 rounded-[14px] border-zinc-200 py-4">
            <CardHeader className="px-4">
              <CardTitle className="text-xl">Amenities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-4">
              <div className="grid gap-2 sm:grid-cols-2">
                {initialData.amenityCatalog.map((amenity) => {
                  const checked = state.amenities.amenityIds.includes(amenity.id);

                  return (
                    <label
                      key={amenity.id}
                      className="flex items-start gap-2 rounded-md border border-zinc-200 px-3 py-2 text-sm"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(value) => handleAmenityToggle(amenity.id, value === true)}
                        className="mt-0.5"
                      />
                      <span>{amenity.label}</span>
                    </label>
                  );
                })}
              </div>

              <div className="space-y-2">
                <Label htmlFor="custom-amenities">Custom Amenities (one per line)</Label>
                <Textarea
                  id="custom-amenities"
                  className="min-h-24"
                  value={customAmenitiesText}
                  onChange={(event) => handleCustomAmenitiesChange(event.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="gap-4 rounded-[14px] border-zinc-200 py-4">
            <CardHeader className="px-4">
              <CardTitle className="text-xl">Photos</CardTitle>
              <CardDescription>
                Drop photos, upload files, or paste a URL. Preview appears below.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-4">
              <div className="space-y-3 rounded-lg border border-zinc-200 bg-zinc-100/70 p-4 text-center">
                <p className="text-sm font-semibold text-zinc-900">Drop image files here</p>
                <p className="text-xs text-zinc-600">or click an action</p>
                <div className="flex flex-wrap justify-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!hasSavedHall || isUploading}
                  >
                    {isUploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                    Upload Image
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleAddImageUrl}
                    disabled={manualImageUrl.trim().length === 0}
                  >
                    <ImagePlus className="size-4" />
                    Use URL
                  </Button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(event) => {
                    void handleUploadInputChange(event);
                  }}
                />
                {!hasSavedHall ? (
                  <p className="text-xs text-zinc-500">Save hall once before uploading files.</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="manual-image-url">Image URL (optional)</Label>
                <Input
                  id="manual-image-url"
                  value={manualImageUrl}
                  onChange={(event) => setManualImageUrl(event.target.value)}
                  placeholder="https://images.unsplash.com/..."
                />
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-semibold text-zinc-900">Uploaded / Selected Photos</h3>
                {state.photos.length === 0 ? (
                  <p className="text-sm text-zinc-500">No photos yet.</p>
                ) : null}
                <div className="grid gap-2 sm:grid-cols-3">
                  {state.photos.map((photo) => {
                    const previewUrl = resolvePhotoPreviewUrl(photo);

                    return (
                      <div key={photo.clientId} className="overflow-hidden rounded-lg border border-zinc-200 text-left">
                        <div
                          className="h-20 w-full border-b border-zinc-200 bg-zinc-200 bg-cover bg-center"
                          style={previewUrl ? { backgroundImage: `url(${previewUrl})` } : undefined}
                        />
                        <div className="space-y-1 px-2 py-2">
                          <p className="truncate text-[11px] text-zinc-600">
                            {photo.isCover ? "cover" : "gallery"} - image
                          </p>
                          <div className="flex gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6 px-0 text-[11px] text-zinc-700"
                              onClick={() => setCoverPhoto(photo.clientId)}
                              disabled={photo.isCover}
                            >
                              Set cover
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6 px-0 text-[11px] text-rose-600 hover:text-rose-700"
                              onClick={() => removePhoto(photo.clientId)}
                            >
                              <Trash2 className="size-3.5" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
