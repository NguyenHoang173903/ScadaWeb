export type TeamMember = {
  id: string
  fullName: string
  role: string
  birthDate: string
  qualification: string
  phone: string
}

export const TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'member-1',
    fullName: 'Trần Anh Thuấn',
    role: 'Trưởng kíp',
    birthDate: '10/08/1981',
    qualification: 'Trung cấp điện (Nhóm 5 - bậc 1)',
    phone: '0947025977',
  },
  {
    id: 'member-2',
    fullName: 'Lê Thanh Thúy',
    role: 'CNVH',
    birthDate: '22/03/1985',
    qualification: 'Trung cấp điện (Nhóm 4 - bậc 2)',
    phone: '0912345678',
  },
  {
    id: 'member-3',
    fullName: 'Vương Thanh Hiếu',
    role: 'CNVH',
    birthDate: '15/11/1990',
    qualification: 'Cao đẳng điện (Nhóm 5 - bậc 1)',
    phone: '0987654321',
  },
]
