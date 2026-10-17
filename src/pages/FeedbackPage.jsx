import React, { useEffect, useState } from "react";
import api from "../utils/axiosInstance";
import {
  Table,
  Button,
  Tag,
  Select,
  Input,
  Card,
  Modal,
  Typography,
  Space,
  Flex,
  Badge,
} from "antd";
import {
  EyeOutlined,
  UserOutlined,
  DownOutlined,
  UpOutlined,
  MailOutlined,
  PhoneOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import LoadingOverlay from "../components/LoadingOverlay";

const { Text, Title } = Typography;

export default function FeedbackPage() {
    const API_FEEDBACK = `/feedback/pending`;
  const API_ALL_FEEDBACK = `/feedback`;

  /* ---------------- STATES ---------------- */
  const [feedbacks, setFeedbacks] = useState([]);
  const [groupedFeedbacks, setGroupedFeedbacks] = useState([]);
  const [viewMode, setViewMode] = useState("pending");
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);

  // Modal Form State for Status Update (Added closedMsg)
  const [statusForm, setStatusForm] = useState({
    status: "Pending",
    isApproved: false,
    rejectedMsg: "",
    closedMsg: "",
  });

  /* ---------------- FETCH DATA ---------------- */
  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      if (viewMode === "pending") {
        const res = await api.get(`${API_FEEDBACK}`);
        setFeedbacks(res.data.data.feedbacks || []);
      } else {
        const res = await api.get(`${API_ALL_FEEDBACK}`);
        setGroupedFeedbacks(res.data.data.groupedFeedback || []);
      }
    } catch (err) {
      console.error(err);
      const errorMsg =
        err.response?.data?.message || "Failed to load feedbacks";
      Modal.error({ title: "Error", content: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
    setExpandedRowKeys([]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);

  /* ---------------- UPDATE STATUS ---------------- */
  const handleUpdateStatus = async () => {
    // Validation for Rejected
    if (statusForm.status === "Rejected" && !statusForm.rejectedMsg.trim()) {
      Modal.warning({
        title: "Validation Error",
        content: "Rejection message is required when rejecting feedback",
      });
      return;
    }

    // Validation for Closed
    if (statusForm.status === "Closed" && !statusForm.closedMsg.trim()) {
      Modal.warning({
        title: "Validation Error",
        content: "Closing response message is required when resolving feedback",
      });
      return;
    }

    setLoading(true);
    try {
      await api.patch(
        `/feedback/${selectedFeedback._id}/status`,
        {
          status: statusForm.status,
          isApproved:
            statusForm.status === "Closed" ? true : statusForm.isApproved,
          rejectedMsg:
            statusForm.status === "Rejected" ? statusForm.rejectedMsg : "",
          closedMsg: statusForm.status === "Closed" ? statusForm.closedMsg : "",
        },
      );

      Modal.success({
        title: "Success",
        content: "Feedback status updated successfully",
      });
      setOpenModal(false);
      fetchFeedbacks();
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || "Update failed";
      Modal.error({ title: "Error", content: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  /* Helper for Priority Tags */
  const renderPriorityTag = (priority) => {
    let color = "success";
    if (priority === "Medium") color = "warning";
    if (priority === "High") color = "error";
    return (
      <Tag color={color} className="rounded-full px-3 py-0.5 font-medium">
        {priority}
      </Tag>
    );
  };

  /* Helper for Status Tags */
  const renderStatusTag = (status) => {
    let color = "processing";
    if (status === "Pending") color = "warning";
    if (status === "Closed") color = "success";
    if (status === "Rejected") color = "error";
    return (
      <Tag color={color} className="rounded-full px-3 py-0.5 font-medium">
        {status}
      </Tag>
    );
  };

  /* Row Click Handler to Toggle Expand */
  const handleRowClick = (recordKey) => {
    if (expandedRowKeys.includes(recordKey)) {
      setExpandedRowKeys(expandedRowKeys.filter((key) => key !== recordKey));
    } else {
      setExpandedRowKeys([...expandedRowKeys, recordKey]);
    }
  };

  /* ---------------- COLUMNS FOR PENDING VIEW ---------------- */
  const pendingColumns = [
    {
      title: "User",
      dataIndex: "user",
      render: (user) => (
        <Flex gap="middle" align="center">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold border border-blue-100">
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div>
            <Text className="font-semibold block text-slate-800">
              {user?.name || "Unknown User"}
            </Text>
            <Text type="secondary" className="text-xs flex items-center gap-1">
              <MailOutlined className="text-[10px]" />{" "}
              {user?.email || user?.phone || "No Contact"}
            </Text>
          </div>
        </Flex>
      ),
    },
    {
      title: "Priority",
      dataIndex: "priority",
      render: (priority) => renderPriorityTag(priority),
    },
    {
      title: "Message",
      dataIndex: "message",
      ellipsis: true,
      render: (text) => <Text className="text-slate-600">{text}</Text>,
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status) => renderStatusTag(status),
    },
    {
      title: "Action",
      align: "right",
      render: (_, record) => (
        <Button
          type="primary"
          ghost
          icon={<EyeOutlined />}
          className="rounded-lg hover:bg-blue-50"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedFeedback(record);
            setStatusForm({
              status: record.status,
              isApproved: record.isApproved,
              rejectedMsg: record.rejectedMsg || "",
              closedMsg: record.closedMsg || "",
            });
            setOpenModal(true);
          }}
        >
          Review
        </Button>
      ),
    },
  ];

  /* ---------------- COLUMNS FOR GROUPED VIEW ---------------- */
  const groupedColumns = [
    {
      title: "User Details",
      dataIndex: "user",
      render: (user) => (
        <Flex gap="middle" align="center">
          <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold border border-indigo-100">
            <UserOutlined />
          </div>
          <div>
            <Text className="font-semibold block text-slate-800">
              {user?.name || "Anonymous"}
            </Text>
            <Text type="secondary" className="text-xs">
              {user?.email || user?.phone || "No contact info"}
            </Text>
          </div>
        </Flex>
      ),
    },
    {
      title: "Total Feedbacks Submitted",
      dataIndex: "totalFeedbackCount",
      render: (count) => (
        <Badge
          count={`${count} Feedbacks`}
          style={{
            backgroundColor: "#e0e7ff",
            color: "#4338ca",
            fontWeight: 600,
            padding: "0 10px",
          }}
        />
      ),
    },
    {
      title: "",
      key: "expandIcon",
      align: "right",
      render: (_, record) => {
        const key = record.user?.id || record._id;
        const isExpanded = expandedRowKeys.includes(key);
        return (
          <Button
            type="text"
            shape="circle"
            icon={isExpanded ? <UpOutlined /> : <DownOutlined />}
          />
        );
      },
    },
  ];

  /* Modern Card View inside Expanded Row */
  const expandedRowRender = (record) => {
    return (
      <div className="p-4 bg-primary rounded-xl my-2 shadow-inner">
        <Flex align="center" gap="small" className="mb-3">
          <MessageOutlined className="text-blue-500" />
          <Text className="font-semibold text-slate-700">Feedback History</Text>
        </Flex>

        <div className="flex flex-col gap-4 mt-3">
          {record.feedbacks?.map((item, index) => (
            <Card
              key={item._id || index}
              size="small"
              className="rounded-lg shadow-sm border bg-secondary hover:border-blue-200 transition-all"
              bodyStyle={{ padding: "12px 16px" }}
            >
              <Flex
                justify="space-between"
                align="start"
                gap="small"
                wrap="wrap"
              >
                <div className="space-y-1.5 max-w-2xl">
                  <Flex align="center" gap="small">
                    {renderPriorityTag(item.priority)}
                    {renderStatusTag(item.status)}
                    <Text type="secondary" className="text-xs">
                      •{" "}
                      {new Date(item.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </Text>
                  </Flex>

                  {/* Feedback Message / Query */}
                  <Text className="text-slate-700 block mt-3 mb-3 ms-2">
                    <span className="text-green-600 font-bold me-3">
                      Query:{" "}
                    </span>
                    {item.message}
                  </Text>

                  {/* Show Closed Response Message */}
                  {item.status === "Closed" && item.closedMsg && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-800 font-medium">
                      <span className="font-bold text-emerald-700 block mb-0.5">
                        Resolution Note:
                      </span>
                      {item.closedMsg}
                    </div>
                  )}

                  {/* Show Rejection Reason Message */}
                  {item.status === "Rejected" && item.rejectedMsg && (
                    <div className="p-2.5 bg-red-50 border border-red-200 rounded-md text-xs text-red-800 font-medium">
                      <span className="font-bold text-red-700 block mb-0.5">
                        Reason for Rejection:
                      </span>
                      {item.rejectedMsg}
                    </div>
                  )}
                </div>

                <Button
                  size="small"
                  type="primary"
                  ghost
                  className="rounded-md"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFeedback(item);
                    setStatusForm({
                      status: item.status,
                      isApproved: item.isApproved,
                      rejectedMsg: item.rejectedMsg || "",
                      closedMsg: item.closedMsg || "",
                    });
                    setOpenModal(true);
                  }}
                >
                  Review
                </Button>
              </Flex>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-primary h-[87vh] p-6 rounded-lg card-shadow shadow relative overflow-auto">
      <Card className="shadow-sm rounded-2xl border-slate-200/60">
        {loading && <LoadingOverlay />}

        {/* Header Section */}
        <Flex
          justify="space-between"
          align="center"
          className="mb-6 flex-wrap gap-4"
        >
          <div>
            <Title level={4} className="!mb-0 text-slate-800">
              {viewMode === "pending" ? "Feedbacks" : "All Feedbacks"}
            </Title>
          </div>

          <Select
            className="w-full md:w-[240px]"
            size="large"
            value={viewMode}
            onChange={(value) => setViewMode(value)}
            options={[
              { value: "pending", label: "⏳ Pending Feedback Only" },
              { value: "grouped", label: "👥 All Feedback (User-wise)" },
            ]}
          />
        </Flex>

        {/* Table View */}
        {viewMode === "pending" ? (
          <Table
            columns={pendingColumns}
            dataSource={feedbacks}
            rowKey="_id"
            pagination={false}
            scroll={{ x: "max-content" }}
            className="modern-table"
          />
        ) : (
          <Table
            columns={groupedColumns}
            dataSource={groupedFeedbacks}
            rowKey={(record) => record.user?.id || record._id}
            expandedRowKeys={expandedRowKeys}
            onExpandedRowsChange={(newKeys) => setExpandedRowKeys(newKeys)}
            expandable={{
              expandedRowRender,
              rowExpandable: (record) =>
                record.feedbacks && record.feedbacks.length > 0,
              showExpandColumn: false,
            }}
            onRow={(record) => {
              const recordKey = record.user?.id || record._id;
              return {
                onClick: () => handleRowClick(recordKey),
                style: { cursor: "pointer" },
              };
            }}
            pagination={false}
            scroll={{ x: "max-content" }}
            className="modern-table"
          />
        )}
      </Card>

      {/* Review Modal */}
      <Modal
        title={
          <Text className="text-lg font-semibold text-slate-800">
            Review Feedback Record
          </Text>
        }
        open={openModal}
        onCancel={() => setOpenModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setOpenModal(false)}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={loading}
            onClick={handleUpdateStatus}
          >
            Save Changes
          </Button>,
        ]}
        centered
        className="rounded-2xl overflow-hidden"
      >
        {selectedFeedback && (
          <div className="py-2 space-y-4">
            <div className="p-3 bg-primary rounded-lg">
              <Text
                type="secondary"
                className="text-xs uppercase font-bold tracking-wider block mb-1"
              >
                Feedback Message
              </Text>
              <Text className="text-slate-800">{selectedFeedback.message}</Text>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                Update Status
              </label>
              <Select
                className="w-full"
                size="large"
                value={statusForm.status}
                onChange={(value) =>
                  setStatusForm({ ...statusForm, status: value })
                }
                options={[
                  { value: "Pending", label: "Pending" },
                  { value: "Closed", label: "Closed (Resolved)" },
                  { value: "Rejected", label: "Rejected" },
                ]}
              />
            </div>

            {/* Input field for Closed status */}
            {statusForm.status === "Closed" && (
              <div>
                <label className="block text-xs font-semibold uppercase text-emerald-600 ms-1 mb-2">
                  Closing / Resolution Message *
                </label>
                <Input.TextArea
                  placeholder="Enter message for user regarding resolution"
                  rows={3}
                  value={statusForm.closedMsg}
                  onChange={(e) =>
                    setStatusForm({
                      ...statusForm,
                      closedMsg: e.target.value,
                    })
                  }
                />
              </div>
            )}

            {/* Input field for Rejected status */}
            {statusForm.status === "Rejected" && (
              <div>
                <label className="block text-xs font-semibold uppercase text-red-500 ms-1 mb-2">
                  Rejection Reason *
                </label>
                <Input.TextArea
                  placeholder="Enter reason for rejection"
                  rows={3}
                  value={statusForm.rejectedMsg}
                  onChange={(e) =>
                    setStatusForm({
                      ...statusForm,
                      rejectedMsg: e.target.value,
                    })
                  }
                />
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
