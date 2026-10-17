import React, { useEffect, useState, useMemo } from "react";
import api from "../utils/axiosInstance";
import {
  Table,
  Button,
  Space,
  Input,
  Select,
  Tabs,
  message,
  Popconfirm,
  Tag,
} from "antd";
import LoadingOverlay from "../components/LoadingOverlay";

/* ================= PAGINATION CONSTANTS ================= */
const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// Safely pull a plain array out of any of the API's response shapes
const extractList = (res) => {
  const root = res?.data ?? res ?? {};
  if (Array.isArray(root?.data?.data)) return root.data.data;
  if (Array.isArray(root?.data)) return root.data;
  if (Array.isArray(root)) return root;
  return [];
};

// Numeric price used for sorting the "Price" column
const getCarPriceValue = (record) => {
  const raw =
    record?.variantDetails?.price ??
    record?.variantId?.price ??
    record?.smallestPrice;
  const num = Number(raw);
  return Number.isFinite(num) ? num : 0;
};

const formatNumeric = (val) => {
  if (!val) return "";
  return String(val).replace(/[^0-9]/g, "");
};

const getYoutubeThumbnail = (url) => {
  if (!url) return "";
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return `https://img.youtube.com/vi/${match[2]}/hqdefault.jpg`;
  }
  return "";
};

const formatPriceShort = (price) => {
  const num = Number(price);
  if (!num || Number.isNaN(num)) return "-";
  if (num >= 10000000) return `₹ ${(num / 10000000).toFixed(2)} Crore`;
  if (num >= 100000) return `₹ ${(num / 100000).toFixed(2)} Lakh`;
  if (num >= 1000) return `₹ ${(num / 1000).toFixed(2)} Thousand`;
  return `₹ ${num.toLocaleString("en-IN")}`;
};

const getVariantOptionLabel = (variant) => {
  const name = variant?.name || "N/A";
  const fuelType = variant?.fuelType ? ` (${variant.fuelType})` : "";
  const price =
    Number(variant?.price) > 0 ? ` • ${formatPriceShort(variant.price)}` : "";
  return `${name}${fuelType}${price}`;
};

const formatWithUnit = (val, unit) => {
  if (val == null || val === "") return "-";
  const stringVal = String(val).trim();
  if (!stringVal) return "-";
  const lowerVal = stringVal.toLowerCase();
  const unitVariations = {
    CC: ["cc", "cubic capacity", "cm3"],
    kmpl: ["kmpl", "km/l", "km per litre", "km/litre"],
    Litres: ["litre", "litres", "ltr", "ltrs", "l"],
    Cyl: ["cyl", "cylinder", "cylinders"],
    Speed: ["speed", "speeds", "gear", "gears", "automatic", "manual"],
    kWh: ["kwh", "kw/h"],
    km: ["km", "kilometers", "kilometres"],
    Seater: ["seater", "seats", "seat"],
    litres: ["litre", "litres", "ltr", "ltrs", "l"],
    Tweeters: ["tweeter", "tweeters", "speaker", "speakers"],
    mm: ["mm", "millimeter", "millimeters", "millimetre", "millimetres"],
    HP: ["hp", "bhp", "ps", "ps/rpm"],
    Nm: ["nm", "nm/rpm", "torque"],
    seconds: ["sec", "secs", "second", "seconds"],
  };
  const currentVariations = unitVariations[unit] || [unit.toLowerCase()];
  const hasUnitAlready = currentVariations.some(
    (v) =>
      lowerVal === v ||
      lowerVal.endsWith(` ${v}`) ||
      lowerVal.endsWith(v) ||
      lowerVal.includes(v)
  );
  if (hasUnitAlready) return stringVal;
  return `${stringVal} ${unit}`;
};

