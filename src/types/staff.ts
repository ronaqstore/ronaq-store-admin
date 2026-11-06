import type { StaffUserDto } from '@/lib/api/types';

export interface StaffDataWrapper {
  data?: StaffUserDto[];
}

export type StaffListApiResult = StaffUserDto[] | StaffDataWrapper;

export interface StaffItemWrapper {
  data?: StaffUserDto;
}

export type StaffSingleApiResult = StaffUserDto | StaffItemWrapper;

export interface StaffActionApiResponse {
  success: boolean;
  message: string;
}

export interface StaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: StaffUserDto | null;
  onSuccess?: () => void;
}

export interface StaffCellActionProps {
  staff: StaffUserDto;
  onEdit: (staff: StaffUserDto) => void;
  onToggleStatus: (staff: StaffUserDto) => void;
  isLoading?: boolean;
}

export interface StaffPermissionsCellProps {
  role: string;
}

export interface StaffStatusCellProps {
  status: string;
}
