import React, { useEffect, useState } from "react";
import api from "../utils/axiosInstance";
import { Table, Button, Space, message, Input, Popconfirm } from "antd";
import { PlusOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import LoadingOverlay from "../components/LoadingOverlay";

export default function BannersPage() {
  const API_BANNERS = `/banners`;
  const API_UPLOAD = `/files`;

  /* ---------------- STATES ---------------- */
  const [banners, setBanners] = useState([]);
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    id: null,
    title: "",
    description: "",
    file: null,
    existingImage: null,
  });

  /* ---------------- FETCH ---------------- */
  const fetchBanners = async () => {
    setLoading(true);

    try {
      const res = await api.get(API_BANNERS);
      setBanners(res.data.data || []);
    } catch (err) {
      console.error(err);

      const errorMsg =
        err.response?.data?.message || "Failed to load banners";

      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "auto";

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [open]);

  /* ---------------- UPLOAD FILE ---------------- */
  const uploadFile = async () => {
    const fd = new FormData();

    fd.append("file", form.file);
    fd.append("folder", "banners");

    const res = await api.post(API_UPLOAD, fd, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return res.data.data._id;
  };

  /* ---------------- SAVE ---------------- */
  const handleSave = async () => {
    if (!form.title) {
      message.error("Title required");
      return;
    }

    if (!isEditing && !form.file) {
      message.error("Image required");
      return;
    }

    setLoading(true);

    try {
      let imageId = null;

      if (form.file) {
        imageId = await uploadFile();
      }

      const payload = {
        title: form.title,
        description: form.description,
        ...(imageId && { image: imageId }),
      };

      if (isEditing) {
        await api.patch(`${API_BANNERS}/${form.id}`, payload);
      } else {
        await api.post(API_BANNERS, payload);
      }

      message.success("Banner saved successfully");

      setOpen(false);
      setIsEditing(false);

      setForm({
        id: null,
        title: "",
        description: "",
        file: null,
        existingImage: null,
      });

      fetchBanners();
    } catch (err) {
      console.error(err);

      const errorMsg =
        err.response?.data?.message || "Save failed";

      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- DELETE ---------------- */
  const confirmDelete = async (id) => {
    setLoading(true);

    try {
      await api.delete(`${API_BANNERS}/${id}`);

      message.success("Banner deleted successfully");

      fetchBanners();
    } catch (err) {
      console.error(err);

      const errorMsg =
        err.response?.data?.message || "Delete failed";

      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- TABLE COLUMNS ---------------- */
  const columns = [
    {
      title: "Image",
      dataIndex: "image",
      render: (img) =>
        img ? (
          <img
            src={img.path}
            alt=""
            className="w-[100px] h-[60px] object-cover rounded"
          />
        ) : (
          "No Image"
        ),
    },

    {
      title: "Title",
      dataIndex: "title",
    },

    {
      title: "Description",
      dataIndex: "description",
      render: (description) => (
        <div
          className="max-w-[400px]"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 4,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {description}
        </div>
      ),
    },

    {
      title: "Actions",
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            onClick={() => {
              setForm({
                id: record._id,
                title: record.title,
                description: record.description,
                file: null,
                existingImage: record.image?.path,
              });

              setIsEditing(true);
              setOpen(true);
            }}
          >
            Edit
          </Button>

          <Popconfirm
            title="Delete Banner"
            description="Are you sure you want to delete this banner?"
            onConfirm={() => confirmDelete(record._id)}
            okText="Yes, Delete"
            cancelText="No"
            okButtonProps={{ danger: true }}
            icon={
              <QuestionCircleOutlined
                style={{ color: "red" }}
              />
            }
          >
            <Button danger>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="bg-primary p-4 md:p-6 rounded-lg card-shadow shadow h-[87vh] overflow-auto relative">

      {loading && <LoadingOverlay />}

      {/* Responsive Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">

        <h2 className="text-lg font-bold text-blue-500">
          Banner Management
        </h2>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          className="w-full md:w-auto"
          onClick={() => {
            setOpen(true);
            setIsEditing(false);

            setForm({
              id: null,
              title: "",
              description: "",
              file: null,
              existingImage: null,
            });
          }}
        >
          Add Banner
        </Button>

      </div>

      <Table
        columns={columns}
        dataSource={banners}
        rowKey="_id"
        pagination={false}
        scroll={{ x: "max-content" }}
      />

      {open && (
        <div className="fixed z-50 inset-0 backdrop-blur-sm bg-black/40 flex justify-center items-center px-2">

          <div className="bg-secondary text-primary card-shadow p-6 rounded-xl shadow-xl w-full max-w-2xl overflow-y-auto max-h-[95vh]">

            <h2 className="text-lg text-blue-400 font-semibold mb-4">
              {isEditing ? "Edit Banner" : "Add Banner"}
            </h2>

            {/* Banner Name */}
            <label className="block text-sm font-medium mb-1">
              Banner Name
            </label>

            <Input
              className="!h-[50px] mb-4"
              placeholder="Enter title"
              value={form.title}
              onChange={(e) =>
                setForm({
                  ...form,
                  title: e.target.value,
                })
              }
            />

            {/* Banner Description */}
            <label className="block text-sm font-medium mb-1">
              Banner Description
            </label>

            <Input.TextArea
              placeholder="Enter description"
              value={form.description}
              autoSize={{
                minRows: 3,
                maxRows: 12,
              }}
              onChange={(e) =>
                setForm({
                  ...form,
                  description: e.target.value,
                })
              }
              className="mb-4"
            />

            {/* Banner Image */}
            <label className="block text-sm font-medium mb-1">
              Banner Image
            </label>

            <label
              className="
                relative
                flex
                items-center
                justify-center
                w-full
                aspect-[16/7]
                min-h-[180px]
                bg-primary
                border-2
                border-dashed
                rounded-lg
                cursor-pointer
                overflow-hidden
                hover:bg-gray-100
                transition
              "
            >
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];

                  if (file) {
                    setForm({
                      ...form,
                      file,
                    });
                  }
                }}
              />

              {form.file ? (
                <img
                  src={URL.createObjectURL(form.file)}
                  alt="preview"
                  className="absolute inset-0 w-full h-full object-contain"
                />
              ) : form.existingImage ? (
                <img
                  src={form.existingImage}
                  alt="preview"
                  className="absolute inset-0 w-full h-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center text-gray-500">
                  <PlusOutlined className="text-2xl mb-2" />

                  <span className="text-sm">
                    Upload landscape photo
                  </span>
                </div>
              )}
            </label>

            {/* Modal Buttons */}
            <div className="flex flex-col-reverse md:flex-row justify-end gap-3 mt-6">

              <Button
                className="w-full md:w-auto"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>

              <Button
                type="primary"
                className="w-full md:w-auto"
                onClick={handleSave}
              >
                {isEditing ? "Update Banner" : "Add Banner"}
              </Button>

            </div>

          </div>
        </div>
      )}
    </div>
  );
}