export default function CarsPage() {
  const [cars, setCars] = useState([]);
  const [upcomingCars, setUpcomingCars] = useState([]);
  const [brands, setBrands] = useState([]);

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });

  const [priceSort, setPriceSort] = useState(null);

  const [standardModels, setStandardModels] = useState([]);
  const [upcomingModels, setUpcomingModels] = useState([]);
  const [variantsList, setVariantsList] = useState([]);
  const [selectedVariantDetails, setSelectedVariantDetails] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [isModelsLoading, setIsModelsLoading] = useState(false);
  const [isVariantsLoading, setIsVariantsLoading] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);

  const [openStandardForm, setOpenStandardForm] = useState(false);
  const [openUpcomingForm, setOpenUpcomingForm] = useState(false);
  const [editingCarId, setEditingCarId] = useState(null);

  const [form, setForm] = useState({
    brand: "",
    model: "",
    variant: "",
    brochureLink: "",
    description: "",
    gcap: "",
    bncap: "",
    gncap: "",
    youtubeLinks: [""],
    imageFiles: [],
    existingImages: [],
  });

  const [upcomingForm, setUpcomingForm] = useState({
    name: "",
    brand: "",
    model: "",
    launchedDate: "",
    price: "",
    imageFile: null,
    imageUrl: "",
    imageId: "",
  });

  const fetchStandardCars = async (
    page = pagination.current,
    pageSize = pagination.pageSize,
    sortOrder = priceSort
  ) => {
    setIsTableLoading(true);
    try {
      const params = {
        page,
        limit: pageSize,
        isUpcoming: false,
      };
      if (sortOrder) {
        params.sortBy = "price";
        params.order = sortOrder === "ascend" ? "asc" : "desc";
      }
      const res = await api.get(`/cars`, { params });
      const payload = res.data?.data ?? res.data ?? {};
      const list = Array.isArray(payload?.data) ? payload.data : extractList(res);
      const total = Number(payload?.total ?? list.length);
      const totalPages = Number(
        payload?.totalPages ?? Math.max(1, Math.ceil(total / pageSize))
      );
      const current = Number(payload?.page ?? page);
      const limit = Number(payload?.limit ?? pageSize);

      if (list.length === 0 && current > 1) {
        return fetchStandardCars(1, limit, sortOrder);
      }
      setCars(list);
      setPagination({ current, pageSize: limit, total, totalPages });
    } catch (err) {
      message.error(err.response?.data?.message || "Failed to fetch cars");
    } finally {
      setIsTableLoading(false);
    }
  };

  const fetchUpcomingCars = async () => {
    try {
      const res = await api.get(`/latest-cars`);
      setUpcomingCars(extractList(res));
    } catch (err) {
      message.error(err.response?.data?.message || "Failed to fetch upcoming cars");
    }
  };

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [bRes] = await Promise.all([
        api.get(`/brands`),
        fetchUpcomingCars(),
        fetchStandardCars(1, DEFAULT_PAGE_SIZE),
      ]);
      setBrands(extractList(bRes));
    } catch (err) {
      message.error(err.response?.data?.message || "Failed to fetch data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleCarTableChange = (pagi, filters, sorter, extra) => {
    const nextSort = sorter?.order || null;
    const nextPageSize = pagi?.pageSize || pagination.pageSize;
    const nextPage = extra?.action === "sort" ? 1 : pagi?.current || 1;
    setPagination((prev) => ({
      ...prev,
      current: nextPage,
      pageSize: nextPageSize,
    }));
    setPriceSort(nextSort);
    fetchStandardCars(nextPage, nextPageSize, nextSort);
  };

  const fetchModelsByBrand = async (brandId, formType) => {
    if (!brandId) return [];
    setIsModelsLoading(true);
    try {
      const res = await api.get(`/models?brandId=${brandId}`);
      const fetchedModels = res.data?.data || res.data || [];
      if (formType === "standard") setStandardModels(fetchedModels);
      else setUpcomingModels(fetchedModels);
      return fetchedModels;
    } catch {
      message.error("Failed to fetch models for selected brand");
      return [];
    } finally {
      setIsModelsLoading(false);
    }
  };

  const fetchVariantsByModel = async (modelId, preSelectedVariantId = null) => {
    if (!modelId) return [];
    setIsVariantsLoading(true);
    try {
      const res = await api.get(`/variants?modelId=${modelId}`);
      const fetchedVariants = res.data?.data || res.data || [];
      setVariantsList(fetchedVariants);
      const targetId = preSelectedVariantId || form.variant;
      if (targetId) {
        const found = fetchedVariants.find((v) => String(v._id) === String(targetId));
        if (found) setSelectedVariantDetails(found);
      }
      return fetchedVariants;
    } catch {
      message.error("Failed to fetch variants for selected model");
      return [];
    } finally {
      setIsVariantsLoading(false);
    }
  };

  const handleStandardBrandChange = (brandId) => {
    setForm((prev) => ({ ...prev, brand: brandId, model: "", variant: "" }));
    setStandardModels([]);
    setVariantsList([]);
    setSelectedVariantDetails(null);
    fetchModelsByBrand(brandId, "standard");
  };

  const handleStandardModelChange = (modelId) => {
    setForm((prev) => ({ ...prev, model: modelId, variant: "" }));
    setVariantsList([]);
    setSelectedVariantDetails(null);
    fetchVariantsByModel(modelId);
  };

  const handleVariantChange = (variantId) => {
    setForm((prev) => ({ ...prev, variant: variantId }));
    const targetVariant = variantsList.find((v) => String(v._id) === String(variantId));
    setSelectedVariantDetails(targetVariant || null);
  };

  const handleUpcomingBrandChange = (brandId) => {
    setUpcomingForm((prev) => ({ ...prev, brand: brandId, model: "" }));
    setUpcomingModels([]);
    fetchModelsByBrand(brandId, "upcoming");
  };

  const handleYoutubeChange = (value, index) => {
    const updated = [...form.youtubeLinks];
    updated[index] = value;
    setForm((prev) => ({ ...prev, youtubeLinks: updated }));
  };

  const addYoutubeField = () => {
    setForm((prev) => ({ ...prev, youtubeLinks: [...prev.youtubeLinks, ""] }));
  };

  const removeYoutubeField = (index) => {
    const updated = form.youtubeLinks.filter((_, i) => i !== index);
    setForm((prev) => ({
      ...prev,
      youtubeLinks: updated.length ? updated : [""],
    }));
  };

  const handleMultipleImages = (e) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setForm((prev) => ({
        ...prev,
        imageFiles: [...prev.imageFiles, ...filesArray],
      }));
    }
  };

  const removeSelectedImageFile = (index) => {
    const filtered = form.imageFiles.filter((_, i) => i !== index);
    setForm((prev) => ({ ...prev, imageFiles: filtered }));
  };

  const removeExistingImage = (index) => {
    const filtered = form.existingImages.filter((_, i) => i !== index);
    setForm((prev) => ({ ...prev, existingImages: filtered }));
  };

  const uploadMultipleFiles = async (files) => {
    setIsImageUploading(true);
    const uploadedIds = [];
    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "cars");
      try {
        const res = await api.post(`/files`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const id = res.data?.data?._id || res.data?._id;
        if (id) uploadedIds.push(id);
      } catch (err) {
        console.error("Single file upload fail", err);
      }
    }
    setIsImageUploading(false);
    return uploadedIds;
  };

  const uploadFile = async (file) => {
    setIsImageUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "cars");
      const res = await api.post(`/files`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data?.data?._id || res.data?._id;
    } finally {
      setIsImageUploading(false);
    }
  };

  const closeAndResetModals = () => {
    setOpenStandardForm(false);
    setOpenUpcomingForm(false);
    setEditingCarId(null);
    setStandardModels([]);
    setUpcomingModels([]);
    setVariantsList([]);
    setSelectedVariantDetails(null);
    setForm({
      brand: "",
      model: "",
      variant: "",
      brochureLink: "",
      description: "",
      gcap: "",
      bncap: "",
      gncap: "",
      youtubeLinks: [""],
      imageFiles: [],
      existingImages: [],
    });
    setUpcomingForm({
      name: "",
      brand: "",
      model: "",
      launchedDate: "",
      price: "",
      imageFile: null,
      imageUrl: "",
      imageId: "",
    });
  };

  const handleDelete = async (id, isUpcomingAction = false) => {
    setIsLoading(true);
    try {
      if (isUpcomingAction) await api.delete(`/latest-cars/${id}`);
      else await api.delete(`/cars/${id}`);
      message.success("Deleted successfully");
      if (isUpcomingAction) {
        await fetchUpcomingCars();
      } else {
        const nextPage =
          cars.length === 1 && pagination.current > 1
            ? pagination.current - 1
            : pagination.current;
        await fetchStandardCars(nextPage, pagination.pageSize);
      }
    } catch (err) {
      message.error(err.response?.data?.message || "Delete failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveStandardCar = async () => {
    try {
      let newlyUploadedIds = [];
      if (form.imageFiles.length > 0) {
        newlyUploadedIds = await uploadMultipleFiles(form.imageFiles);
      }
      setIsLoading(true);
      const existingIds = form.existingImages.map((img) => img._id || img);
      const totalImages = [...existingIds, ...newlyUploadedIds];
      const cleanYoutubeLinks = form.youtubeLinks.filter((link) => link && link.trim() !== "");
      const data = {
        brandId: form.brand,
        modelId: form.model,
        variantId: form.variant,
        brochureLink: form.brochureLink,
        description: form.description,
        gcap: form.gcap,
        bncap: form.bncap,
        gncap: form.gncap,
        youtubeLinks: cleanYoutubeLinks,
        images: totalImages,
        isUpcoming: false,
      };
      if (editingCarId) await api.patch(`/cars/${editingCarId}`, data);
      else await api.post(`/cars`, data);
      closeAndResetModals();
      const targetPage = editingCarId ? pagination.current : 1;
      await fetchStandardCars(targetPage, pagination.pageSize);
    } catch (err) {
      message.error(err.response?.data?.message || "Save failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveUpcomingCar = async () => {
    try {
      let imageId = upcomingForm.imageId;
      if (upcomingForm.imageFile) imageId = await uploadFile(upcomingForm.imageFile);
      setIsLoading(true);
      const data = {
        carName: upcomingForm.name,
        brandId: upcomingForm.brand,
        modelId: upcomingForm.model,
        launchedDate: upcomingForm.launchedDate,
        price: Number(upcomingForm.price),
        carImage: imageId,
      };
      if (editingCarId) await api.patch(`/latest-cars/${editingCarId}`, data);
      else await api.post(`/latest-cars`, data);
      closeAndResetModals();
      await fetchUpcomingCars();
    } catch (err) {
      message.error(err.response?.data?.message || "Save failed");
    } finally {
      setIsLoading(false);
    }
  };

  const standardCars = useMemo(() => {
    return Array.isArray(cars) ? cars.filter((c) => c && !c.isUpcoming) : [];
  }, [cars]);

  /* ================= RESPONSIVE TABLE COLUMNS ================= */
  const standardColumns = [
    {
      title: "Image",
      width: 90,
      fixed: "left",
      render: (_, record) => {
        const img = record?.images?.[0]?.path || record?.images?.[0];
        return img ? (
          <img src={img} className="w-16 h-10 sm:w-20 sm:h-12 object-contain rounded" alt="car" />
        ) : (
          <span className="text-xs text-gray-400">No Image</span>
        );
      },
    },
    {
      title: "Car Name",
      width: 140,
      ellipsis: true,
      render: (_, record) => (
        <strong className="text-xs sm:text-sm line-clamp-2">{record?.carName || "N/A"}</strong>
      ),
    },
    {
      title: "Base Variant",
      width: 130,
      ellipsis: true,
      render: (_, record) => (
        <span className="text-xs sm:text-sm">
          {record?.variantDetails?.name || record?.variantId?.name || "N/A"}
        </span>
      ),
    },
    {
      title: "Fuel Type",
      width: 110,
      responsive: ["md"],
      render: (_, record) =>
        record?.variantDetails?.fuelType || record?.variantId?.fuelType || "-",
    },
    {
      title: "Transmission",
      width: 120,
      responsive: ["lg"],
      render: (_, record) =>
        record?.variantDetails?.transmission || record?.variantId?.transmission || "-",
    },
    {
      title: "Price",
      key: "price",
      width: 120,
      sorter: (a, b) => getCarPriceValue(a) - getCarPriceValue(b),
      sortOrder: priceSort,
      sortDirections: ["ascend", "descend"],
      showSorterTooltip: { title: "Sort by price" },
      render: (_, record) => (
        <span className="text-xs sm:text-sm font-medium whitespace-nowrap">
          {formatPriceShort(record?.variantDetails?.price || record?.variantId?.price)}
        </span>
      ),
    },
    {
      title: "Actions",
      width: 150,
      align: "center",
      render: (_, record) => (
        <Space size="small" wrap>
          <Button
            size="small"
            type="primary"
            className="text-xs sm:text-sm"
            onClick={async () => {
              setIsLoading(true);
              setEditingCarId(record._id);
              const bId = record?.brandId?._id || record?.brandId || "";
              const mId = record?.modelId?._id || record?.modelId || "";
              const vId =
                record?.variantId?._id ||
                record?.variantId ||
                record?.variantDetails?._id ||
                "";
              const existingVariantObj =
                record?.variantDetails ||
                (typeof record?.variantId === "object" ? record.variantId : null);
              if (existingVariantObj) setSelectedVariantDetails(existingVariantObj);
              await Promise.all([
                fetchModelsByBrand(bId, "standard"),
                fetchVariantsByModel(mId, vId),
              ]);
              const fetchedYoutube =
                Array.isArray(record?.youtubeLinks) && record.youtubeLinks.length > 0
                  ? record.youtubeLinks
                  : [""];
              setForm({
                brand: bId,
                model: mId,
                variant: vId,
                brochureLink: record?.brochureLink || "",
                description: record?.description || record?.desc || "",
                gcap: record?.gcap || "",
                bncap: record?.bncap || "",
                gncap: record?.gncap || "",
                youtubeLinks: fetchedYoutube,
                existingImages: record?.images || [],
                imageFiles: [],
              });
              setIsLoading(false);
              setOpenStandardForm(true);
            }}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete this car?"
            onConfirm={() => handleDelete(record._id, false)}
            okText="Yes"
            cancelText="No"
          >
            <Button size="small" danger className="text-xs sm:text-sm">
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const upcomingColumns = [
    {
      title: "Image",
      width: 90,
      fixed: "left",
      render: (_, record) => {
        const img = record?.carImage?.path || record?.carImage;
        return img ? (
          <img src={img} className="w-16 h-10 sm:w-20 sm:h-12 object-contain rounded" alt="upcoming" />
        ) : (
          <span className="text-xs text-gray-400">No Image</span>
        );
      },
    },
    {
      title: "Car Name",
      width: 130,
      ellipsis: true,
      render: (_, record) => <strong className="text-xs sm:text-sm">{record?.carName || "-"}</strong>,
    },
    {
      title: "Brand",
      width: 100,
      responsive: ["sm"],
      render: (_, record) => record?.brandId?.name || record?.brand || "-",
    },
    {
      title: "Model",
      width: 110,
      responsive: ["md"],
      render: (_, record) => record?.modelId?.name || record?.model || "-",
    },
    {
      title: "Launched",
      width: 140,
      responsive: ["lg"],
      dataIndex: "launchedDate",
      render: (text) => {
        if (!text) return "-";
        return new Date(text).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      },
    },
    {
      title: "Price",
      width: 130,
      render: (_, record) => (
        <span className="text-xs sm:text-sm whitespace-nowrap">
          ₹ {(record?.price || 0).toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      title: "Actions",
      width: 150,
      align: "center",
      render: (_, record) => (
        <Space size="small" wrap>
          <Button
            size="small"
            type="primary"
            onClick={async () => {
              setIsLoading(true);
              setEditingCarId(record._id);
              const bId = record?.brandId?._id || record?.brand?._id || record?.brand || "";
              const mId = record?.modelId?._id || record?.model?._id || record?.model || "";
              await fetchModelsByBrand(bId, "upcoming");
              setUpcomingForm({
                name: record?.carName || "",
                brand: bId,
                model: mId,
                launchedDate: record?.launchedDate
                  ? new Date(record.launchedDate).toISOString().split("T")[0]
                  : "",
                price: record?.price || "",
                imageUrl: record?.carImage?.path || record?.carImage || "",
                imageId: record?.carImage?._id || "",
                imageFile: null,
              });
              setIsLoading(false);
              setOpenUpcomingForm(true);
            }}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete this car?"
            onConfirm={() => handleDelete(record._id, true)}
            okText="Yes"
            cancelText="No"
          >
            <Button size="small" danger>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const tabItems = [
    {
      key: "1",
      label: "All Cars",
      children: (
        <div className="p-3 sm:p-4 md:p-6 bg-primary shadow rounded-lg">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <h1 className="text-blue-500 text-base sm:text-lg font-bold">Car Management</h1>
            <Button
              type="primary"
              size="middle"
              className="w-full sm:w-auto"
              onClick={() => {
                closeAndResetModals();
                setOpenStandardForm(true);
              }}
            >
              + Add Car
            </Button>
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-100 dark:border-gray-800">
            <Table
              rowKey="_id"
              columns={standardColumns}
              dataSource={standardCars}
              loading={isTableLoading}
              onChange={handleCarTableChange}
              scroll={{ x: 900 }}
              size="middle"
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
                showSizeChanger: true,
                responsive: true,
                showQuickJumper: false,
                pageSizeOptions: PAGE_SIZE_OPTIONS,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
                size: "small",
              }}
            />
          </div>
        </div>
      ),
    },
    {
      key: "2",
      label: "Upcoming Car",
      children: (
        <div className="p-3 sm:p-4 md:p-6 bg-primary shadow rounded-lg">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <h1 className="text-blue-500 text-base sm:text-lg font-bold">Upcoming Car Management</h1>
            <Button
              type="primary"
              className="w-full sm:w-auto"
              onClick={() => {
                closeAndResetModals();
                setOpenUpcomingForm(true);
              }}
            >
              + Add Upcoming Car
            </Button>
          </div>
          <div className="overflow-hidden rounded-lg border border-gray-100 dark:border-gray-800">
            <Table
              rowKey="_id"
              columns={upcomingColumns}
              dataSource={upcomingCars}
              scroll={{ x: 800 }}
              size="middle"
              pagination={false}
            />
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="p-2 sm:p-4 md:p-6 relative min-h-screen">
      {(isLoading || isImageUploading) && <LoadingOverlay />}

      <Tabs
        defaultActiveKey="1"
        type="card"
        items={tabItems}
        size="small"
        className="responsive-tabs"
      />

      {/* STANDARD CAR MODAL - RESPONSIVE */}
      {openStandardForm && (
        <div className="fixed z-50 inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-start sm:items-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-secondary text-primary rounded-xl shadow-xl w-full max-w-5xl my-2 sm:my-6 max-h-[98vh] sm:max-h-[92vh] overflow-hidden flex flex-col">
            {/* Modal Header - sticky */}
            <div className="sticky top-0 bg-secondary z-10 p-4 sm:p-6 border-b flex justify-between items-center">
              <h2 className="text-base sm:text-lg text-blue-500 font-semibold">
                {editingCarId ? "Edit Standard Car" : "Add Standard Car"}
              </h2>
              <Button type="text" onClick={closeAndResetModals} className="sm:hidden">
                ✕
              </Button>
            </div>

            {/* Modal Body - scrollable */}
            <div className="overflow-y-auto p-4 sm:p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Brand Name</label>
                  <Select
                    className="w-full"
                    size="large"
                    placeholder="Search or Select Brand"
                    showSearch
                    optionFilterProp="children"
                    value={form.brand || undefined}
                    onChange={handleStandardBrandChange}
                  >
                    {brands.map((b) => (
                      <Select.Option key={b._id} value={b._id}>
                        {b.name}
                      </Select.Option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">Model Name</label>
                  <Select
                    className="w-full"
                    size="large"
                    placeholder="Search or Select Model"
                    showSearch
                    optionFilterProp="children"
                    disabled={!form.brand}
                    loading={isModelsLoading}
                    value={form.model || undefined}
                    onChange={handleStandardModelChange}
                  >
                    {standardModels.map((m) => (
                      <Select.Option key={m._id} value={m._id}>
                        {m.name}
                      </Select.Option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">Variant Name</label>
                  <Select
                    className="w-full"
                    size="large"
                    placeholder="Search or Select Variant"
                    showSearch
                    optionFilterProp="children"
                    disabled={!form.model}
                    loading={isVariantsLoading}
                    value={form.variant || undefined}
                    onChange={handleVariantChange}
                  >
                    {variantsList.map((v) => (
                      <Select.Option key={v._id} value={v._id}>
                        {getVariantOptionLabel(v)}
                      </Select.Option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">Brochure Link</label>
                  <Input
                    size="large"
                    placeholder="https://brochure-link.pdf"
                    value={form.brochureLink}
                    onChange={(e) => setForm({ ...form, brochureLink: e.target.value })}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1.5">Description</label>
                  <Input.TextArea
                    rows={3}
                    placeholder="Write detailed overview about this car..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
              </div>

          

              {/* VARIANT DETAILS GRID - RESPONSIVE */}
              <div className="bg-primary p-3 sm:p-5 rounded-xl border">
                <h3 className="text-sm font-bold text-blue-500 mb-3 flex flex-wrap justify-between items-center gap-2">
                  <span>Complete Variant Specifications</span>
                  {selectedVariantDetails && <Tag color="blue">{selectedVariantDetails.fuelType}</Tag>}
                </h3>

                {selectedVariantDetails ? (
                  <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
                    {[
                      { label: "Variant Name", value: selectedVariantDetails.name },
                      { label: "Transmission", value: selectedVariantDetails.transmission },
                      { label: "Price", value: formatPriceShort(selectedVariantDetails.price), highlight: true },
                      { label: "Fuel Type", value: selectedVariantDetails.fuelType },
                      ...(selectedVariantDetails.fuelType !== "Electric"
                        ? [
                            { label: "Engine", value: formatWithUnit(selectedVariantDetails.engineDisplacement || selectedVariantDetails.engine, "CC") },
                            { label: "Emission Norms", value: selectedVariantDetails.engineEmissionNorms },
                            { label: "Max Power", value: formatWithUnit(selectedVariantDetails.maxPower || selectedVariantDetails.power, "HP") },
                            { label: "Max Torque", value: formatWithUnit(selectedVariantDetails.maxTorque || selectedVariantDetails.torque, "Nm") },
                            { label: "Mileage", value: formatWithUnit(selectedVariantDetails.mileage, "kmpl") },
                            { label: "Fuel Tank", value: formatWithUnit(selectedVariantDetails.fuelTankCapacity, "Litres") },
                            { label: "Cyl / Gearbox", value: `${formatWithUnit(selectedVariantDetails.cylinders, "Cyl")} / ${formatWithUnit(selectedVariantDetails.gearBox || selectedVariantDetails.gearbox, "Speed")}` },
                            { label: "Warranty", value: selectedVariantDetails.warranty },
                          ]
                        : [
                            { label: "Battery Capacity", value: formatWithUnit(selectedVariantDetails.batteryCapacity, "kWh") },
                            { label: "HV Battery Warranty", value: selectedVariantDetails.hvBatteryWarranty },
                            { label: "Battery Type", value: selectedVariantDetails.batteryType },
                            { label: "Claimed Range", value: formatWithUnit(selectedVariantDetails.claimedRange, "km"), highlight: true },
                            { label: "Real Range", value: formatWithUnit(selectedVariantDetails.realLifeRange, "km") },
                            { label: "Motor Type", value: selectedVariantDetails.motorType },
                            { label: "Max Power", value: formatWithUnit(selectedVariantDetails.maxPower, "HP") },
                            { label: "Max Torque", value: formatWithUnit(selectedVariantDetails.maxTorque, "Nm") },
                            { label: "Charging Port", value: selectedVariantDetails.chargingPortType },
                            { label: "Fast Charging", value: formatWithUnit(selectedVariantDetails.maxFastChargingSupport, "kW") },
                          ]),
                      { label: "Seating", value: formatWithUnit(selectedVariantDetails.seatingCapacity, "Seater") },
                      { label: "Drive Type", value: selectedVariantDetails.driveType },
                      { label: "Boot Space", value: formatWithUnit(selectedVariantDetails.bootSpace, "litres") },
                      { label: "Ground Clearance", value: formatWithUnit(selectedVariantDetails.groundClearance || selectedVariantDetails.dimensions?.groundClearance, "mm") },
                      { label: "Dimensions", value: `${formatWithUnit(selectedVariantDetails.length || selectedVariantDetails.dimensions?.length, "mm")} x ${formatWithUnit(selectedVariantDetails.width || selectedVariantDetails.dimensions?.width, "mm")} x ${formatWithUnit(selectedVariantDetails.height || selectedVariantDetails.dimensions?.height, "mm")}` },
                      { label: "Wheel Base", value: formatWithUnit(selectedVariantDetails.wheelBase || selectedVariantDetails.dimensions?.wheelBase, "mm") },
                      { label: "Tyre Size", value: selectedVariantDetails.tyreSize || selectedVariantDetails.dimensions?.tyreSize },
                      { label: "Touchscreen", value: formatWithUnit(selectedVariantDetails.touchscreenSize, "inches") },
                      { label: "USB / C-Ports", value: `${selectedVariantDetails.usbPort ?? 0} USB / ${selectedVariantDetails.cPort ?? 0} Type-C` },
                      { label: "Sunroof", value: selectedVariantDetails.sunroof || "No" },
                    ].map((item, i) => (
                      <div key={i} className="bg-secondary p-3 rounded-lg border">
                        <span className="block text-gray-400 mb-1 text-[11px]">{item.label}</span>
                        <span className={`font-semibold text-xs break-words ${item.highlight ? "text-green-600 sm:text-sm" : ""}`}>
                          {item.value || "-"}
                        </span>
                      </div>
                    ))}

                    {/* Safety Tags */}
                    <div className="col-span-1 xs:col-span-2 sm:col-span-2 md:col-span-3 lg:col-span-4 bg-secondary p-3 rounded-lg border">
                      <span className="block text-gray-400 mb-2 font-medium text-xs">Safety & Key Features</span>
                      <div className="flex flex-wrap gap-1.5">
                        <Tag color={selectedVariantDetails.airbags ? "green" : "default"}>Airbags: {selectedVariantDetails.airbags || 0}</Tag>
                        <Tag color={selectedVariantDetails.abs ? "green" : "default"}>ABS</Tag>
                        <Tag color={selectedVariantDetails.ebd ? "green" : "default"}>EBD</Tag>
                        <Tag color={selectedVariantDetails.esc ? "green" : "default"}>ESC</Tag>
                        <Tag color={selectedVariantDetails.hillAssist ? "green" : "default"}>Hill Assist</Tag>
                        <Tag color={selectedVariantDetails.camera360 ? "green" : "default"}>360 Camera</Tag>
                        <Tag color={selectedVariantDetails.reverseCamera ? "green" : "default"}>Reverse Cam</Tag>
                        <Tag color={selectedVariantDetails.adas ? "green" : "default"}>ADAS</Tag>
                        <Tag color={selectedVariantDetails.androidAuto ? "green" : "default"}>Android Auto</Tag>
                        <Tag color={selectedVariantDetails.appleCarPlay ? "green" : "default"}>CarPlay</Tag>
                        <Tag color={selectedVariantDetails.ventilatedSeats ? "green" : "default"}>Ventilated</Tag>
                        <Tag color={selectedVariantDetails.wirelessCharger ? "green" : "default"}>Wireless Charger</Tag>
                        <Tag color={selectedVariantDetails.cruiseControl ? "green" : "default"}>Cruise</Tag>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-8 text-sm">
                    Please select a Model and Variant to view specifications.
                  </div>
                )}
              </div>

              {/* NCAP */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t pt-4">
                {[
                  { label: "Global NCAP", key: "gncap" },
                  { label: "Bharat NCAP", key: "bncap" },
                  { label: "Euro NCAP", key: "gcap" },
                ].map((ncap) => (
                  <div key={ncap.key}>
                    <label className="block text-xs font-medium mb-1">{ncap.label}</label>
                    <Select
                      className="w-full"
                      size="large"
                      placeholder="Stars"
                      allowClear
                      value={form[ncap.key] || undefined}
                      onChange={(val) => setForm({ ...form, [ncap.key]: val || "" })}
                    >
                      {["1 Star", "2 Star", "3 Star", "4 Star", "5 Star"].map((s) => (
                        <Select.Option key={s} value={s}>
                          {s}
                        </Select.Option>
                      ))}
                    </Select>
                  </div>
                ))}
              </div>

              {/* Images */}
              <div className="border-t pt-4">
                <label className="block text-sm font-medium mb-3">Car Images (Current & New)</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 mb-3">
                  {form.existingImages.map((img, index) => {
                    const srcPath = img?.path || img;
                    return (
                      <div key={`old-${index}`} className="relative w-full h-24 bg-primary border border-blue-400 rounded-lg overflow-hidden group">
                        <img src={srcPath} className="w-full h-full object-cover" alt="existing" />
                        <span className="absolute top-1 left-1 bg-blue-500 text-white text-[10px] px-1 rounded">Saved</span>
                        <button
                          type="button"
                          className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex justify-center items-center text-xs font-bold"
                          onClick={() => removeExistingImage(index)}
                        >
                          Remove
                        </button>
                      </div>
                    );
                  })}
                  {form.imageFiles.map((file, index) => (
                    <div key={`new-${index}`} className="relative w-full h-24 bg-primary border border-green-400 rounded-lg overflow-hidden group">
                      <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt="preview" />
                      <span className="absolute top-1 left-1 bg-green-500 text-white text-[10px] px-1 rounded">New</span>
                      <button
                        type="button"
                        className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex justify-center items-center text-xs font-bold"
                        onClick={() => removeSelectedImageFile(index)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                <label className="flex flex-col items-center bg-primary justify-center w-full h-28 border-2 border-dashed rounded-lg cursor-pointer overflow-hidden">
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleMultipleImages} />
                  <div className="text-center text-gray-500 p-2">
                    <svg className="mx-auto mb-1" width="30" height="30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeWidth="1.5" d="M3 16.5a4.5 4.5 0 014.5-4.5H9l1.5-2h3L15 12h1.5A4.5 4.5 0 0121 16.5v.5H3v-.5z" />
                    </svg>
                    <span className="text-xs">Click / Drag to select more images</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Footer sticky */}
            <div className="sticky bottom-0 bg-secondary p-4 sm:p-6 border-t flex flex-col-reverse sm:flex-row justify-end gap-3">
              <Button onClick={closeAndResetModals} className="w-full sm:w-auto" size="large">
                Cancel
              </Button>
              <Button type="primary" onClick={handleSaveStandardCar} className="w-full sm:w-auto" size="large">
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* UPCOMING CAR MODAL - RESPONSIVE */}
      {openUpcomingForm && (
        <div className="fixed z-50 inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-start sm:items-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-secondary text-primary rounded-xl shadow-xl w-full max-w-lg my-2 sm:my-8 max-h-[98vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
            <div className="sticky top-0 bg-secondary z-10 p-4 sm:p-6 border-b">
              <h2 className="text-base sm:text-lg text-blue-500 font-semibold">
                {editingCarId ? "Edit Upcoming Car" : "Add Upcoming Car"}
              </h2>
            </div>

            <div className="overflow-y-auto p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Car Name</label>
                <Input
                  size="large"
                  placeholder="Ex- Thar EV"
                  value={upcomingForm.name}
                  onChange={(e) => setUpcomingForm({ ...upcomingForm, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Brand Name</label>
                <Select
                  className="w-full"
                  size="large"
                  placeholder="Search or Select Brand"
                  showSearch
                  optionFilterProp="children"
                  value={upcomingForm.brand || undefined}
                  onChange={handleUpcomingBrandChange}
                >
                  {brands.map((b) => (
                    <Select.Option key={b._id} value={b._id}>
                      {b.name}
                    </Select.Option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Model Name</label>
                <Select
                  className="w-full"
                  size="large"
                  placeholder="Search or Select Model"
                  showSearch
                  optionFilterProp="children"
                  disabled={!upcomingForm.brand}
                  loading={isModelsLoading}
                  value={upcomingForm.model || undefined}
                  onChange={(val) => setUpcomingForm({ ...upcomingForm, model: val })}
                >
                  {upcomingModels.map((m) => (
                    <Select.Option key={m._id} value={m._id}>
                      {m.name}
                    </Select.Option>
                  ))}
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Launched Date</label>
                  <Input
                    type="date"
                    size="large"
                    value={upcomingForm.launchedDate || ""}
                    onChange={(e) => setUpcomingForm({ ...upcomingForm, launchedDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Expected Price (₹)</label>
                  <Input
                    size="large"
                    placeholder="₹ 0"
                    value={upcomingForm.price || ""}
                    onChange={(e) =>
                      setUpcomingForm({ ...upcomingForm, price: formatNumeric(e.target.value) })
                    }
                  />
                </div>
              </div>

              <label className="flex flex-col items-center bg-primary justify-center w-full h-36 border-2 border-dashed rounded-lg cursor-pointer overflow-hidden mt-2">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) =>
                    setUpcomingForm({
                      ...upcomingForm,
                      imageFile: e.target.files ? e.target.files[0] : null,
                    })
                  }
                />
                {upcomingForm.imageFile || upcomingForm.imageUrl ? (
                  <img
                    src={upcomingForm.imageFile ? URL.createObjectURL(upcomingForm.imageFile) : upcomingForm.imageUrl}
                    className="w-full h-full object-contain"
                    alt="Preview"
                  />
                ) : (
                  <div className="text-center text-gray-500">
                    <svg className="mx-auto mb-2" width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeWidth="1.5" d="M3 16.5a4.5 4.5 0 014.5-4.5H9l1.5-2h3L15 12h1.5A4.5 4.5 0 0121 16.5v.5H3v-.5z" />
                    </svg>
                    <span className="text-sm">Upload Showcase Image</span>
                  </div>
                )}
              </label>
            </div>

            <div className="sticky bottom-0 bg-secondary p-4 sm:p-6 border-t flex flex-col-reverse sm:flex-row justify-end gap-3">
              <Button onClick={closeAndResetModals} className="w-full sm:w-auto" size="large">
                Cancel
              </Button>
              <Button type="primary" onClick={handleSaveUpcomingCar} className="w-full sm:w-auto" size="large">
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Responsive overrides for Ant Design */}
      <style>{`
        @media (max-width: 640px) {
          .ant-tabs-nav { margin-bottom: 12px !important; }
          .ant-table-pagination { flex-wrap: wrap; justify-content: center !important; }
          .ant-pagination-options { margin-top: 8px; }
        }
        .responsive-tabs .ant-tabs-tab { padding: 8px 12px !important; font-size: 13px; }
        @media (min-width: 640px) {
          .responsive-tabs .ant-tabs-tab { padding: 12px 16px !important; font-size: 14px; }
        }
      `}</style>
    </div>
  );
}
