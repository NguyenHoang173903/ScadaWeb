export type UserAccount = {
  id: string
  username: string
  fullName: string
  department: string
  position: string
  role: 'Operator' | 'Administrator'
  level: number
  status: 'Đang hoạt động' | 'Ngưng hoạt động'
  lastLogin: string
}

export const MOCK_USERS: UserAccount[] = [
  {
    id: '1',
    username: 'OP',
    fullName: 'Vận hành 1',
    department: '',
    position: '',
    role: 'Operator',
    level: 50,
    status: 'Đang hoạt động',
    lastLogin: '09:30:11 12/07/2026',
  },
  {
    id: '2',
    username: 'admin',
    fullName: 'Administrator',
    department: '',
    position: '',
    role: 'Administrator',
    level: 100,
    status: 'Đang hoạt động',
    lastLogin: '09:30:11 19/07/2026',
  },
]
