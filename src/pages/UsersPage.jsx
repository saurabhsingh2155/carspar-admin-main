import { useCallback, useEffect, useState } from "react";
import { Button, Popconfirm, Space, Table, Tooltip, message } from "antd";
import { DeleteOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import api from "../utils/axiosInstance";
import LoadingOverlay from "../components/LoadingOverlay";

const PAGE_SIZE = 20;

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchUsers = useCallback(async (requestedPage) => {
    setLoading(true);
    try {
      const response = await api.get("/users", { params: { page: requestedPage, limit: PAGE_SIZE } });
      setUsers(response.data?.data?.users || []);
      setTotal(response.data?.data?.pagination?.total || 0);
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(page);
  }, [fetchUsers, page]);

  const deleteUser = async (id) => {
    setLoading(true);
    try {
      await api.delete(`/users/${id}`);
      message.success("User deleted successfully");
      const nextPage = users.length === 1 && page > 1 ? page - 1 : page;
      if (nextPage !== page) setPage(nextPage);
      else fetchUsers(nextPage);
    } catch (error) {
      message.error(error.response?.data?.message || "Unable to delete user");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "Image",
      dataIndex: "image",
      width: 80,
      render: (image) => image?.path ? (
        <img src={image.path} alt="" loading="lazy" referrerPolicy="no-referrer" className="h-11 w-11 rounded-lg object-cover" />
      ) : <div className="grid h-11 w-11 place-items-center rounded-lg bg-slate-100 text-xs text-slate-400">N/A</div>,
    },
    { title: "Name", dataIndex: "name", sorter: (a, b) => (a.name || "").localeCompare(b.name || ""), render: (value) => value || "N/A" },
    { title: "Email", dataIndex: "email", render: (value) => value || "N/A" },
    { title: "Phone", dataIndex: "phone", render: (value) => value || "N/A" },
    {
      title: "Status",
      dataIndex: "isActive",
      render: (isActive) => <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${isActive === false ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>{isActive === false ? "Inactive" : "Active"}</span>,
    },
    {
      title: "Joined",
      dataIndex: "createdAt",
      render: (value) => value ? new Date(value).toLocaleDateString("en-IN") : "N/A",
    },
    {
      title: "Actions",
      align: "right",
      fixed: "right",
      width: 90,
      render: (_, user) => (
        <Space>
          <Tooltip title="Delete user">
            <Popconfirm title="Delete this user permanently?" onConfirm={() => deleteUser(user._id)} okButtonProps={{ danger: true }} icon={<QuestionCircleOutlined className="text-red-600" />}>
              <Button type="text" danger icon={<DeleteOutlined />} aria-label={`Delete ${user.name || "user"}`} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <section className="relative rounded-xl bg-primary p-4 shadow sm:p-6">
      {loading && <LoadingOverlay />}
      <div className="mb-5 flex items-center justify-between">
        <div><h1 className="text-lg font-bold text-blue-600">User Management</h1><p className="text-xs text-slate-500">{total.toLocaleString("en-IN")} registered users</p></div>
      </div>
      <Table rowKey="_id" columns={columns} dataSource={users} scroll={{ x: 850 }}
        pagination={{ current: page, pageSize: PAGE_SIZE, total, showSizeChanger: false, onChange: setPage, showTotal: (count) => `${count} users` }} />
    </section>
  );
}
