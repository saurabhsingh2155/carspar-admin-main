import React, { useState, useEffect } from "react";
import api from "../utils/axiosInstance";
import { Table, Button, Space, Popconfirm, message } from "antd";
import { QuestionCircleOutlined } from "@ant-design/icons";
import LoadingOverlay from "../components/LoadingOverlay"; // Your custom loader imported here

export default function FaqsPage() {
  const API_FAQS = "/faqs";

  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openForm, setOpenForm] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [editingId, setEditingId] = useState(null);

  /* ================= FETCH FAQs ================= */
  const fetchFaqs = async () => {
    try {
      setLoading(true);
      const res = await api.get(API_FAQS);
      const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setFaqs(data);
    } catch (err) {
      message.error(err.response?.data?.message || "Error fetching FAQs");
      setFaqs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  useEffect(() => {
    if (openForm) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [openForm]);

  /* ================= SAVE ================= */
  const handleSave = async () => {
    if (!question.trim() || !answer.trim()) {
      message.warning("Question and Answer are required");
      return;
    }

    try {
      setLoading(true);
      if (editingId) {
        await api.patch(`${API_FAQS}/${editingId}`, { question, answer });
        message.success("FAQ updated");
      } else {
        await api.post(API_FAQS, { question, answer });
        message.success("FAQ added");
      }

      fetchFaqs();
      setQuestion("");
      setAnswer("");
      setEditingId(null);
      setOpenForm(false);
    } catch (err) {
      message.error(err.response?.data?.message || "Failed to save FAQ");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (faq) => {
    setQuestion(faq.question);
    setAnswer(faq.answer);
    setEditingId(faq._id || faq.id);
    setOpenForm(true);
  };

  /* ================= DELETE ================= */
  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await api.delete(`${API_FAQS}/${id}`);
      message.success("Deleted successfully");
      fetchFaqs();
    } catch (err) {
      message.error(err.response?.data?.message || "Delete failed");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "Question",
      dataIndex: "question",
      key: "question",
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: "Answer",
      dataIndex: "answer",
      key: "answer",
      render: (answerText) => (
        <div className="max-w-xl whitespace-pre-wrap break-words">{answerText}</div>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      align: "center",
      render: (_, record) => (
        <Space>
          <Button type="primary" onClick={() => handleEdit(record)}>
            Edit
          </Button>
          <Popconfirm
            title="Are you sure?"
            description="This FAQ will be permanently deleted!"
            onConfirm={() => handleDelete(record._id || record.id)}
            okText="Yes, delete it"
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
    <div className="p-6 bg-primary w-full text-primary card-shadow shadow rounded-lg h-[87vh] relative overflow-auto">
      {/* YOUR CUSTOM LOADER */}
      {loading && <LoadingOverlay />}

      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-blue-500 text-lg font-bold">FAQ Management</h1>
        <Button
          type="primary"
          onClick={() => {
            setEditingId(null);
            setQuestion("");
            setAnswer("");
            setOpenForm(true);
          }}
        >
          + Add FAQ
        </Button>
      </div>

      {/* TABLE */}
      <Table
        rowKey={(record) => record._id || record.id}
        columns={columns}
        dataSource={faqs}
        pagination={false}
      />

      {/* MODAL */}
      {openForm && (
        <div className="fixed z-50 inset-0 backdrop-blur-sm bg-black/40 flex justify-center items-center px-2">
          <div className="bg-secondary p-6 rounded-xl shadow-xl w-full max-w-3xl border border-gray-100">
            <h2 className="text-xl font-semibold mb-4 text-blue-500">
              {editingId ? "Edit FAQ" : "Add New FAQ"}
            </h2>

            <label className="font-semibold text-primary block mb-1">Question</label>
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-700 bg-primary dark:bg-gray-900 rounded mb-4 outline-none focus:ring-1 focus:ring-blue-400"
              placeholder="Enter question"
            />

            <label className="font-semibold block mb-1">Answer</label>
            {/* REPLACED TINYMCE WITH NORMAL TEXTAREA */}
            <textarea
              className="w-full h-[300px] p-4 rounded-lg border border-gray-300 dark:border-gray-700 bg-primary dark:bg-gray-900 text-primary focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-sans"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Enter answer content..."
            />

            <div className="flex justify-end space-x-4 mt-6">
              <Button onClick={() => setOpenForm(false)}>Cancel</Button>
              <Button type="primary" onClick={handleSave}>
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
