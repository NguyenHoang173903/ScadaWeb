export type TeamMember = {
  id: string
  employeeId: string
  fullName: string
  role: string
  birthDate: string
  qualification: string
  phone: string
  shiftStartAt: string
}

export const TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'member-1',
    employeeId: '12345678T',
    fullName: 'Trần Anh Thuấn',
    role: 'Trưởng kíp',
    birthDate: '10/08/1981',
    qualification: 'Trung cấp điện (Nhóm 5 - bậc 1)',
    phone: '0947025977',
    shiftStartAt: '08:30:00 01/08/2026',
  },
  {
    id: 'member-2',
    employeeId: '123456789T',
    fullName: 'Lê Thanh Thúy',
    role: 'CNVH',
    birthDate: '10/10/1978',
    qualification: 'VHMB (Nhóm 5 - bậc 5)',
    phone: '0973089950',
    shiftStartAt: '08:30:00 01/08/2026',
  },
  {
    id: 'member-3',
    employeeId: '120928121H',
    fullName: 'Vương Thanh Hiếu',
    role: 'CNVH',
    birthDate: '08/03/1998',
    qualification: 'Cao đẳng cơ điện (Nhóm 5 - bậc 1)',
    phone: '0967824077',
    shiftStartAt: '08:30:00 01/08/2026',
  },
]
