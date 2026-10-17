import React, { useState, useEffect } from "react";
import api from "../utils/axiosInstance";
import { Table, Button, Space, message, Popconfirm } from "antd";
import { PlusOutlined, QuestionCircleOutlined, PlayCircleOutlined, LinkOutlined } from "@ant-design/icons";
import LoadingOverlay from "../components/LoadingOverlay";
import { getYouTubeVideoId, toSafeHttpUrl } from "../utils/url";

export default function ReelsPage() {
    const API_REELS = `/reels`;

  const [reels, setReels] = useState([]);
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    id: null,
    videoUrl: "",
  });

  /* ================= FETCH ================= */
  const fetchReels = async () => {
    setLoading(true);
    try {
      const res = await api.get(API_REELS);
      setReels(res.data?.data || []);
    } catch {
      message.error("Failed to fetch Reels");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReels();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ================= SAVE ================= */
  const handleSave = async () => {
    if (!form.videoUrl) return message.error("Video URL is required");
    if (!getYouTubeVideoId(form.videoUrl)) return message.error("Enter a valid YouTube URL");

    setLoading(true);
    try {
      const payload = { videoUrl: form.videoUrl };
      if (isEditing) {
        await api.patch(`${API_REELS}/${form.id}`, payload);
        message.success("Reel updated");
      } else {
        await api.post(API_REELS, payload);
        message.success("Reel added");
      }
      setOpen(false);
      fetchReels();
    } catch {
      message.error("Save failed");
    } finally {
      setLoading(false);
    }
  };

  /* ================= DELETE ================= */
  const confirmDelete = async (id) => {
    setLoading(true);
    try {
      await api.delete(`${API_REELS}/${id}`);
      message.success("Reel deleted");
      fetchReels();
    } catch {
      message.error("Delete failed");
    } finally {
      setLoading(false);
    }
  };

  /* ================= TABLE COLUMNS ================= */
  const columns = [
    {
      title: "Thumbnail",
      dataIndex: "videoUrl",
      key: "thumbnail",
      width: 160,
      render: (url) => {
        const videoId = getYouTubeVideoId(url);
        const thumbnailUrl = videoId
          ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
          : null;

        return thumbnailUrl ? (
          <a
            href={toSafeHttpUrl(url) || undefined}
            target="_blank"
            rel="noopener noreferrer"
            className="relative group inline-block overflow-hidden rounded-lg border border-gray-200 shadow-sm"
          >
            <img
              src={thumbnailUrl}
              alt="YouTube Thumbnail"
              className="w-32 h-20 object-cover transform group-hover:scale-105 transition-transform duration-200"
            />
            {/* Overlay Play Icon */}
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 flex items-center justify-center transition-colors">
              <PlayCircleOutlined className="text-white text-2xl drop-shadow-md group-hover:scale-110 transition-transform" />
            </div>
          </a>
        ) : (
          <a
            href={toSafeHttpUrl(url) || undefined}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline flex items-center gap-1 font-medium text-xs"
          >
            <LinkOutlined /> Open Link
          </a>
        );
      },
    },
    {
      title: "Reel / Video Link",
      dataIndex: "videoUrl",
      key: "videoUrl",
      render: (url) => (
        <a
          href={toSafeHttpUrl(url) || undefined}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline font-medium text-sm max-w-xs truncate inline-block"
        >
          {url}
        </a>
      ),
    },
    {
      title: "Actions",
      align: "right",
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            onClick={() => {
              setForm({ id: record._id, videoUrl: record.videoUrl });
              setIsEditing(true);
              setOpen(true);
            }}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete Reel?"
            onConfirm={() => confirmDelete(record._id)}
            okText="Yes"
            cancelText="No"
            icon={<QuestionCircleOutlined style={{ color: "red" }} />}
          >
            <Button danger>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="bg-primary p-6 h-[87vh] rounded-lg card-shadow shadow relative overflow-hidden flex flex-col">
      {loading && <LoadingOverlay />}

      <div className="flex justify-between mb-4 flex-shrink-0">
        <h2 className="text-lg font-bold text-blue-500">Reels Management</h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setOpen(true);
            setIsEditing(false);
            setForm({ id: null, videoUrl: "" });
          }}
        >
          Add Reel
        </Button>
      </div>

      <div className="flex-grow overflow-auto">
        <Table
          columns={columns}
          dataSource={reels}
          rowKey="_id"
          pagination={false}
          className="custom-table"
        />
      </div>

      {/* MODAL */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-secondary p-6 rounded-xl shadow-xl w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-blue-500">
              {isEditing ? "Update Reel Link" : "Add Reel Link"}
            </h3>

            <input
              className="w-full mb-6 p-2 border rounded bg-primary text-primary outline-none focus:ring-1 focus:ring-blue-400"
              placeholder="Paste YouTube Reel / Video URL..."
              value={form.videoUrl}
              onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
            />

            <div className="flex justify-end gap-3">
              <Button onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="primary" onClick={handleSave}>
                {isEditing ? "Update" : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
