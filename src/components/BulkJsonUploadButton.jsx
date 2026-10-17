import { useRef, useState } from "react";
import { Button, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import api from "../utils/axiosInstance";
import useAuth from "../context/useAuth";

const MAX_JSON_SIZE_BYTES = 1024 * 1024;

export default function BulkJsonUploadButton({
  endpoint,
  rootKey,
  directArray = false,
  label = "Bulk Upload JSON",
  onSuccess,
}) {
  const { admin } = useAuth();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  if (admin?.role !== "super_admin") return null;

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".json")) {
      messageApi.warning("Please select a .json file");
      return;
    }
    if (file.size > MAX_JSON_SIZE_BYTES) {
      messageApi.warning("JSON file must not exceed 1 MB");
      return;
    }

    setUploading(true);
    try {
      const parsed = JSON.parse(await file.text());
      const records = Array.isArray(parsed) ? parsed : parsed?.[rootKey];

      if (!Array.isArray(records) || records.length === 0) {
        throw new Error(`JSON must contain a non-empty ${rootKey} array`);
      }

      const payload = directArray ? records : { [rootKey]: records };
      const response = await api.post(endpoint, payload);

      messageApi.success(response.data?.message || `${records.length} records uploaded successfully`);
      await onSuccess?.();
    } catch (error) {
      messageApi.error(
        error instanceof SyntaxError
          ? "Selected file contains invalid JSON"
          : error.response?.data?.message || error.message || "Bulk upload failed",
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      {contextHolder}
      <input
        ref={inputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleFile}
      />
      <Button
        icon={<UploadOutlined />}
        loading={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {label}
      </Button>
    </>
  );
}
