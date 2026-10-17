import React, { useEffect, useState } from "react";
import api from "../utils/axiosInstance";
import { Table, Button, Space, message, Popconfirm, Tag, Tooltip } from "antd";
import { PlusOutlined, DeleteOutlined, QuestionCircleOutlined, RightOutlined } from "@ant-design/icons";
import LoadingOverlay from "../components/LoadingOverlay";
import BulkJsonUploadButton from "../components/BulkJsonUploadButton";

const initialDealerState = {
  name: "",
  address: "",
  phoneNumbers: ["", ""],
  brandId: "",
};

const defaultMatrix = [
  { minCc: "0", maxCc: "999", zoneARate: "", zoneBRate: "", threeYearTpPremium: "" },
  { minCc: "1000", maxCc: "1499", zoneARate: "", zoneBRate: "", threeYearTpPremium: "" },
  { minCc: "1500", maxCc: "9999", zoneARate: "", zoneBRate: "", threeYearTpPremium: "" },
];

export default function CitiesPage() {
  const API_CITIES = "/cities";
  const API_STATES = "/states";
  const API_BRANDS = "/brands";

  /* ================= STATE ================= */
  const [cities, setCities] = useState([]);
  const [states, setStates] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Track expanded rows keys
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);

  const [form, setForm] = useState({
    stateId: "",
    city: "",
    rtoCode: "",
    pincode: "",
    dealers: [{ ...initialDealerState }],
    ccPremiumMatrix: defaultMatrix,
  });

  /* ================= FETCH ================= */
  const fetchCities = async () => {
    setLoading(true);
    try {
      const res = await api.get(API_CITIES);
      setCities(res.data?.data || []);
    } catch {
      message.error("Failed to load cities");
      setCities([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStates = async () => {
    try {
      const res = await api.get(API_STATES);
      setStates(res.data?.data || []);
    } catch {
      setStates([]);
    }
  };

  const fetchBrands = async () => {
    try {
      const res = await api.get(API_BRANDS);
      setBrands(res.data?.data || []);
    } catch {
      setBrands([]);
    }
  };

  useEffect(() => {
    fetchCities();
    fetchStates();
    fetchBrands();
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "auto";
    return () => (document.body.style.overflow = "auto");
  }, [open]);

  /* ================= DEALER HANDLERS ================= */
  const handleAddDealer = () => {
    setForm({
      ...form,
      dealers: [...form.dealers, { ...initialDealerState }],
    });
  };

  const handleRemoveDealer = (index) => {
    if (form.dealers.length === 1) {
      message.warning("At least one dealer is required");
      return;
    }
    const updatedDealers = form.dealers.filter((_, i) => i !== index);
    setForm({ ...form, dealers: updatedDealers });
  };

  const handleDealerChange = (index, field, value) => {
    const updatedDealers = [...form.dealers];
    updatedDealers[index] = {
      ...updatedDealers[index],
      [field]: value,
    };
    setForm({ ...form, dealers: updatedDealers });
  };

  const handlePhoneChange = (dealerIndex, phoneIndex, value) => {
    const updatedDealers = [...form.dealers];
    const updatedPhones = [...updatedDealers[dealerIndex].phoneNumbers];
    updatedPhones[phoneIndex] = value.replace(/\D/g, "");
    updatedDealers[dealerIndex].phoneNumbers = updatedPhones;
    setForm({ ...form, dealers: updatedDealers });
  };

  /* ================= SAVE ================= */
  const handleSave = async () => {
    if (!form.city || !form.stateId) {
      message.warning("City name and State are required");
      return;
    }

    if (form.pincode.toString().length !== 6) {
      message.error("Pincode must be exactly 6 digits");
      return;
    }

    for (let i = 0; i < form.dealers.length; i++) {
      const d = form.dealers[i];
      if (!d.name.trim() || !d.address.trim()) {
        message.error(`Dealer #${i + 1} requires a name and address`);
        return;
      }
      if (!d.brandId) {
        message.error(`Dealer #${i + 1} requires a brand`);
        return;
      }
      if (!d.phoneNumbers[0] || !d.phoneNumbers[1]) {
        message.error(`Dealer #${i + 1} requires both phone numbers`);
        return;
      }
    }

    const formattedMatrix = form.ccPremiumMatrix.map((slab) => ({
      minCc: Number(slab.minCc) || 0,
      maxCc: Number(slab.maxCc) || 0,
      zoneARate: Number(slab.zoneARate) || 0,
      zoneBRate: Number(slab.zoneBRate) || 0,
      threeYearTpPremium: Number(slab.threeYearTpPremium) || 0,
    }));

    const payload = {
      name: form.city,
      rtoCode: form.rtoCode,
      pincode: form.pincode,
      stateId: form.stateId,
      dealers: form.dealers,
      ccPremiumMatrix: formattedMatrix,
    };

    setLoading(true);
    try {
      if (editingId) {
        await api.patch(`${API_CITIES}/${editingId}`, payload);
        message.success("City updated successfully");
      } else {
        await api.post(API_CITIES, payload);
        message.success("City added successfully");
      }
      fetchCities();
      closeModal();
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
      await api.delete(`${API_CITIES}/${id}`);
      message.success("City deleted successfully");
      fetchCities();
    } catch {
      message.error("Delete failed");
    } finally {
      setLoading(false);
    }
  };

  /* ================= MODAL CONTROLS ================= */
  const openModal = (item = null) => {
    if (item) {
      setEditingId(item._id);

      const existingMatrix =
        item.ccPremiumMatrix?.length === 3
          ? item.ccPremiumMatrix.map((m) => ({
              minCc: String(m.minCc ?? ""),
              maxCc: String(m.maxCc ?? ""),
              zoneARate: String(m.zoneARate ?? ""),
              zoneBRate: String(m.zoneBRate ?? ""),
              threeYearTpPremium: String(m.threeYearTpPremium ?? ""),
            }))
          : defaultMatrix;

      const existingDealers =
        item.dealers?.length > 0
          ? item.dealers.map((d) => ({
              name: d.name || "",
              address: d.address || "",
              brandId: d.brandId?._id || d.brandId || "",
              phoneNumbers: [
                d.phoneNumbers?.[0] || "",
                d.phoneNumbers?.[1] || "",
              ],
            }))
          : [{ ...initialDealerState }];

      setForm({
        stateId: item.stateId?._id || "",
        city: item.name,
        rtoCode: item.rtoCode || "",
        pincode: item.pincode || "",
        dealers: existingDealers,
        ccPremiumMatrix: existingMatrix,
      });
    } else {
      setEditingId(null);
      setForm({
        stateId: "",
        city: "",
        rtoCode: "",
        pincode: "",
        dealers: [{ ...initialDealerState }],
        ccPremiumMatrix: defaultMatrix,
      });
    }
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setEditingId(null);
  };

  /* ================= TABLE COLUMNS ================= */
  const cityColumns = [
    {
      title: "City",
      dataIndex: "name",
      key: "city",
    },
    {
      title: "Pincode",
      dataIndex: "pincode",
      key: "pincode",
    },
    {
      title: "RTO Code",
      dataIndex: "rtoCode",
      key: "rtoCode",
    },
    {
      title: "Dealers",
      dataIndex: "dealers",
      key: "dealers",
      render: (dealers) => (
        <Tooltip
          title={
            dealers?.length > 0 ? (
              <ul className="text-xs p-1">
                {dealers.map((d, i) => (
                  <li key={i} className="mb-1">
                    <strong>{d.name}</strong> - {d.address} ({d.phoneNumbers?.join(", ")})
                  </li>
                ))}
              </ul>
            ) : null
          }
        >
          <Tag color={dealers?.length > 0 ? "blue" : "default"}>
            {dealers?.length || 0} Dealer(s)
          </Tag>
        </Tooltip>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button type="primary" size="small" onClick={() => openModal(record)}>
            Edit
          </Button>
          <Popconfirm
            title="Delete City"
            onConfirm={() => confirmDelete(record._id)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ danger: true }}
            icon={<QuestionCircleOutlined style={{ color: "red" }} />}
          >
            <Button danger size="small">Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  /* ================= GROUPED & SORTED DATA ================= */
  const groupedStatesData = Object.entries(
    cities.reduce((acc, city) => {
      const stateName = city.stateId?.name || "Other";
      if (!acc[stateName]) acc[stateName] = [];
      acc[stateName].push(city);
      return acc;
    }, {})
  )
    .map(([stateName, stateCities], index) => ({
      key: stateName,
      id: index,
      stateName,
      totalCities: stateCities.length,
      cities: stateCities.sort((a, b) => (a.name || "").localeCompare(b.name || "")),
    }))
    .sort((a, b) => a.stateName.localeCompare(b.stateName));

  const parentColumns = [
    {
      title: "State Name",
      dataIndex: "stateName",
      key: "stateName",
      render: (text) => <span className="font-semibold text-primary">{text}</span>,
    },
    {
      title: "Total Cities",
      dataIndex: "totalCities",
      key: "totalCities",
      render: (count) => (
        <span className="text-blue-500 font-medium">{count} City(s)</span>
      ),
    },
  ];

  return (
    <div className="bg-primary h-[87vh] p-4 rounded-lg card-shadow shadow relative overflow-auto">
      {loading && <LoadingOverlay />}

      <div className="flex justify-between mb-4 items-center">
        <h2 className="text-lg font-bold text-blue-500">City Management</h2>
        <div className="flex items-center gap-2">
          <BulkJsonUploadButton
            endpoint="/cities/bulk"
            rootKey="cities"
            label="Bulk Upload JSON"
            onSuccess={fetchCities}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => openModal()}
          >
            Add City
          </Button>
        </div>
      </div>

      <div className="bg-secondary rounded-lg shadow-sm">
        <Table
          columns={parentColumns}
          dataSource={groupedStatesData}
          rowKey="key"
          pagination={false}
          expandedRowKeys={expandedRowKeys}
          onExpandedRowsChange={(keys) => setExpandedRowKeys(keys)}
          onRow={(record) => ({
            onClick: () => {
              const keys = [...expandedRowKeys];
              const index = keys.indexOf(record.key);
              if (index >= 0) {
                keys.splice(index, 1);
              } else {
                keys.push(record.key);
              }
              setExpandedRowKeys(keys);
            },
            style: { cursor: "pointer" },
          })}
          expandable={{
            expandedRowRender: (record) => (
              <div className="p-2 bg-primary rounded-md" onClick={(e) => e.stopPropagation()}>
                <Table
                  columns={cityColumns}
                  dataSource={record.cities}
                  rowKey="_id"
                  bordered
                  pagination={false}
                  size="small"
                />
              </div>
            ),
            expandIcon: ({ expanded, onExpand, record }) => (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onExpand(record, e);
                }}
                className="text-blue-500 focus:outline-none mr-2 p-1"
              >
                <RightOutlined
                  style={{
                    transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
                    transition: "transform 0.2s",
                  }}
                />
              </button>
            ),
          }}
        />
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-secondary p-6 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4 text-blue-500">
              {editingId ? "Edit City Details" : "Add New City"}
            </h3>

            <label className="block text-sm text-primary font-medium mb-1">
              State
            </label>
            <select
              className="w-full mb-3 p-2 border rounded bg-primary text-primary outline-none focus:ring-1 focus:ring-blue-400"
              value={form.stateId}
              onChange={(e) => setForm({ ...form, stateId: e.target.value })}
            >
              <option value="">Select State</option>
              {states.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div>
                <label className="block text-sm text-primary font-medium mb-1">
                  City Name
                </label>
                <input
                  className="w-full p-2 border rounded bg-primary text-primary outline-none focus:ring-1 focus:ring-blue-400"
                  placeholder="Aligarh"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm text-primary font-medium mb-1">
                  Pincode
                </label>
                <input
                  className="w-full p-2 border rounded bg-primary text-primary outline-none focus:ring-1 focus:ring-blue-400"
                  placeholder="6 Digits"
                  value={form.pincode}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^\d*$/.test(val) && val.length <= 6) {
                      setForm({ ...form, pincode: val });
                    }
                  }}
                />
              </div>
              <div>
                <label className="block text-sm text-primary font-medium mb-1">
                  RTO Code
                </label>
                <input
                  className="w-full p-2 border rounded bg-primary text-primary outline-none focus:ring-1 focus:ring-blue-400"
                  placeholder="UP81"
                  value={form.rtoCode}
                  onChange={(e) =>
                    setForm({ ...form, rtoCode: e.target.value })
                  }
                />
              </div>
            </div>

            {/* ================= DEALERS SECTION ================= */}
            <div className="border-t border-gray-200 pt-3 mb-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-md font-semibold text-primary">
                  Dealers List ({form.dealers.length})
                </h4>
                <Button
                  type="dashed"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={handleAddDealer}
                >
                  Add Another Dealer
                </Button>
              </div>

              <div className="space-y-3 mb-3">
                {form.dealers.map((dealer, idx) => (
                  <div
                    key={idx}
                    className="p-3 border rounded-lg bg-primary relative space-y-2"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-400">
                        Dealer #{idx + 1}
                      </span>
                      {form.dealers.length > 1 && (
                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={() => handleRemoveDealer(idx)}
                        />
                      )}
                    </div>

                    {/* Brand Selection Dropdown */}
                    <div>
                      <select
                        className="w-full p-1.5 text-sm border rounded bg-primary text-primary outline-none"
                        value={dealer.brandId || ""}
                        onChange={(e) =>
                          handleDealerChange(idx, "brandId", e.target.value)
                        }
                      >
                        <option value="">Select Brand</option>
                        {brands.map((b) => (
                          <option key={b._id} value={b._id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        className="p-1.5 text-sm border rounded bg-primary text-primary outline-none"
                        placeholder="Dealer Name"
                        value={dealer.name}
                        onChange={(e) =>
                          handleDealerChange(idx, "name", e.target.value)
                        }
                      />
                      <input
                        className="p-1.5 text-sm border rounded bg-primary text-primary outline-none"
                        placeholder="Address"
                        value={dealer.address}
                        onChange={(e) =>
                          handleDealerChange(idx, "address", e.target.value)
                        }
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        className="p-1.5 text-sm border rounded bg-primary text-primary outline-none"
                        placeholder="Phone Number 1"
                        maxLength={10}
                        value={dealer.phoneNumbers[0]}
                        onChange={(e) =>
                          handlePhoneChange(idx, 0, e.target.value)
                        }
                      />
                      <input
                        className="p-1.5 text-sm border rounded bg-primary text-primary outline-none"
                        placeholder="Phone Number 2"
                        maxLength={10}
                        value={dealer.phoneNumbers[1]}
                        onChange={(e) =>
                          handlePhoneChange(idx, 1, e.target.value)
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t pt-3">
              <Button onClick={closeModal}>Cancel</Button>
              <Button type="primary" onClick={handleSave}>
                {editingId ? "Update City" : "Save City"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}