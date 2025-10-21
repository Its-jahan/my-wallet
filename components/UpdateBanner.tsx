"use client";

import { formatJalali } from "@/lib/dayjs";

interface UpdateBannerProps {
  visible: boolean;
  lastUpdated?: string;
  onRefresh?: () => void;
  onClose?: () => void;
}

export const UpdateBanner = ({ visible, lastUpdated, onRefresh, onClose }: UpdateBannerProps) => {
  if (!visible) return null;
  return (
    <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-700 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="font-semibold">نرخ‌های نمایش داده شده ممکن است قدیمی باشند.</p>
          {lastUpdated ? (
            <p className="text-sm text-amber-600">
              آخرین به‌روزرسانی موفق: {formatJalali(lastUpdated, "YYYY/MM/DD HH:mm")}
            </p>
          ) : (
            <p className="text-sm text-amber-600">در حال تلاش برای دریافت اطلاعات جدید...</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <button type="button" className="btn-primary bg-amber-600 text-white hover:bg-amber-700" onClick={onRefresh}>
              تلاش دوباره
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-amber-200 px-4 py-2 text-sm font-medium text-amber-600 hover:bg-amber-100"
            >
              بستن
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
