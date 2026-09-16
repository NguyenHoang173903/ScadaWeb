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
  deleteScadaUser,
  getScadaUser,
  listScadaUsers,
  updateScadaUser,
  type ScadaUserDto,
} from '@/services/scadaUsers/scadaUsersApi'
import { CreateUserForm, type CreateUserFormValues } from './CreateUserForm'
import { PasswordPolicyForm } from './PasswordPolicyForm'
import { SessionPolicyForm } from './SessionPolicyForm'
import { SystemConfigForm } from './SystemConfigForm'
import type { UserAccount } from './usersData'
import { isSessionAdmin } from '@/settings/session'
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

function mapRoleLabel(role: string): UserAccount['role'] {
  if (role === 'Administrator' || role === 'Admin') return 'Administrator'
  if (role === 'viewer' || role === 'Viewer') return 'Viewer'
  return 'Operator'
}

function mapRoleForApi(role: string): string {
  if (role === 'Administrator' || role === 'Admin') return 'Administrator'
  if (role === 'viewer' || role === 'Viewer') return 'viewer'
  return 'Operator'
}

function mapScadaUser(dto: ScadaUserDto): UserAccount {
  return {
    id: String(dto.id),
    username: dto.username,
    fullName: dto.fullName || dto.displayName || dto.username,
    department: dto.department ?? '',
    position: dto.position ?? '',
    role: mapRoleLabel(dto.role),
    level: dto.level ?? 1,
    status:
      (dto.status as UserAccount['status']) ||
      (dto.isActive ? 'Đang hoạt động' : 'Ngưng hoạt động'),
    lastLogin: formatLastLogin(dto.lastLoginAt),
  }
}

function dtoToFormValues(dto: ScadaUserDto): CreateUserFormValues {
  return {
    username: dto.username,
    password: '',
    confirmPassword: '',
    fullName: dto.fullName || dto.displayName || '',
    department: dto.department ?? '',
    position: dto.position ?? '',
    role: mapRoleForApi(dto.role),
    level: dto.level != null ? String(dto.level) : '',
    active: dto.isActive,
    description: '',
    forceChangeOnFirstLogin: dto.mustChangePassword,
  }
}

export function UsersPage() {
  const navigate = useNavigate()
  const isAdmin = isSessionAdmin()
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
  const [editUser, setEditUser] = useState<ScadaUserDto | null>(null)
  const [editLoading, setEditLoading] = useState(false)
  const [actionBusy, setActionBusy] = useState(false)

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

  const handleEdit = async () => {
    if (!selectedId || actionBusy) return
    setActionBusy(true)
    setEditLoading(true)
    setListError('')
    try {
      const dto = await getScadaUser(Number(selectedId))
      setEditUser(dto)
      setActiveTab('edit')
    } catch (error) {
      setListError(isApiError(error) ? error.message : 'Không tải được hồ sơ người dùng.')
    } finally {
      setEditLoading(false)
      setActionBusy(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedId || actionBusy) return
    const selected = users.find((u) => u.id === selectedId)
    const ok = window.confirm(
      `Vô hiệu hóa tài khoản "${selected?.username ?? selectedId}"?\n(Soft-delete: IsActive = false)`,
    )
    if (!ok) return

    setActionBusy(true)
    setListError('')
    try {
      await deleteScadaUser(Number(selectedId))
      setSelectedId(null)
      await loadUsers(query, page)
    } catch (error) {
      setListError(isApiError(error) ? error.message : 'Không vô hiệu hóa được tài khoản.')
    } finally {
      setActionBusy(false)
    }
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

  const tabItems = useMemo(() => {
    if (activeTab === 'edit') {
      return [...TABS, { id: 'edit', label: 'Sửa người dùng' }]
    }
    return TABS
  }, [activeTab])

  return (
    <div className={styles.page}>
      <AdminHeader />

      <main className={styles.main}>
        <button type="button" className={styles.backButton} onClick={handleBack} aria-label="Quay lại">
          <ChevronRight size={18} style={{ transform: 'rotate(180deg)' }} />
        </button>

        <TabNav
          items={tabItems}
          activeId={activeTab}
          onChange={(id) => {
            if (id === 'edit') return
            setActiveTab(id)
            setCreateError('')
            setEditUser(null)
          }}
        />

        {!isAdmin ? (
          <p className={styles.error}>
            Chỉ Admin được quản lý người dùng / chính sách. Role hiện tại không đủ quyền gọi API
            scada-users.
          </p>
        ) : null}

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
                  <Button
                    variant="secondary"
                    disabled={!selectedId || actionBusy || editLoading || !isAdmin}
                    onClick={() => void handleEdit()}
                  >
                    Sửa
                  </Button>
                  <Button
                    variant="danger"
                    disabled={!selectedId || actionBusy || !isAdmin}
                    onClick={() => void handleDelete()}
                  >
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
        ) : activeTab === 'edit' && editUser ? (
          <>
            {createError ? <p className={styles.error}>{createError}</p> : null}
            <CreateUserForm
              mode="edit"
              initialValues={dtoToFormValues(editUser)}
              onCancel={() => {
                setEditUser(null)
                setCreateError('')
                setActiveTab('list')
              }}
              onSubmit={(values) => {
                void (async () => {
                  setCreateError('')
                  try {
                    await updateScadaUser(editUser.id, {
                      fullName: values.fullName.trim() || undefined,
                      department: values.department.trim() || undefined,
                      position: values.position.trim() || undefined,
                      ...(values.description.trim()
                        ? { description: values.description.trim() }
                        : {}),
                      role: values.role,
                      level: values.level ? Number(values.level) : null,
                      isActive: values.active,
                      mustChangePassword: values.forceChangeOnFirstLogin,
                    })
                    setEditUser(null)
                    setActiveTab('list')
                    await loadUsers(query, page)
                  } catch (error) {
                    setCreateError(
                      isApiError(error) ? error.message : 'Không cập nhật được người dùng.',
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
