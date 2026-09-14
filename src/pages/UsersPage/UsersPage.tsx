import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { DataTable, type DataTableColumn } from '@/components/common/DataTable'
import { Pagination } from '@/components/common/Pagination'
import { SearchToolbar } from '@/components/common/SearchToolbar'
import { TabNav } from '@/components/common/TabNav'
import { AdminHeader } from '@/components/layout/AdminHeader'
import { isApiError } from '@/services/api/http'
import {
  createScadaUser,
  listScadaUsers,
  type ScadaUserDto,
} from '@/services/scadaUsers/scadaUsersApi'
import { CreateUserForm } from './CreateUserForm'
import { PasswordPolicyForm } from './PasswordPolicyForm'
import { SessionPolicyForm } from './SessionPolicyForm'
import { SystemConfigForm } from './SystemConfigForm'
import type { UserAccount } from './usersData'
import styles from './UsersPage.module.css'

const TABS = [
  { id: 'list', label: 'Danh sách người dùng' },
  { id: 'create', label: 'Thêm người dùng mới' },
  { id: 'policy', label: 'Chính sách mật khẩu' },
  { id: 'session', label: 'Phiên làm việc' },
  { id: 'system', label: 'Cấu hình hệ thống' },
]

const PAGE_SIZE = 10

function formatLastLogin(iso?: string | null) {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())} ${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`
}

function mapScadaUser(dto: ScadaUserDto): UserAccount {
  const role =
    dto.role === 'Administrator' || dto.role === 'Admin' ? 'Administrator' : 'Operator'
  return {
    id: String(dto.id),
    username: dto.username,
    fullName: dto.fullName || dto.displayName || dto.username,
    department: dto.department ?? '',
    position: dto.position ?? '',
    role,
    level: dto.level ?? 1,
    status: (dto.status as UserAccount['status']) || (dto.isActive ? 'Đang hoạt động' : 'Ngưng hoạt động'),
    lastLogin: formatLastLogin(dto.lastLoginAt),
  }
}

export function UsersPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('list')
  const [keyword, setKeyword] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [users, setUsers] = useState<UserAccount[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [listError, setListError] = useState('')
  const [createError, setCreateError] = useState('')

  const loadUsers = useCallback(async (search: string, pageNumber: number) => {
    setLoading(true)
    setListError('')
    try {
      const result = await listScadaUsers({
        keyword: search || undefined,
        pageNumber,
        pageSize: PAGE_SIZE,
      })
      setUsers((result.items ?? []).map(mapScadaUser))
      setTotalCount(result.totalCount ?? result.items?.length ?? 0)
    } catch (error) {
      setUsers([])
      setTotalCount(0)
      setListError(isApiError(error) ? error.message : 'Không tải được danh sách người dùng.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab !== 'list') return
    void loadUsers(query, page)
  }, [activeTab, query, page, loadUsers])

  const handleBack = () => {
    navigate(-1)
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE) || 1)
  const currentPage = Math.min(page, totalPages)

  const columns: DataTableColumn<UserAccount>[] = useMemo(
    () => [
      {
        key: 'stt',
        header: 'STT',
        width: 64,
        align: 'center',
        render: (_row, index) => (currentPage - 1) * PAGE_SIZE + index + 1,
      },
      {
        key: 'username',
        header: 'Tên đăng nhập',
        width: 140,
        render: (row) => row.username,
      },
      {
        key: 'fullName',
        header: 'Họ và tên',
        width: 160,
        render: (row) => row.fullName,
      },
      {
        key: 'department',
        header: 'Phòng ban',
        width: 140,
        render: (row) => row.department || '—',
      },
      {
        key: 'position',
        header: 'Chức vụ',
        width: 140,
        render: (row) => row.position || '—',
      },
      {
        key: 'role',
        header: 'Vai trò',
        width: 130,
        render: (row) => row.role,
      },
      {
        key: 'level',
        header: 'Cấp',
        width: 70,
        align: 'center',
        render: (row) => row.level,
      },
      {
        key: 'status',
        header: 'Trạng thái',
        width: 180,
        render: (row) => (
          <Badge tone={row.status === 'Đang hoạt động' ? 'green' : 'red'}>
            {row.status}
          </Badge>
        ),
      },
      {
        key: 'lastLogin',
        header: 'Đăng nhập lần cuối',
        width: 160,
        render: (row) => row.lastLogin,
      },
    ],
    [currentPage],
  )

  return (
    <div className={styles.page}>
      <AdminHeader />

      <main className={styles.main}>
        <button type="button" className={styles.backButton} onClick={handleBack} aria-label="Quay lại">
          <ChevronRight size={18} style={{ transform: 'rotate(180deg)' }} />
        </button>

        <TabNav
          items={TABS}
          activeId={activeTab}
          onChange={(id) => {
            setActiveTab(id)
            setCreateError('')
          }}
        />

        {activeTab === 'list' ? (
          <>
            <SearchToolbar
              value={keyword}
              onChange={setKeyword}
              onSearch={() => {
                setPage(1)
                setQuery(keyword)
              }}
              placeholder="Tìm theo tên đăng nhập, họ tên..."
              actions={
                <>
                  <Button variant="secondary" disabled={!selectedId}>
                    Sửa
                  </Button>
                  <Button variant="danger" disabled={!selectedId}>
                    Xóa
                  </Button>
                </>
              }
            />

            {listError ? <p className={styles.error}>{listError}</p> : null}

            <div className={styles.tableWrap}>
              <DataTable
                columns={columns}
                data={users}
                rowKey={(row) => row.id}
                minRows={8}
                selectedKey={selectedId}
                onRowClick={(row) => setSelectedId(row.id)}
                totalCount={totalCount}
                totalUnit="tài khoản"
                emptyText={loading ? 'Đang tải...' : 'Không có người dùng'}
                footer={
                  <Pagination
                    page={currentPage}
                    totalPages={totalPages}
                    onChange={setPage}
                  />
                }
              />
            </div>
          </>
        ) : activeTab === 'create' ? (
          <>
            {createError ? <p className={styles.error}>{createError}</p> : null}
            <CreateUserForm
              onSubmit={(values) => {
                void (async () => {
                  setCreateError('')
                  try {
                    await createScadaUser({
                      username: values.username.trim(),
                      password: values.password,
                      confirmPassword: values.confirmPassword,
                      fullName: values.fullName.trim(),
                      department: values.department.trim() || undefined,
                      position: values.position.trim() || undefined,
                      description: values.description.trim() || undefined,
                      role: values.role,
                      level: values.level ? Number(values.level) : null,
                      isActive: values.active,
                      mustChangePassword: values.forceChangeOnFirstLogin,
                    })
                    setActiveTab('list')
                    setPage(1)
                    setQuery('')
                    setKeyword('')
                    await loadUsers('', 1)
                  } catch (error) {
                    setCreateError(
                      isApiError(error) ? error.message : 'Không tạo được người dùng.',
                    )
                  }
                })()
              }}
            />
          </>
        ) : activeTab === 'policy' ? (
          <PasswordPolicyForm />
        ) : activeTab === 'session' ? (
          <SessionPolicyForm />
        ) : (
          <SystemConfigForm />
        )}
      </main>
    </div>
  )
}
