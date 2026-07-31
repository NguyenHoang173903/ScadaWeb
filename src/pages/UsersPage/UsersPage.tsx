import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { DataTable, type DataTableColumn } from '@/components/common/DataTable'
import { Pagination } from '@/components/common/Pagination'
import { SearchToolbar } from '@/components/common/SearchToolbar'
import { TabNav } from '@/components/common/TabNav'
import { AdminHeader } from '@/components/layout/AdminHeader'
import { CreateUserForm } from './CreateUserForm'
import { MOCK_USERS, type UserAccount } from './usersData'
import styles from './UsersPage.module.css'

const TABS = [
  { id: 'list', label: 'Danh sách người dùng' },
  { id: 'create', label: 'Thêm người dùng mới' },
]

const PAGE_SIZE = 10

export function UsersPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('list')
  const [keyword, setKeyword] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const handleBack = () => {
    navigate(-1)
  }

  const filteredUsers = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return MOCK_USERS

    return MOCK_USERS.filter((user) =>
      [user.username, user.fullName, user.role, user.status]
        .join(' ')
        .toLowerCase()
        .includes(normalized),
    )
  }, [query])

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageRows = filteredUsers.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  )

  const columns: DataTableColumn<UserAccount>[] = [
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
      render: (row) => row.department || '',
    },
    {
      key: 'position',
      header: 'Chức vụ',
      width: 140,
      render: (row) => row.position || '',
    },
    {
      key: 'role',
      header: 'Vai trò',
      width: 140,
      align: 'center',
      render: (row) => (
        <Badge tone={row.role === 'Administrator' ? 'blue' : 'yellow'}>
          {row.role}
        </Badge>
      ),
    },
    {
      key: 'level',
      header: 'Cấp độ',
      width: 90,
      align: 'center',
      render: (row) => row.level,
    },
    {
      key: 'status',
      header: 'Trạng thái',
      width: 140,
      render: (row) => row.status,
    },
    {
      key: 'lastLogin',
      header: 'Đăng nhập lần cuối',
      width: 180,
      render: (row) => row.lastLogin,
    },
  ]

  const handleSearch = () => {
    setQuery(keyword)
    setPage(1)
    setSelectedId(null)
  }

  const handleRefresh = () => {
    setKeyword('')
    setQuery('')
    setPage(1)
    setSelectedId(null)
  }

  return (
    <div className={styles.page}>
      <AdminHeader />
      <TabNav
        items={TABS}
        activeId={activeTab}
        onChange={setActiveTab}
        trailing={
          <button
            type="button"
            className={styles.backButton}
            aria-label="Quay lại trang trước"
            onClick={handleBack}
          >
            <ChevronRight size={18} />
          </button>
        }
      />

      <main className={styles.main}>
        {activeTab === 'list' ? (
          <>
            <SearchToolbar
              value={keyword}
              onChange={setKeyword}
              onSearch={handleSearch}
              onRefresh={handleRefresh}
              actions={
                <>
                  <Button
                    variant="secondary"
                    disabled={!selectedId}
                    onClick={() => {
                      console.log('Edit user', selectedId)
                    }}
                  >
                    Sửa
                  </Button>
                  <Button
                    variant="danger"
                    disabled={!selectedId}
                    onClick={() => {
                      console.log('Delete user', selectedId)
                    }}
                  >
                    Xóa
                  </Button>
                </>
              }
            />

            <div className={styles.tableWrap}>
              <DataTable
                columns={columns}
                data={pageRows}
                rowKey={(row) => row.id}
                minRows={8}
                selectedKey={selectedId}
                onRowClick={(row) => setSelectedId(row.id)}
                totalCount={filteredUsers.length}
                totalUnit="tài khoản"
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
        ) : (
          <CreateUserForm
            onSubmit={(values) => {
              console.log('Create user', values)
              setActiveTab('list')
            }}
          />
        )}
      </main>
    </div>
  )
}
