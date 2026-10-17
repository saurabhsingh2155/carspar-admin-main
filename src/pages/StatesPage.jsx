import React, { useState, useEffect, useMemo } from "react";
import api from "../utils/axiosInstance";
import { Table, Button, Space, message, Popconfirm, Input } from "antd";
import {
  PlusOutlined,
  QuestionCircleOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import LoadingOverlay from "../components/LoadingOverlay"; // Your custom loader
import BulkJsonUploadButton from "../components/BulkJsonUploadButton";

export default function StatesPage() {
    const API_STATES = `/states`;

  const [states, setStates] = useState([]);
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    id: null,
    state: "",
    code: "",
    priceSlabs: [{ minPrice: "", maxPrice: "", percentage: "" }],
  });

  /* ================= FETCH ================= */
  const fetchStates = async () => {
    setLoading(true);
    try {
      const res = await api.get(API_STATES);
      setStates(res.data?.data || []);
    } catch (err) {
      console.error(err);
      message.error("Failed to fetch states");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStates();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [open]);

  /* ================= SORTED STATES ================= */
  const sortedStates = useMemo(() => {
    return [...states].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, [states]);

  /* ================= CODE GENERATOR ================= */
  const generateCode = (name) => {
    if (!name) return "";
    const prefix = name.substring(0, 3).toUpperCase();
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${random}`;
  };

  /* ================= DYNAMIC SLABS HANDLERS ================= */
  const handleAddSlab = () => {
    setForm({
      ...form,
      priceSlabs: [
        ...form.priceSlabs,
        { minPrice: "", maxPrice: "", percentage: "" },
      ],
    });
  };

  const handleRemoveSlab = (index) => {
    const updatedSlabs = form.priceSlabs.filter((_, i) => i !== index);
    setForm({ ...form, priceSlabs: updatedSlabs });
  };

  const handleSlabChange = (index, field, value) => {
    const cleanedValue = value.replace(/[^0-9.]/g, "");
    const updatedSlabs = form.priceSlabs.map((slab, i) =>
      i === index ? { ...slab, [field]: cleanedValue } : slab
    );
    setForm({ ...form, priceSlabs: updatedSlabs });
  };

  /* ================= SAVE ================= */
  const handleSave = async () => {
    if (!form.state) return message.error("State name required");

    for (let slab of form.priceSlabs) {
      if (
        slab.minPrice === "" ||
        slab.maxPrice === "" ||
        slab.percentage === ""
      ) {
        return message.error(
          "Please fill all fields in the price slabs configuration"
        );
      }
    }

    setLoading(true);
    try {
      const payload = {
        name: form.state,
        code: form.code,
        priceSlabs: form.priceSlabs.map((slab) => ({
          minPrice: Number(slab.minPrice),
          maxPrice: Number(slab.maxPrice),
          percentage: Number(slab.percentage),
        })),
      };

      if (isEditing) {
        await api.patch(`${API_STATES}/${form.id}`, payload);
        message.success("State updated successfully");
      } else {
        await api.post(API_STATES, payload);
        message.success("State added successfully");
      }

      setOpen(false);
      setIsEditing(false);
      setForm({
        id: null,
        state: "",
        code: "",
        priceSlabs: [{ minPrice: "", maxPrice: "", percentage: "" }],
      });
      fetchStates();
    } catch (err) {
      message.error(err.response?.data?.message || "Save failed");
    } finally {
      setLoading(false);
    }
  };

  /* ================= DELETE ================= */
  const confirmDelete = async (id) => {
    setLoading(true);
    try {
      await api.delete(`${API_STATES}/${id}`);
      message.success("State deleted successfully");
      fetchStates();
    } catch {
      message.error("Delete failed");
    } finally {
      setLoading(false);
    }
  };

  /* ================= TABLE COLUMNS ================= */
  const columns = [
    {
      title: "State",
      dataIndex: "name",
      align: "center",
      render: (t) => <span className="capitalize font-medium">{t}</span>,
    },
    {
      title: "Code",
      dataIndex: "code",
      align: "center",
    },
    {
      title: "Active Slabs",
      dataIndex: "priceSlabs",
      align: "center",
      render: (slabs) => (
        <span className="text-xs text-gray-500 font-semibold">
          {slabs?.length || 0} Brackets Configured
        </span>
      ),
    },
    {
      title: "Actions",
      align: "center",
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            onClick={() => {
              setForm({
                id: record._id,
                state: record.name,
                code: record.code,
                priceSlabs: record.priceSlabs?.length
                  ? record.priceSlabs.map((slab) => ({
                      minPrice: String(slab.minPrice),
                      maxPrice: String(slab.maxPrice),
                      percentage: String(slab.percentage),
                    }))
                  : [{ minPrice: "", maxPrice: "", percentage: "" }],
              });
              setIsEditing(true);
              setOpen(true);
            }}
          >
            Edit
          </Button>

          <Popconfirm
            title="Delete State"
            description="Are you sure you want to delete this state?"
            onConfirm={() => confirmDelete(record._id)}
            okText="Yes, Delete"
            cancelText="No"
            okButtonProps={{ danger: true }}
            icon={<QuestionCircleOutlined style={{ color: "red" }} />}
          >
            <Button danger>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="bg-primary h-[87vh] p-6 rounded-lg card-shadow shadow relative overflow-auto">
      {loading && <LoadingOverlay />}

      <div className="flex justify-between mb-4">
        <h2 className="text-lg font-bold text-blue-500">State Management</h2>
        <div className="flex items-center gap-2">
          <BulkJsonUploadButton
            endpoint="/states/bulk"
            rootKey="states"
            label="Bulk Upload JSON"
            onSuccess={fetchStates}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setOpen(true);
              setIsEditing(false);
              setForm({
                id: null,
                state: "",
                code: "",
                priceSlabs: [{ minPrice: "", maxPrice: "", percentage: "" }],
              });
            }}
          >
            Add State
          </Button>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={sortedStates}
        rowKey="_id"
        pagination={false}
      />

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-secondary p-6 rounded-xl shadow-xl w-full max-w-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4 text-blue-500">
              {isEditing ? "Update State" : "Add New State"}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-primary font-medium mb-1">
                  State Name
                </label>
                <input
                  className="w-full p-2 border bg-primary text-primary rounded outline-none focus:ring-1 focus:ring-blue-400"
                  placeholder="e.g. Maharashtra"
                  value={form.state}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      state: e.target.value,
                      code: isEditing
                        ? form.code
                        : generateCode(e.target.value),
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-sm text-primary font-medium mb-1">
                  Generated Code
                </label>
                <input
                  className="w-full p-2 border rounded text-primary bg-primary cursor-not-allowed"
                  placeholder="UP-8128"
                  value={form.code}
                  disabled
                />
              </div>
            </div>

            {/* DYNAMIC PRICE SLABS SECTION */}
            <div className="mt-6 border-t pt-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                  RTO Price Slabs Matrix
                </h4>
                <Button
                  size="small"
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={handleAddSlab}
                >
                  Add Slab Bracket
                </Button>
              </div>

              {form.priceSlabs.map((slab, idx) => (
                <div
                  key={idx}
                  className="flex flex-wrap md:flex-nowrap gap-2 items-center mb-3 bg-primary p-3 rounded-lg border"
                >
                  <div className="w-full">
                    <label className="block text-[11px] text-black mb-0.5">
                      Min Price (₹)
                    </label>
                    <Input
                      placeholder="Min Price"
                      value={slab.minPrice}
                      onChange={(e) =>
                        handleSlabChange(idx, "minPrice", e.target.value)
                      }
                    />
                  </div>
                  <div className="w-full">
                    <label className="block text-[11px] text-black mb-0.5">
                      Max Price (₹)
                    </label>
                    <Input
                      placeholder="Max Price"
                      value={slab.maxPrice}
                      onChange={(e) =>
                        handleSlabChange(idx, "maxPrice", e.target.value)
                      }
                    />
                  </div>
                  <div className="w-full">
                    <label className="block text-[11px] text-black mb-0.5">
                      Tax Rate (%)
                    </label>
                    <Input
                      placeholder="e.g. 8"
                      value={slab.percentage}
                      onChange={(e) =>
                        handleSlabChange(idx, "percentage", e.target.value)
                      }
                    />
                  </div>
                  {form.priceSlabs.length > 1 && (
                    <Button
                      danger
                      type="text"
                      className="mt-4"
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemoveSlab(idx)}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 mt-6 border-t pt-4">
              <Button onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="primary" onClick={handleSave}>
                {isEditing ? "Update State" : "Save State"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
