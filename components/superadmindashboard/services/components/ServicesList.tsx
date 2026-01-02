'use client';

import { Pencil, Trash2, Check, X, Eye, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import type { AdditionalService, ServiceCategory, ServiceStatus } from '@/lib/types/services';

interface StatusConfig {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
}

interface ServicesListProps {
  services: AdditionalService[];
  categories: ServiceCategory[];
  statusConfig: Record<ServiceStatus, StatusConfig>;
  onEdit: (service: AdditionalService) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: ServiceStatus) => void;
  deletingId: string | null;
  setDeletingId: (id: string | null) => void;
  updatingStatus: string | null;
}

export default function ServicesList({
  services,
  categories,
  statusConfig,
  onEdit,
  onDelete,
  onStatusChange,
  deletingId,
  setDeletingId,
  updatingStatus,
}: ServicesListProps) {
  const getCategoryName = (categoryId: string | null | undefined) => {
    if (!categoryId) return '-';
    const category = categories.find(c => c.id === categoryId);
    return category?.name_ka || '-';
  };

  const getFirstImage = (service: AdditionalService) => {
    if (service.gallery_images && service.gallery_images.length > 0) {
      return service.gallery_images[0].url;
    }
    return null;
  };

  if (services.length === 0) {
    return (
      <div className="bg-background/50 backdrop-blur-sm border border-border rounded-xl p-12 text-center">
        <p className="text-foreground/60">სერვისები არ მოიძებნა</p>
      </div>
    );
  }

  return (
    <div className="bg-background/50 backdrop-blur-sm border border-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-foreground/5">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-foreground/60 uppercase">სურათი</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-foreground/60 uppercase">სახელი</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-foreground/60 uppercase">კატეგორია</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-foreground/60 uppercase">ლოკაციები</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-foreground/60 uppercase">სტატუსი</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-foreground/60 uppercase">მოქმედებები</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {services.map((service) => {
              const status = statusConfig[service.status];
              const StatusIcon = status.icon;
              const isDeleting = deletingId === service.id;
              const isUpdating = updatingStatus === service.id;
              const imageUrl = getFirstImage(service);

              return (
                <tr key={service.id} className="hover:bg-foreground/5 transition-colors">
                  {/* Image */}
                  <td className="px-4 py-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-foreground/10">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={service.name_ka}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-foreground/30">
                          <Eye className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Name */}
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-foreground">{service.name_ka}</p>
                      <p className="text-xs text-foreground/50">{service.name_en}</p>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-foreground/10 rounded text-xs">
                      {getCategoryName(service.category_id)}
                    </span>
                  </td>

                  {/* Locations */}
                  <td className="px-4 py-3">
                    <span className="text-sm text-foreground/70">
                      {service.location_ids?.length || 0} ლოკაცია
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <div className="relative">
                      <select
                        value={service.status}
                        onChange={(e) => onStatusChange(service.id, e.target.value as ServiceStatus)}
                        disabled={isUpdating}
                        className={`appearance-none cursor-pointer px-3 py-1.5 pr-8 rounded-lg text-xs font-medium ${status.bg} ${status.color} border-0 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50`}
                      >
                        <option value="draft">დრაფტი</option>
                        <option value="pending">მოლოდინში</option>
                        <option value="active">აქტიური</option>
                        <option value="hidden">დამალული</option>
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none" />
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onEdit(service)}
                        className="p-2 rounded-lg hover:bg-foreground/10 text-foreground/60 hover:text-foreground transition-colors"
                        title="რედაქტირება"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      {isDeleting ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onDelete(service.id)}
                            className="p-2 rounded-lg bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-colors"
                            title="დადასტურება"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingId(null)}
                            className="p-2 rounded-lg hover:bg-foreground/10 text-foreground/60 transition-colors"
                            title="გაუქმება"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeletingId(service.id)}
                          className="p-2 rounded-lg hover:bg-red-500/10 text-foreground/60 hover:text-red-500 transition-colors"
                          title="წაშლა"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
