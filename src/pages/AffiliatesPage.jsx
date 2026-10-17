import React, { useEffect, useState } from "react";
import api from "../utils/axiosInstance";
import { Table, Button, Space, message, Input, Popconfirm } from "antd"; 
import { PlusOutlined, QuestionCircleOutlined } from "@ant-design/icons"; 
import LoadingOverlay from "../components/LoadingOverlay";
import { toSafeHttpUrl } from "../utils/url";

export default function AffiliatesPage() {
    const API_AFFILIATES = `/affiliates`;
  const API_UPLOAD = `/files`;

  /* ---------------- STATES ---------------- */
  const [affiliates, setAffiliates] = useState([]);
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    id: null,
    title: "",
    description: "",
    link: "",
    file: null, 
    imageUrl: "", // For displaying image preview when editing
    imageId: "",  // Storing existing image ID if not changed
  });

  /* ---------------- FETCH ---------------- */
  const fetchAffiliates = async () => {
    setLoading(true);
    try {
      const res = await api.get(API_AFFILIATES);
      setAffiliates(res.data.data || []);
    } catch (err) {
      console.error(err);
      message.error("Failed to load affiliates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAffiliates();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "auto";
    return () => (document.body.style.overflow = "auto");
  }, [open]);

  /* ---------------- UPLOAD FILE ---------------- */
  const uploadFile = async () => {
    const fd = new FormData();
    fd.append("file", form.file);
    fd.append("folder", "affiliates");
    const res = await api.post(API_UPLOAD, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.data?._id || res.data._id;
  };

  /* ---------------- SAVE ---------------- */
  const handleSave = async () => {
    if (!form.title.trim() || !form.link.trim()) {
      message.error("Title and Link are required");
      return;
    }

    if (!toSafeHttpUrl(form.link)) {
      message.error("Enter a valid HTTP or HTTPS link");
      return;
    }

    if (!isEditing && !form.file) {
      message.error("Image file is required");
      return;
    }

    setLoading(true);
    try {
      let imageId = form.imageId;
      if (form.file) {
        imageId = await uploadFile();
      }

      const payload = {
        title: form.title,
        description: form.description,
        link: form.link,
        ...(imageId && { image: imageId }),
      };

      if (isEditing) {
        await api.patch(`${API_AFFILIATES}/${form.id}`, payload);
      } else {
        await api.post(API_AFFILIATES, payload);
      }

      message.success("Affiliate saved successfully");
      setOpen(false);
      setIsEditing(false);
      setForm({ id: null, title: "", description: "", link: "", file: null, imageUrl: "", imageId: "" });
      fetchAffiliates();
    } catch (err) {
      message.error(err.response?.data?.message || "Save failed");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- DELETE ---------------- */
  const confirmDelete = async (id) => {
    setLoading(true);
    try {
      await api.delete(`${API_AFFILIATES}/${id}`);
      message.success("Affiliate deleted successfully");
      fetchAffiliates();
    } catch {
      message.error("Delete failed");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- TABLE COLUMNS ---------------- */
  const columns = [
    { 
      title: "Image", 
      render: (_, record) => {
        const imgPath = record?.image?.path || record?.image;
        return imgPath ? (
          <img src={imgPath} alt="affiliate" className="w-16 h-12 object-cover rounded" />
        ) : "No Image";
      }
    },
    { title: "Title", dataIndex: "title", render: (t) => <b className="text-blue-500 capitalize">{t}</b> },
    { title: "Description", dataIndex: "description", ellipsis: true },
    { 
        title: "Link", 
        dataIndex: "link", 
        render: (link) => {
          const safeLink = toSafeHttpUrl(link);
          return safeLink ? <a href={safeLink} target="_blank" rel="noopener noreferrer" className="text-blue-500 text-xs underline truncate max-w-[150px] inline-block">{link}</a> : <span className="text-xs text-red-500">Invalid URL</span>;
        } 
    },
    {
      title: "Actions",
      align: "right",
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            onClick={() => {
              setForm({
                id: record._id,
                title: record.title,
                description: record.description,
                link: record.link,
                file: null,
                imageUrl: record?.image?.path || (typeof record.image === 'string' ? record.image : ""),
                imageId: record?.image?._id || record.image,
              });
              setIsEditing(true);
              setOpen(true);
            }}
          >
            Edit
          </Button>

          <Popconfirm
            title="Delete Affiliate"
            onConfirm={() => confirmDelete(record._id)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ danger: true }}
            icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
          >
            <Button danger>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="bg-primary p-4 sm:p-6 rounded-lg card-shadow shadow h-[87vh] overflow-auto relative flex flex-col">
      
      {loading && <LoadingOverlay />}

      <div className="flex flex-row justify-between items-center gap-4 mb-4 flex-shrink-0">
        <h2 className="text-base sm:text-lg font-bold text-blue-500">Affiliate Management</h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          className="w-fit" 
          onClick={() => {
            setOpen(true);
            setIsEditing(false);
            setForm({ id: null, title: "", description: "", link: "", file: null, imageUrl: "", imageId: "" });
          }}
        >
          Add Affiliate
        </Button>
      </div>

      <div className="flex-grow overflow-x-auto">
        <Table
          columns={columns}
          dataSource={affiliates}
          rowKey="_id"
          pagination={false}
          className="custom-table"
          scroll={{ x: 800 }} 
        />
      </div>

      {open && (
        <div className="fixed z-50 inset-0 backdrop-blur-sm bg-black/40 flex justify-center items-center px-4">
          <div className="bg-secondary text-primary card-shadow p-6 rounded-xl shadow-xl w-full max-w-2xl border-none max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg text-blue-400 font-semibold mb-4">
              {isEditing ? "Edit Affiliate" : "Add Affiliate"}
            </h2>

            <label className="block text-sm font-medium mb-1">Affiliate Name</label>
            <Input
              className="!h-[50px] mb-4"
              placeholder="Enter title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />

            <label className="block text-sm font-medium mb-1">Affiliate Link</label>
            <Input
              className="!h-[50px] mb-4"
              placeholder="Enter affiliate URL"
              value={form.link}
              onChange={(e) => setForm({ ...form, link: e.target.value })}
            />

            <label className="block text-sm font-medium mb-1">Description</label>
            <Input.TextArea
              placeholder="Enter description"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="mb-4"
            />

            <label className="block text-sm font-medium mb-1">Affiliate Image</label>
            <label className="flex flex-col items-center bg-primary justify-center w-full h-36 border-2 border-dashed rounded-lg cursor-pointer overflow-hidden mb-4">
              <input 
                type="file" 
                className="hidden" 
                accept="image/*"
                onChange={(e) => setForm({ ...form, file: e.target.files ? e.target.files[0] : null })} 
              />
              {form.file || form.imageUrl ? (
                <img 
                  src={form.file ? URL.createObjectURL(form.file) : form.imageUrl} 
                  className="w-full h-full object-contain" 
                  alt="Preview" 
                />
              ) : (
                <div className="text-center text-gray-500">
                  <svg className="mx-auto mb-2" width="30" height="30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeWidth="1.5" d="M3 16.5a4.5 4.5 0 014.5-4.5H9l1.5-2h3L15 12h1.5A4.5 4.5 0 0121 16.5v.5H3v-.5z" />
                  </svg>
                  <span className="text-xs">Click or drag image file here</span>
                </div>
              )}
            </label>

            <div className="flex flex-row justify-end gap-3 mt-6">
              <Button onClick={() => setOpen(false)}>Cancel</Button>
              <Button
                type="primary"
                onClick={handleSave}
              >
                {isEditing ? "Update Affiliate" : "Save Affiliate"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
