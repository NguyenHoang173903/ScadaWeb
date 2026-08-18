import {
  Activity,
  Users,
} from 'lucide-react'
import type { AppIcon } from '@/components/icons/types'
import { PumpListIcon } from '@/components/icons/PumpListIcon'
import { ReportIcon } from '@/components/icons/ReportIcon'
import { SchemaIcon } from '@/components/icons/SchemaIcon'
import { TechnoDiagramIcon } from '@/components/icons/TechnoDiagramIcon'
import { TrendIcon } from '@/components/icons/TrendIcon'

export type StationNavItem = {
  id: string
  label: string
  path: string
  icon: AppIcon
  children?: { id: string; label: string; path: string }[]
}

export const STATION_NAV_ITEMS: StationNavItem[] = [
  {
    id: 'schematic',
    label: 'Sơ đồ nguyên lý',
    path: 'schematic',
    icon: SchemaIcon,
  },
  {
    id: 'process',
    label: 'Sơ đồ công nghệ',
    path: 'process',
    icon: TechnoDiagramIcon,
  },
  {
    id: 'devices',
    label: 'Danh sách thiết bị',
    path: 'devices',
    icon: PumpListIcon,
    children: [
      { id: 'devices-1-5', label: 'Thiết bị 1-5', path: 'devices/1-5' },
      { id: 'devices-6-10', label: 'Thiết bị 6-10', path: 'devices/6-10' },
    ],
  },
  {
    id: 'charts',
    label: 'Đồ thị',
    path: 'charts',
    icon: TrendIcon,
    children: [
      { id: 'charts-temperature', label: 'Đồ thị nhiệt', path: 'charts/temperature' },
      { id: 'charts-current', label: 'Đồ thị dòng', path: 'charts/current' },
    ],
  },
  {
    id: 'reports',
    label: 'Báo cáo',
    path: 'reports',
    icon: ReportIcon,
  },
  {
    id: 'events',
    label: 'Sự kiện',
    path: 'events',
    icon: Activity,
    children: [
      { id: 'events-existing', label: 'Lỗi tồn tại', path: 'events/existing' },
      { id: 'events-history', label: 'Lịch sử', path: 'events/history' },
    ],
  },
  {
    id: 'team',
    label: 'Tổ vận hành',
    path: 'team',
    icon: Users,
  },
]
