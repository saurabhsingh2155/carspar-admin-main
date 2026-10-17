import { useCallback, useEffect, useState } from "react";
import { Button, Input, Modal, Popconfirm, Table, Tag, message } from "antd";
import { Navigate } from "react-router-dom";
import { CheckCircleOutlined, PlusOutlined, StopOutlined } from "@ant-design/icons";
import api from "../utils/axiosInstance";
import useAuth from "../context/useAuth";
import LoadingOverlay from "../components/LoadingOverlay";

const PAGE_SIZE = 20;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AdminManagementPage() {
  const { admin } = useAuth();
  const [messageApi, contextHolder] = message.useMessage();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [form, setForm] = useState({ email: "", password: "" });

  const fetchAdmins = useCallback(async (requestedPage) => {
    setLoading(true);
    try {
      const response = await api.get("/admins", {
        params: { page: requestedPage, limit: PAGE_SIZE },
      });
      setAdmins(response.data?.data?.admins || []);
      setTotal(response.data?.data?.pagination?.total || 0);
    } catch (error) {
      messageApi.error(error.response?.data?.message || "Unable to load admins");
    } finally {
      setLoading(false);
    }
  }, [messageApi]);

  useEffect(() => {
    if (admin?.role === "super_admin") fetchAdmins(page);
  }, [admin?.role, fetchAdmins, page]);

  if (admin?.role !== "super_admin") {
    return <Navigate to="/dashboard" replace />;
  }

  const closeModal = () => {
    if (loading) return;
    setOpen(false);
    setForm({ email: "", password: "" });
  };

  const createAdmin = async () => {
    const email = form.email.trim().toLowerCase();
    const passwordBytes = new TextEncoder().encode(form.password).length;

    if (!EMAIL_PATTERN.test(email)) {
      messageApi.warning("Enter a valid email address");
      return;
    }
    if (form.password.length < 8 || passwordBytes > 72) {
      messageApi.warning("Password must be at least 8 characters and not exceed 72 bytes");
      return;
    }

    setLoading(true);
    try {
      await api.post("/admins", { email, password: form.password });
      messageApi.success("Admin created successfully");
      setOpen(false);
      setForm({ email: "", password: "" });
      if (page === 1) await fetchAdmins(1);
      else setPage(1);
    } catch (error) {
      messageApi.error(error.response?.data?.message || "Unable to create admin");
    } finally {
      setLoading(false);
    }
  };

  const updateAdminStatus = async (record) => {
    const nextIsActive = record.isActive === false;
    setStatusUpdatingId(record._id);

    try {
      const response = await api.patch(`/admins/${record._id}/status`, {
        isActive: nextIsActive,
      });
      messageApi.success(
        response.data?.message || `Admin ${nextIsActive ? "enabled" : "disabled"} successfully`,
      );
      await fetchAdmins(page);
    } catch (error) {
      messageApi.error(
        error.response?.data?.message || `Unable to ${nextIsActive ? "enable" : "disable"} admin`,
      );
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const columns = [
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (email) => <span className="font-medium">{email}</span>,
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (role) => (
        <Tag color={role === "super_admin" ? "purple" : "blue"}>
          {role === "super_admin" ? "Super Admin" : "Admin"}
        </Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive) => (
        <Tag color={isActive === false ? "red" : "green"}>
          {isActive === false ? "Inactive" : "Active"}
        </Tag>
      ),
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (createdAt) => createdAt
        ? new Date(createdAt).toLocaleDateString("en-IN")
        : "—",
    },
    {
      title: "Action",
      key: "action",
      fixed: "right",
      width: 120,
      render: (_, record) => {
        const isActive = record.isActive !== false;
        const isCurrentAdmin = String(record._id) === String(admin?.id || admin?._id);
        const action = isActive ? "Disable" : "Enable";

        return (
          <Popconfirm
            title={`${action} admin?`}
            description={
              isActive
                ? "This admin will immediately lose login and API access."
                : "This admin will be allowed to log in again."
            }
            okText={action}
            okButtonProps={{ danger: isActive }}
            cancelText="Cancel"
            disabled={isCurrentAdmin}
            onConfirm={() => updateAdminStatus(record)}
          >
            <Button
              size="small"
              danger={isActive}
              type={isActive ? "default" : "primary"}
              icon={isActive ? <StopOutlined /> : <CheckCircleOutlined />}
              loading={statusUpdatingId === record._id}
              disabled={isCurrentAdmin || Boolean(statusUpdatingId)}
              title={isCurrentAdmin ? "You cannot disable your own account" : `${action} admin`}
            >
              {action}
            </Button>
          </Popconfirm>
        );
      },
    },
  ];

  return (
    <div className="relative h-[87vh] overflow-auto rounded-lg bg-primary p-4 text-primary shadow card-shadow sm:p-6">
      {contextHolder}
      {loading && <LoadingOverlay />}

      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-blue-500">Admin Management</h1>
          <p className="mt-1 text-xs text-gray-500">Super admin can view, add, disable, and enable admin accounts.</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
          Add Admin
        </Button>
      </div>

      <Table
        rowKey="_id"
        columns={columns}
        dataSource={admins}
        scroll={{ x: 650 }}
        pagination={{
          current: page,
          pageSize: PAGE_SIZE,
          total,
          showSizeChanger: false,
          onChange: setPage,
          showTotal: (count) => `${count} admins`,
        }}
      />

      <Modal
        title="Add Admin"
        open={open}
        onCancel={closeModal}
        destroyOnHidden
        footer={[
          <Button key="cancel" onClick={closeModal} disabled={loading}>Cancel</Button>,
          <Button key="create" type="primary" onClick={createAdmin} loading={loading}>Add Admin</Button>,
        ]}
      >
        <div className="space-y-4 py-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Email address</label>
            <Input
              type="email"
              autoComplete="off"
              placeholder="admin@example.com"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              onPressEnter={createAdmin}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Password</label>
            <Input.Password
              autoComplete="new-password"
              placeholder="Minimum 8 characters"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              onPressEnter={createAdmin}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
