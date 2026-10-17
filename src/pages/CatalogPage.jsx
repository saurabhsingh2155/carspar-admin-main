import React, { useEffect, useState } from "react";
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
  Checkbox,
  ColorPicker,
  Tag,
} from "antd";
import LoadingOverlay from "../components/LoadingOverlay";
import BulkJsonUploadButton from "../components/BulkJsonUploadButton";

const formatNumeric = (val) => val.replace(/[^0-9]/g, "");

/* Price -> number. Handles undefined / "" / "1500000" / "15,00,000" / "₹ 1500000" */
const getVariantPrice = (variant) => {
  const raw = variant?.price;
  if (raw === null || raw === undefined || raw === "") return null;
  const num =
    typeof raw === "number" ? raw : Number(String(raw).replace(/[^0-9.]/g, ""));
  return Number.isFinite(num) && num > 0 ? num : null;
};

/* Ascending by price; variants with no price go to the bottom (then by name) */
const sortVariantsByPriceAsc = (list = []) =>
  [...list].sort((a, b) => {
    const pa = getVariantPrice(a);
    const pb = getVariantPrice(b);
    if (pa === null && pb === null)
      return (a.name || "").localeCompare(b.name || "");
    if (pa === null) return 1;
    if (pb === null) return -1;
    if (pa !== pb) return pa - pb;
    return (a.name || "").localeCompare(b.name || "");
  });

/* Custom Expand Icon Component */
const CustomExpandIcon = ({ expanded, onExpand, record }) => (
  <button
    type="button"
    onClick={(e) => onExpand(record, e)}
    className="focus:outline-none p-1 text-blue-600 hover:text-blue-800 transition-transform duration-300 transform inline-flex items-center justify-center cursor-pointer"
    style={{ transform: expanded ? "rotate(90deg)" : "rotate(0deg)" }}
  >
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  </button>
);

export default function CatalogPage() {
  /* ================= STATE ================= */
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [variants, setVariants] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [expandedModelKeys, setExpandedModelKeys] = useState([]);
  const [expandedVariantKeys, setExpandedVariantKeys] = useState([]);

  const [openBrandForm, setOpenBrandForm] = useState(false);
  const [openModelForm, setOpenModelForm] = useState(false);
  const [openVariantForm, setOpenVariantForm] = useState(false);

  const [editingBrandId, setEditingBrandId] = useState(null);
  const [editingModelId, setEditingModelId] = useState(null);
  const [editingVariantId, setEditingVariantId] = useState(null);

  // Temporary state for color name and hex code input before adding to array
  const [selectedColorName, setSelectedColorName] = useState("");
  const [selectedColorPicker, setSelectedColorPicker] = useState("#1677FF");

  const [brandForm, setBrandForm] = useState({
    name: "",
    imageFile: null,
    imageId: "",
    imageUrl: "",
  });
  const [modelForm, setModelForm] = useState({
    name: "",
    brand: "",
    bodyType: "",
  });

  const initialVariantForm = {
    model: "",
    name: "",
    colors: [], // Will store objects like [{ name: "Red", hex: "#FF0000" }]
    fuelType: "",
    transmission: "",
    gearBox: "",
    price: "",
    warranty: "",
    engineDisplacement: "",
    engineType: "",
    engineEmissionNorms: "",
    mileage: "",
    cylinders: "",
    turboCharger: false,
    fuelTankCapacity: "",
    cngCylinderCapacity: "",
    batteryCapacity: "",
    batteryType: "",
    batteryCellType: "",
    hvBatteryWarranty: "",
    frunk: "",
    claimedRange: "",
    realLifeRange: "",
    motorPower: "",
    motorType: "",
    maxPower: "",
    maxTorque: "",
    chargingPortType: "",
    maxFastChargingSupport: "",
    chargingOptions: [{ charger: "", percentage: "", time: "" }],
    v2l: false,
    v2v: false,
    seatingCapacity: "",
    driveType: "",
    tpms: false,
    tweeter: false,
    bootSpace: "",
    usbPort: "",
    cPort: "",
    videos: [{ url: "", thumbnail: "" }],
    touchscreenSize: "",
    speakers: "",
    audioSystemBrand: "",
    wirelessCharger: false,
    bluetoothConnectivity: false, // Added bluetoothConnectivity default
    spareWheel: "",
    wheelType: "", // Added wheelType field
    seatMaterial: "", // Added seatMaterial field
    wirelessAndroidAutoAppleCarPlay: false,
    alexaBuiltInWithChatGPT: false,
    coastToCoastTripleScreen: false,
    steeringColumn: "",
    bootOpeningElectronic: false,
    heightAdjustableDriverSeat: false,
    ventilatedSeats: false,
    electricAdjustableSeats: false,
    automaticClimateControl: false,
    frontArmRest: false,
    rearSeatCentreArmRest: false,
    rearACVents: false,
    cruiseControl: false,
    engineStartStopButton: false,
    powerWindows: "",
    rainSensingWiper: false,
    rearWindowWiper: false,
    rearWindowDefogger: false,
    headlamps: "",
    fogLamps: false,
    roofRails: false,
    automaticHeadlamps: false,
    sunroof: "No",
    length: "",
    width: "",
    height: "",
    wheelBase: "",
    groundClearance: "",
    tyreSize: "",
    kerbWeight: "",
    airbags: "",
    abs: false,
    ebd: false,
    esc: false,
    hillDescentControl: false,
    hillAssist: false,
    camera360: false,
    reverseCamera: false,
    frontParkingSensors: false,
    rearParkingSensors: false,
    advanceInternetFeatures: false,
    adas: false,
    frontBrakeType: "",
    rearBrakeType: "",
  };

  const [variantForm, setVariantForm] = useState(initialVariantForm);

  /* ================= FETCH DATA ================= */
  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const [bRes, mRes, vRes] = await Promise.all([
        api.get(`/brands`),
        api.get(`/models`),
        api.get(`/variants`),
      ]);
      setBrands(bRes.data.data || []);
      setModels(mRes.data.data || []);
      setVariants(vRes.data.data || []);
    } catch (err) {
      message.error(err.response?.data?.message || "Failed to fetch data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  /* ================= HELPERS ================= */
  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "brands");
    const res = await api.post(`/files`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.data._id;
  };

  const closeAndResetModals = () => {
    setOpenBrandForm(false);
    setOpenModelForm(false);
    setOpenVariantForm(false);
    setEditingBrandId(null);
    setEditingModelId(null);
    setEditingVariantId(null);
    setSelectedColorName("");
    setSelectedColorPicker("#1677FF");
    setBrandForm({ name: "", imageFile: null, imageId: "", imageUrl: "" });
    setModelForm({ name: "", brand: "", bodyType: "" });
    setVariantForm(initialVariantForm);
  };

  /* ================= MULTIPLE COLORS HANDLERS ================= */
  const handleAddColor = () => {
    if (!selectedColorName.trim()) {
      message.warning("Please enter a color name!");
      return;
    }
    const formattedHex = selectedColorPicker.toUpperCase();
    const colorExists = variantForm.colors.some(
      (c) =>
        c.hex === formattedHex ||
        c.name.toLowerCase() === selectedColorName.trim().toLowerCase(),
    );

    if (colorExists) {
      message.warning("This color or hex code is already added!");
      return;
    }

    setVariantForm({
      ...variantForm,
      colors: [
        ...variantForm.colors,
        { name: selectedColorName.trim(), hex: formattedHex },
      ],
    });
    setSelectedColorName("");
  };

  const handleRemoveColor = (hexToRemove) => {
    setVariantForm({
      ...variantForm,
      colors: variantForm.colors.filter((c) => c.hex !== hexToRemove),
    });
  };

  /* ================= DYNAMIC FORM HANDLERS ================= */
  const handleAddVideoLink = () => {
    setVariantForm({
      ...variantForm,
      videos: [...variantForm.videos, { url: "", thumbnail: "" }],
    });
  };

  const handleRemoveVideoLink = (index) => {
    setVariantForm({
      ...variantForm,
      videos: variantForm.videos.filter((_, i) => i !== index),
    });
  };

  const handleVideoUrlChange = (index, value) => {
    const updatedVideos = [...variantForm.videos];
    updatedVideos[index].url = value;

    if (value.includes("youtube.com") || value.includes("youtu.be")) {
      const regExp =
        /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = value.match(regExp);
      if (match && match[2].length === 11) {
        updatedVideos[index].thumbnail =
          `https://img.youtube.com/vi/${match[2]}/mqdefault.jpg`;
      }
    }

    setVariantForm({ ...variantForm, videos: updatedVideos });
  };

  const handleAddChargingOption = () => {
    setVariantForm({
      ...variantForm,
      chargingOptions: [
        ...variantForm.chargingOptions,
        { charger: "", percentage: "", time: "" },
      ],
    });
  };

  const handleRemoveChargingOption = (index) => {
    setVariantForm({
      ...variantForm,
      chargingOptions: variantForm.chargingOptions.filter(
        (_, i) => i !== index,
      ),
    });
  };

  const handleChargingOptionChange = (index, field, value) => {
    const updatedOptions = [...variantForm.chargingOptions];
    updatedOptions[index][field] = value;
    setVariantForm({ ...variantForm, chargingOptions: updatedOptions });
  };

  /* ================= SAVE / DELETE HANDLERS ================= */
  const handleSaveBrand = async () => {
    setIsLoading(true);
    try {
      let imageId = brandForm.imageId;
      if (brandForm.imageFile) imageId = await uploadFile(brandForm.imageFile);
      const data = { name: brandForm.name, image: imageId };
      if (editingBrandId)
        await api.patch(`/brands/${editingBrandId}`, data);
      else await api.post(`/brands`, data);
      closeAndResetModals();
      fetchAllData();
    } catch (err) {
      message.error(err.response?.data?.message || "Save failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveModel = async () => {
    setIsLoading(true);
    try {
      const data = {
        name: modelForm.name,
        brandId: modelForm.brand,
        brand: modelForm.brand,
        bodyType: modelForm.bodyType,
      };
      if (editingModelId)
        await api.patch(`/models/${editingModelId}`, data);
      else await api.post(`/models`, data);
      closeAndResetModals();
      fetchAllData();
    } catch (err) {
      message.error(err.response?.data?.message || "Save failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveVariant = async () => {
    setIsLoading(true);
    try {
      const isElectric = variantForm.fuelType === "Electric";
      const isCNG = variantForm.fuelType === "CNG";
      const isICE = variantForm.fuelType && !isElectric;

      const payload = {
        name: variantForm.name,
        model: variantForm.model,
        colors: variantForm.colors,
        fuelType: variantForm.fuelType,
        transmission: variantForm.transmission,
        gearBox: isICE ? variantForm.gearBox || undefined : undefined,
        price: variantForm.price ? Number(variantForm.price) : undefined,
        warranty: variantForm.warranty || undefined,

        // Engine & Fuel Specs
        engineDisplacement:
          isICE && variantForm.engineDisplacement
            ? Number(variantForm.engineDisplacement)
            : undefined,
        engineType: isICE ? variantForm.engineType || undefined : undefined,
        engineEmissionNorms: isICE
          ? variantForm.engineEmissionNorms || undefined
          : undefined,
        mileage: isICE ? variantForm.mileage || undefined : undefined,
        cylinders:
          isICE && variantForm.cylinders
            ? Number(variantForm.cylinders)
            : undefined,
        turboCharger: isICE ? Boolean(variantForm.turboCharger) : false,
        fuelTankCapacity: isICE
          ? variantForm.fuelTankCapacity || undefined
          : undefined,
        cngCylinderCapacity: isCNG
          ? variantForm.cngCylinderCapacity || undefined
          : undefined,

        // EV Specs
        batteryCapacity: isElectric
          ? variantForm.batteryCapacity || undefined
          : undefined,
        batteryType: isElectric
          ? variantForm.batteryType || undefined
          : undefined,
        batteryCellType: isElectric
          ? variantForm.batteryCellType || undefined
          : undefined,
        hvBatteryWarranty: isElectric
          ? variantForm.hvBatteryWarranty || undefined
          : undefined,
        frunk: isElectric ? variantForm.frunk || undefined : undefined,
        claimedRange: isElectric
          ? variantForm.claimedRange || undefined
          : undefined,
        realLifeRange: isElectric
          ? variantForm.realLifeRange || undefined
          : undefined,
        motorPower: isElectric
          ? variantForm.motorPower || undefined
          : undefined,
        motorType: isElectric ? variantForm.motorType || undefined : undefined,
        chargingPortType: isElectric
          ? variantForm.chargingPortType || undefined
          : undefined,
        maxFastChargingSupport: isElectric
          ? variantForm.maxFastChargingSupport || undefined
          : undefined,
        chargingOptions: isElectric
          ? variantForm.chargingOptions.filter(
              (opt) => opt.charger || opt.percentage || opt.time,
            )
          : undefined,
        v2l: isElectric ? Boolean(variantForm.v2l) : false,
        v2v: isElectric ? Boolean(variantForm.v2v) : false,

        maxPower: variantForm.maxPower || undefined,
        maxTorque: variantForm.maxTorque || undefined,
        seatingCapacity: variantForm.seatingCapacity
          ? Number(variantForm.seatingCapacity)
          : undefined,
        driveType: variantForm.driveType || undefined,
        tpms: Boolean(variantForm.tpms),
        tweeter: Boolean(variantForm.tweeter),
        bootSpace: variantForm.bootSpace || undefined,
        usbPort: variantForm.usbPort ? Number(variantForm.usbPort) : 0,
        cPort: variantForm.cPort ? Number(variantForm.cPort) : 0,

        videos: variantForm.videos
          .filter((v) => v.url && v.url.trim() !== "")
          .map((v) => v.url.trim()),

        touchscreenSize: variantForm.touchscreenSize || undefined,
        speakers: variantForm.speakers
          ? Number(variantForm.speakers)
          : undefined,
        audioSystemBrand: variantForm.audioSystemBrand || undefined,
        wirelessCharger: Boolean(variantForm.wirelessCharger),
        spareWheel: variantForm.spareWheel || undefined,
        wheelType: variantForm.wheelType || undefined, // Added wheelType payload
        seatMaterial: variantForm.seatMaterial || undefined, // Added seatMaterial payload
        wirelessAndroidAutoAppleCarPlay: Boolean(
          variantForm.wirelessAndroidAutoAppleCarPlay,
        ),
        alexaBuiltInWithChatGPT: Boolean(variantForm.alexaBuiltInWithChatGPT),
        coastToCoastTripleScreen: Boolean(variantForm.coastToCoastTripleScreen),
        steeringColumn: variantForm.steeringColumn || undefined,
        bootOpeningElectronic: Boolean(variantForm.bootOpeningElectronic),
        heightAdjustableDriverSeat: Boolean(
          variantForm.heightAdjustableDriverSeat,
        ),
        bluetoothConnectivity: Boolean(variantForm.bluetoothConnectivity),
        ventilatedSeats: Boolean(variantForm.ventilatedSeats),
        electricAdjustableSeats: Boolean(variantForm.electricAdjustableSeats),
        automaticClimateControl: Boolean(variantForm.automaticClimateControl),
        frontArmRest: Boolean(variantForm.frontArmRest),
        rearSeatCentreArmRest: Boolean(variantForm.rearSeatCentreArmRest),
        rearACVents: Boolean(variantForm.rearACVents),
        cruiseControl: Boolean(variantForm.cruiseControl),
        engineStartStopButton: Boolean(variantForm.engineStartStopButton),
        powerWindows: variantForm.powerWindows || undefined,
        rainSensingWiper: Boolean(variantForm.rainSensingWiper),
        rearWindowWiper: Boolean(variantForm.rearWindowWiper),
        rearWindowDefogger: Boolean(variantForm.rearWindowDefogger),
        headlamps: variantForm.headlamps || undefined,
        fogLamps: Boolean(variantForm.fogLamps),
        roofRails: Boolean(variantForm.roofRails),
        automaticHeadlamps: Boolean(variantForm.automaticHeadlamps),
        sunroof: variantForm.sunroof || undefined,

        // Dimensions
        length: variantForm.length || undefined,
        width: variantForm.width || undefined,
        height: variantForm.height || undefined,
        wheelBase: variantForm.wheelBase || undefined,
        groundClearance: variantForm.groundClearance || undefined,
        tyreSize: variantForm.tyreSize || undefined,
        kerbWeight: variantForm.kerbWeight || undefined,

        // Safety
        airbags: variantForm.airbags ? Number(variantForm.airbags) : undefined,
        abs: Boolean(variantForm.abs),
        ebd: Boolean(variantForm.ebd),
        esc: Boolean(variantForm.esc),
        hillDescentControl: Boolean(variantForm.hillDescentControl),
        hillAssist: Boolean(variantForm.hillAssist),
        camera360: Boolean(variantForm.camera360),
        reverseCamera: Boolean(variantForm.reverseCamera),
        frontParkingSensors: Boolean(variantForm.frontParkingSensors),
        rearParkingSensors: Boolean(variantForm.rearParkingSensors),
        advanceInternetFeatures: Boolean(variantForm.advanceInternetFeatures),
        adas: Boolean(variantForm.adas),
        frontBrakeType: variantForm.frontBrakeType || undefined,
        rearBrakeType: variantForm.rearBrakeType || undefined,
      };

      if (editingVariantId)
        await api.patch(`/variants/${editingVariantId}`, payload);
      else await api.post(`/variants`, payload);
      closeAndResetModals();
      fetchAllData();
    } catch (err) {
      message.error(err.response?.data?.message || "Save failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (type, id) => {
    setIsLoading(true);
    try {
      await api.delete(`/${type}/${id}`);
      message.success("Deleted successfully");
      fetchAllData();
    } catch (err) {
      message.error(err.response?.data?.message || "Delete failed");
    } finally {
      setIsLoading(false);
    }
  };

  /* ================= SORTED DATA HELPERS ================= */
  const sortedBrands = [...brands].sort((a, b) =>
    (a.name || "").localeCompare(b.name || ""),
  );

  const sortedModelsData = Object.values(
    models.reduce((acc, model) => {
      const brandObj = typeof model.brand === "object" ? model.brand : null;
      const brandId =
        brandObj?._id ||
        (typeof model.brand === "string" ? model.brand : null) ||
        model.brandId ||
        "unassigned";
      const brandName = brandObj?.name || "Unassigned / Other Brands";

      if (!acc[brandId]) {
        acc[brandId] = {
          _id: brandId,
          name: brandName,
          totalModels: 0,
          models: [],
        };
      }

      acc[brandId].models.push(model);
      acc[brandId].totalModels = acc[brandId].models.length;

      return acc;
    }, {}),
  )
    .map((group) => ({
      ...group,
      models: group.models.sort((a, b) =>
        (a.name || "").localeCompare(b.name || ""),
      ),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const sortedVariantsData = Object.values(
    variants.reduce((acc, variant) => {
      const modelObj = typeof variant.model === "object" ? variant.model : null;
      const modelId =
        modelObj?._id ||
        (typeof variant.model === "string" ? variant.model : null) ||
        variant.modelId ||
        "unassigned";
      const modelName = modelObj?.name || "Unassigned / Other Models";

      if (!acc[modelId]) {
        acc[modelId] = {
          _id: modelId,
          name: modelName,
          totalVariants: 0,
          variants: [],
        };
      }

      acc[modelId].variants.push(variant);
      acc[modelId].totalVariants = acc[modelId].variants.length;

      return acc;
    }, {}),
  )
    .map((group) => {
      // Variants inside every model group are ordered by price (lowest first)
      const sortedVariants = sortVariantsByPriceAsc(group.variants);
      return {
        ...group,
        variants: sortedVariants,
        lowestPrice: getVariantPrice(sortedVariants[0]),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  /* ================= TABLE COLUMNS ================= */
  const brandColumns = [
    {
      title: "Image",
      dataIndex: "image",
      render: (img) =>
        img ? (
          <img src={img} className="w-20 h-12 object-contain" alt="brand" />
        ) : (
          "No Image"
        ),
    },
    {
      title: "Brand Name",
      dataIndex: "name",
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: "Actions",
      align: "center",
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            onClick={() => {
              setEditingBrandId(record._id);
              setBrandForm({
                name: record.name,
                imageId: record.imageId,
                imageUrl: record.image,
                imageFile: null,
              });
              setOpenBrandForm(true);
            }}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete this brand?"
            onConfirm={() => handleDelete("brands", record._id)}
          >
            <Button danger>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const brandGroupColumns = [
    {
      title: "Brand Name",
      dataIndex: "name",
      key: "name",
      render: (text) => <strong className="text-base">{text}</strong>,
    },
    {
      title: "Total Models",
      dataIndex: "totalModels",
      key: "totalModels",
      render: (count) => (
        <span className="font-semibold text-blue-500">{count} Model(s)</span>
      ),
    },
  ];

  const nestedModelColumns = [
    {
      title: "Model Name",
      dataIndex: "name",
      key: "name",
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: "Body Type",
      dataIndex: "bodyType",
      key: "bodyType",
      render: (text) => text || "-",
    },
    {
      title: "Actions",
      align: "center",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            onClick={() => {
              setEditingModelId(record._id);
              const bId =
                typeof record.brand === "object"
                  ? record.brand?._id
                  : record.brand || record.brandId;
              setModelForm({
                name: record.name,
                brand: bId,
                bodyType: record.bodyType,
              });
              setOpenModelForm(true);
            }}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete this model?"
            onConfirm={() => handleDelete("models", record._id)}
          >
            <Button danger>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const modelGroupColumns = [
    {
      title: "Model Name",
      dataIndex: "name",
      key: "name",
      render: (text) => <strong className="text-base">{text}</strong>,
    },
    {
      title: "Total Variants",
      dataIndex: "totalVariants",
      key: "totalVariants",
      render: (count) => (
        <span className="font-semibold text-blue-500">{count} Variant(s)</span>
      ),
    },
  ];

  const nestedVariantColumns = [
    { title: "Variant Name", dataIndex: "name", key: "name" },
    { title: "Fuel Type", dataIndex: "fuelType", key: "fuelType" },
    { title: "Transmission", dataIndex: "transmission", key: "transmission" },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      // Sortable: ascending by default, click header to toggle
      sorter: (a, b) =>
        (getVariantPrice(a) ?? Number.POSITIVE_INFINITY) -
        (getVariantPrice(b) ?? Number.POSITIVE_INFINITY),
      defaultSortOrder: "ascend",
      sortDirections: ["ascend", "descend"],
      render: (p) =>
        typeof p === "number" && p > 0
          ? `₹ ${p.toLocaleString("en-IN")}`
          : "N/A",
    },
    {
      title: "Actions",
      align: "center",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            onClick={() => {
              setEditingVariantId(record._id);

              const formattedColors = (record.colors || []).map((c) => {
                if (typeof c === "string") {
                  return { name: c, hex: c };
                }
                return { name: c.name || "Color", hex: c.hex || "#000000" };
              });

              setVariantForm({
                model: record.model?._id || record.model || "",
                name: record.name || "",
                colors: formattedColors,
                fuelType: record.fuelType || "",
                transmission: record.transmission || "",
                gearBox: record.gearBox || "",
                price: record.price ? String(record.price) : "",
                warranty: record.warranty || "",

                engineDisplacement: record.engineDisplacement
                  ? String(record.engineDisplacement)
                  : "",
                engineType: record.engineType || "",
                engineEmissionNorms: record.engineEmissionNorms || "",
                mileage: record.mileage || "",
                cylinders: record.cylinders ? String(record.cylinders) : "",
                turboCharger: record.turboCharger ?? false,
                fuelTankCapacity: record.fuelTankCapacity || "",
                cngCylinderCapacity: record.cngCylinderCapacity || "",

                batteryCapacity: record.batteryCapacity || "",
                batteryType: record.batteryType || "",
                batteryCellType: record.batteryCellType || "",
                hvBatteryWarranty: record.hvBatteryWarranty || "",
                frunk: record.frunk || "",
                claimedRange: record.claimedRange || "",
                realLifeRange: record.realLifeRange || "",
                motorPower: record.motorPower || "",
                motorType: record.motorType || "",
                maxPower: record.maxPower || "",
                maxTorque: record.maxTorque || "",
                chargingPortType: record.chargingPortType || "",
                maxFastChargingSupport: record.maxFastChargingSupport || "",
                chargingOptions: record.chargingOptions?.length
                  ? record.chargingOptions
                  : [{ charger: "", percentage: "", time: "" }],
                v2l: record.v2l ?? false,
                v2v: record.v2v ?? false,

                seatingCapacity: record.seatingCapacity
                  ? String(record.seatingCapacity)
                  : "",
                driveType: record.driveType || "",
                tpms: record.tpms ?? false,
                tweeter: record.tweeter ?? false,
                bluetoothConnectivity: record.bluetoothConnectivity ?? false,
                bootSpace: record.bootSpace || "",
                usbPort: record.usbPort ? String(record.usbPort) : "",
                cPort: record.cPort ? String(record.cPort) : "",

                videos: record.videos?.length
                  ? record.videos.map((v) => {
                      const urlStr = typeof v === "string" ? v : v.url || "";
                      let thumbnail = "";
                      if (
                        urlStr.includes("youtube.com") ||
                        urlStr.includes("youtu.be")
                      ) {
                        const regExp =
                          /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
                        const match = urlStr.match(regExp);
                        if (match && match[2].length === 11) {
                          thumbnail = `https://img.youtube.com/vi/${match[2]}/mqdefault.jpg`;
                        }
                      }
                      return { url: urlStr, thumbnail };
                    })
                  : [{ url: "", thumbnail: "" }],

                touchscreenSize: record.touchscreenSize || "",
                speakers: record.speakers ? String(record.speakers) : "",
                audioSystemBrand: record.audioSystemBrand || "",
                wirelessCharger: record.wirelessCharger ?? false,
                spareWheel: record.spareWheel || "",
                wheelType: record.wheelType || "", // Populating wheelType on edit
                seatMaterial: record.seatMaterial || "", // Populating seatMaterial on edit
                wirelessAndroidAutoAppleCarPlay:
                  record.wirelessAndroidAutoAppleCarPlay ?? false,
                alexaBuiltInWithChatGPT:
                  record.alexaBuiltInWithChatGPT ?? false,
                coastToCoastTripleScreen:
                  record.coastToCoastTripleScreen ?? false,
                steeringColumn: record.steeringColumn || "",
                bootOpeningElectronic: record.bootOpeningElectronic ?? false,
                heightAdjustableDriverSeat:
                  record.heightAdjustableDriverSeat ?? false,
                ventilatedSeats: record.ventilatedSeats ?? false,
                electricAdjustableSeats:
                  record.electricAdjustableSeats ?? false,
                automaticClimateControl:
                  record.automaticClimateControl ?? false,
                frontArmRest: record.frontArmRest ?? false,
                rearSeatCentreArmRest: record.rearSeatCentreArmRest ?? false,
                rearACVents: record.rearACVents ?? false,
                cruiseControl: record.cruiseControl ?? false,
                engineStartStopButton: record.engineStartStopButton ?? false,
                powerWindows: record.powerWindows || "",
                rainSensingWiper: record.rainSensingWiper ?? false,
                rearWindowWiper: record.rearWindowWiper ?? false,
                rearWindowDefogger: record.rearWindowDefogger ?? false,
                headlamps: record.headlamps || "",
                fogLamps: record.fogLamps ?? false,
                roofRails: record.roofRails ?? false,
                automaticHeadlamps: record.automaticHeadlamps ?? false,
                sunroof: record.sunroof || "No",

                length: record.length || "",
                width: record.width || "",
                height: record.height || "",
                wheelBase: record.wheelBase || "",
                groundClearance: record.groundClearance || "",
                tyreSize: record.tyreSize || "",
                kerbWeight: record.kerbWeight || "",

                airbags: record.airbags ? String(record.airbags) : "",
                abs: record.abs ?? false,
                ebd: record.ebd ?? false,
                esc: record.esc ?? false,
                hillDescentControl: record.hillDescentControl ?? false,
                hillAssist: record.hillAssist ?? false,
                camera360: record.camera360 ?? false,
                reverseCamera: record.reverseCamera ?? false,
                frontParkingSensors: record.frontParkingSensors ?? false,
                rearParkingSensors: record.rearParkingSensors ?? false,
                advanceInternetFeatures:
                  record.advanceInternetFeatures ?? false,
                adas: record.adas ?? false,
                frontBrakeType: record.frontBrakeType || "",
                rearBrakeType: record.rearBrakeType || "",
              });
              setOpenVariantForm(true);
            }}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete this variant?"
            onConfirm={() => handleDelete("variants", record._id)}
          >
            <Button danger>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  /* ================= TAB ITEMS ================= */
  const tabItems = [
    {
      key: "1",
      label: "Brand",
      children: (
        <div className="p-6 bg-primary shadow rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-blue-500 text-lg font-bold">
              Brand Management
            </h1>
            <Button
              type="primary"
              onClick={() => {
                closeAndResetModals();
                setOpenBrandForm(true);
              }}
            >
              + Add Brand
            </Button>
          </div>
          <Table
            rowKey="_id"
            columns={brandColumns}
            dataSource={sortedBrands}
            pagination={false}
          />
        </div>
      ),
    },
    {
      key: "2",
      label: "Model",
      children: (
        <div className="p-6 bg-primary shadow rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-blue-500 text-lg font-bold">
              Model Management
            </h1>
            <Button
              type="primary"
              onClick={() => {
                closeAndResetModals();
                setOpenModelForm(true);
              }}
            >
              + Add Model
            </Button>
          </div>
          <Table
            rowKey="_id"
            columns={brandGroupColumns}
            dataSource={sortedModelsData}
            pagination={false}
            expandedRowKeys={expandedModelKeys}
            onExpand={(expanded, record) => {
              setExpandedModelKeys(
                expanded
                  ? [...expandedModelKeys, record._id]
                  : expandedModelKeys.filter((key) => key !== record._id),
              );
            }}
            onRow={(record) => ({
              onClick: () => {
                const isExpanded = expandedModelKeys.includes(record._id);
                setExpandedModelKeys(
                  isExpanded
                    ? expandedModelKeys.filter((key) => key !== record._id)
                    : [...expandedModelKeys, record._id],
                );
              },
              className: "cursor-pointer",
            })}
            expandable={{
              expandIcon: (props) => <CustomExpandIcon {...props} />,
              expandedRowRender: (brandRecord) => (
                <div
                  className="p-2 bg-gray-50/50 rounded-md transition-all duration-300"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Table
                    rowKey="_id"
                    columns={nestedModelColumns}
                    dataSource={brandRecord.models}
                    pagination={false}
                    locale={{ emptyText: "No models found for this brand" }}
                  />
                </div>
              ),
            }}
          />
        </div>
      ),
    },
    {
      key: "3",
      label: "Variant",
      children: (
        <div className="p-6 bg-primary shadow rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-blue-500 text-lg font-bold">
              Variant Management
            </h1>
            <div className="flex items-center gap-2">
              <BulkJsonUploadButton
                endpoint="/variants/bulk"
                rootKey="variants"
                directArray
                label="Bulk Upload JSON"
                onSuccess={fetchAllData}
              />
              <Button
                type="primary"
                onClick={() => {
                  closeAndResetModals();
                  setOpenVariantForm(true);
                }}
              >
                + Add Variant
              </Button>
            </div>
          </div>
          <Table
            rowKey="_id"
            columns={modelGroupColumns}
            dataSource={sortedVariantsData}
            pagination={false}
            expandedRowKeys={expandedVariantKeys}
            onExpand={(expanded, record) => {
              setExpandedVariantKeys(
                expanded
                  ? [...expandedVariantKeys, record._id]
                  : expandedVariantKeys.filter((key) => key !== record._id),
              );
            }}
            onRow={(record) => ({
              onClick: () => {
                const isExpanded = expandedVariantKeys.includes(record._id);
                setExpandedVariantKeys(
                  isExpanded
                    ? expandedVariantKeys.filter((key) => key !== record._id)
                    : [...expandedVariantKeys, record._id],
                );
              },
              className: "cursor-pointer",
            })}
            expandable={{
              expandIcon: (props) => <CustomExpandIcon {...props} />,
              expandedRowRender: (modelRecord) => (
                <div
                  className="p-2 bg-gray-50/50 rounded-md transition-all duration-300"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Table
                    rowKey="_id"
                    columns={nestedVariantColumns}
                    dataSource={modelRecord.variants}
                    pagination={false}
                    locale={{ emptyText: "No variants found for this model" }}
                  />
                </div>
              ),
            }}
          />
        </div>
      ),
    },
  ];

  const noScrollbarStyle = {
    scrollbarWidth: "none",
    msOverflowStyle: "none",
  };

  return (
    <div className="p-6 relative card-shadow shadow">
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {isLoading && <LoadingOverlay />}
      <Tabs defaultActiveKey="1" type="card" items={tabItems} />

      {/* BRAND MODAL */}
      {openBrandForm && (
        <div className="fixed z-50 inset-0 backdrop-blur-sm bg-black/40 flex justify-center items-center px-2">
          <div
            style={noScrollbarStyle}
            className="no-scrollbar bg-secondary text-primary p-6 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-lg text-blue-500 font-semibold mb-4">
              {editingBrandId ? "Edit Brand" : "Add Brand"}
            </h2>
            <div className="space-y-4">
              <label className="block text-sm font-medium">Brand Name</label>
              <Input
                className="h-[50px]"
                placeholder="Ex- Mahindra"
                value={brandForm.name}
                onChange={(e) =>
                  setBrandForm({ ...brandForm, name: e.target.value })
                }
              />
              <label className="flex flex-col items-center bg-primary justify-center w-full h-36 border-2 border-dashed rounded-lg cursor-pointer overflow-hidden mt-4">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) =>
                    setBrandForm({ ...brandForm, imageFile: e.target.files[0] })
                  }
                />
                {brandForm.imageFile || brandForm.imageUrl ? (
                  <img
                    src={
                      brandForm.imageFile
                        ? URL.createObjectURL(brandForm.imageFile)
                        : brandForm.imageUrl
                    }
                    className="w-full h-full object-contain"
                    alt="Preview"
                  />
                ) : (
                  <div className="text-center text-gray-500">
                    <span>Upload Image</span>
                  </div>
                )}
              </label>
            </div>
            <div className="flex justify-end space-x-4 mt-6">
              <Button onClick={closeAndResetModals}>Cancel</Button>
              <Button type="primary" onClick={handleSaveBrand}>
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODEL MODAL */}
      {openModelForm && (
        <div className="fixed z-50 inset-0 backdrop-blur-sm bg-black/40 flex justify-center items-center px-2">
          <div
            style={noScrollbarStyle}
            className="no-scrollbar bg-secondary text-primary p-6 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-lg text-blue-400 font-semibold mb-4">
              {editingModelId ? "Edit Model" : "Add Model"}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Brand Name
                </label>
                <Select
                  className="w-full h-[50px]"
                  placeholder="Select your brand"
                  allowClear
                  value={modelForm.brand || undefined}
                  onChange={(val) =>
                    setModelForm({ ...modelForm, brand: val || "" })
                  }
                >
                  {sortedBrands.map((b) => (
                    <Select.Option key={b._id} value={b._id}>
                      {b.name}
                    </Select.Option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Model Name
                </label>
                <Input
                  className="h-[50px]"
                  placeholder="Ex- Thar"
                  value={modelForm.name}
                  onChange={(e) =>
                    setModelForm({ ...modelForm, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Body Type
                </label>
                <Select
                  className="w-full h-[50px]"
                  placeholder="Select body type"
                  allowClear
                  value={modelForm.bodyType || undefined}
                  onChange={(val) =>
                    setModelForm({ ...modelForm, bodyType: val || "" })
                  }
                >
                  {["SUV", "Hatchback", "Sedan", "MUV", "Luxury"].map(
                    (type) => (
                      <Select.Option key={type} value={type}>
                        {type}
                      </Select.Option>
                    ),
                  )}
                </Select>
              </div>
            </div>
            <div className="flex justify-end space-x-4 mt-6">
              <Button onClick={closeAndResetModals}>Cancel</Button>
              <Button type="primary" onClick={handleSaveModel}>
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* VARIANT MODAL */}
      {openVariantForm && (
        <div className="fixed z-50 inset-0 backdrop-blur-sm bg-black/40 flex justify-center items-center px-2">
          <div
            style={noScrollbarStyle}
            className="no-scrollbar bg-secondary text-primary p-6 rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-lg text-blue-400 font-semibold mb-4">
              {editingVariantId ? "Edit Variant" : "Add Variant"}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Basic Overview */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Model Name *
                </label>
                <Select
                  className="w-full h-[50px]"
                  placeholder="Select model"
                  allowClear
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option?.children ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  value={variantForm.model || undefined}
                  onChange={(v) =>
                    setVariantForm({ ...variantForm, model: v || "" })
                  }
                >
                  {models.map((m) => (
                    <Select.Option key={m._id} value={m._id}>
                      {m.name}
                    </Select.Option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Variant Name *
                </label>
                <Input
                  className="h-[50px]"
                  placeholder="Ex- Z8L"
                  value={variantForm.name}
                  onChange={(e) =>
                    setVariantForm({ ...variantForm, name: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Fuel Type *
                </label>
                <Select
                  className="w-full h-[50px]"
                  placeholder="Select fuel type"
                  allowClear
                  value={variantForm.fuelType || undefined}
                  onChange={(v) =>
                    setVariantForm({ ...variantForm, fuelType: v || "" })
                  }
                >
                  {["Petrol", "Diesel", "Hybrid", "CNG", "Electric"].map(
                    (f) => (
                      <Select.Option key={f} value={f}>
                        {f}
                      </Select.Option>
                    ),
                  )}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Transmission *
                </label>
                <Input
                  className="h-[50px]"
                  placeholder="e.g. 6-Speed Automatic"
                  value={variantForm.transmission}
                  onChange={(e) =>
                    setVariantForm({
                      ...variantForm,
                      transmission: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Price (₹)
                </label>
                <Input
                  className="h-[50px]"
                  placeholder="e.g. 1500000"
                  value={variantForm.price}
                  onChange={(e) =>
                    setVariantForm({
                      ...variantForm,
                      price: formatNumeric(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  General / Fuel Warranty
                </label>
                <Input
                  className="h-[50px]"
                  placeholder="e.g. 3 Years / 1,00,000 km"
                  value={variantForm.warranty}
                  onChange={(e) =>
                    setVariantForm({
                      ...variantForm,
                      warranty: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Seating Capacity
                </label>
                <Input
                  className="h-[50px]"
                  placeholder="e.g. 5"
                  value={variantForm.seatingCapacity}
                  onChange={(e) =>
                    setVariantForm({
                      ...variantForm,
                      seatingCapacity: formatNumeric(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Drive Type
                </label>
                <Select
                  className="w-full h-[50px]"
                  placeholder="Select drive type"
                  allowClear
                  value={variantForm.driveType || undefined}
                  onChange={(v) =>
                    setVariantForm({ ...variantForm, driveType: v || "" })
                  }
                >
                  {["FWD", "RWD", "AWD", "4X4"].map((d) => (
                    <Select.Option key={d} value={d}>
                      {d}
                    </Select.Option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Spare Wheel
                </label>
                <Input
                  className="h-[50px]"
                  placeholder="e.g. Steel / Alloy / Space Saver"
                  value={variantForm.spareWheel}
                  onChange={(e) =>
                    setVariantForm({
                      ...variantForm,
                      spareWheel: e.target.value,
                    })
                  }
                />
              </div>

              {/* Added wheelType Input Field */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Wheel Type
                </label>
                <Input
                  className="h-[50px]"
                  placeholder="e.g. Alloy, Steel, or Custom"
                  value={variantForm.wheelType}
                  onChange={(e) =>
                    setVariantForm({
                      ...variantForm,
                      wheelType: e.target.value,
                    })
                  }
                />
              </div>

              {/* Added seatMaterial Input Field */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">
                  Seat Material
                </label>
                <Input
                  className="h-[50px]"
                  placeholder="e.g. Leather, Fabric, or Custom"
                  value={variantForm.seatMaterial}
                  onChange={(e) =>
                    setVariantForm({
                      ...variantForm,
                      seatMaterial: e.target.value,
                    })
                  }
                />
              </div>

              {/* Multiple Color Name & Hex Code Picker */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">
                  Variant Colors (Name & Hex Code)
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-3 mb-2">
                  <Input
                    className="h-[50px] flex-1"
                    placeholder="Color Name (e.g. Fiery Red)"
                    value={selectedColorName}
                    onChange={(e) => setSelectedColorName(e.target.value)}
                  />
                  <div className="flex items-center gap-2 h-[50px] border border-[#d9d9d9] px-3 rounded-lg bg-white">
                    <ColorPicker
                      format="hex"
                      value={selectedColorPicker}
                      onChange={(colorObj) => {
                        const hex =
                          typeof colorObj === "string"
                            ? colorObj
                            : colorObj.toHexString();
                        setSelectedColorPicker(hex);
                      }}
                      showText
                    />
                  </div>
                  <Button
                    type="dashed"
                    onClick={handleAddColor}
                    className="h-[50px] w-full sm:w-auto"
                  >
                    + Add Color
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2 mt-2">
                  {variantForm.colors.map((colorObj) => (
                    <Tag
                      key={colorObj.hex}
                      closable
                      onClose={() => handleRemoveColor(colorObj.hex)}
                      className="flex items-center gap-2 px-3 py-1 text-sm border bg-white rounded-md shadow-sm"
                    >
                      <span
                        className="w-4 h-4 rounded-full border border-gray-300 inline-block"
                        style={{ backgroundColor: colorObj.hex }}
                      />
                      <span className="font-semibold">{colorObj.name}</span>
                      <span className="font-mono text-gray-500">
                        ({colorObj.hex})
                      </span>
                    </Tag>
                  ))}
                </div>
              </div>

              {/* Videos */}
              <div className="md:col-span-2 border-t pt-4 mt-2">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium">
                    Multiple YouTube Video Links
                  </label>
                  <Button
                    type="dashed"
                    size="small"
                    onClick={handleAddVideoLink}
                  >
                    + Add Video Link
                  </Button>
                </div>
                {variantForm.videos.map((vid, idx) => (
                  <div key={idx} className="flex gap-2 items-center mb-2">
                    <div className="flex-1">
                      <Input
                        placeholder="Paste YouTube Link here..."
                        value={vid.url}
                        style={{ height: "50px" }}
                        onChange={(e) =>
                          handleVideoUrlChange(idx, e.target.value)
                        }
                      />
                    </div>
                    {vid.thumbnail && (
                      <img
                        src={vid.thumbnail}
                        alt="preview"
                        className="w-16 h-10 object-cover rounded border"
                      />
                    )}
                    {variantForm.videos.length > 1 && (
                      <Button danger onClick={() => handleRemoveVideoLink(idx)}>
                        X
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {/* ICE / CNG Engine Specs */}
              {variantForm.fuelType && variantForm.fuelType !== "Electric" && (
                <div className="md:col-span-2 border-t pt-4 mt-2">
                  <h3 className="text-sm font-bold text-blue-500 mb-3">
                    Engine & Fuel Specifications
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-sm font-medium">
                        Engine Displacement (cc)
                      </label>
                      <Input
                        className="h-[50px]"
                        placeholder="e.g. 1498"
                        value={variantForm.engineDisplacement}
                        onChange={(e) =>
                          setVariantForm({
                            ...variantForm,
                            engineDisplacement: formatNumeric(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Engine Type</label>
                      <Input
                        className="h-[50px]"
                        placeholder="e.g. 1.5L Turbo Petrol"
                        value={variantForm.engineType}
                        onChange={(e) =>
                          setVariantForm({
                            ...variantForm,
                            engineType: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        Engine Emission Norms
                      </label>
                      <Input
                        className="h-[50px]"
                        placeholder="e.g. BS6 Phase 2"
                        value={variantForm.engineEmissionNorms}
                        onChange={(e) =>
                          setVariantForm({
                            ...variantForm,
                            engineEmissionNorms: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">GearBox</label>
                      <Input
                        className="h-[50px]"
                        placeholder="e.g. 6-Speed"
                        value={variantForm.gearBox}
                        onChange={(e) =>
                          setVariantForm({
                            ...variantForm,
                            gearBox: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Mileage</label>
                      <Input
                        className="h-[50px]"
                        placeholder="e.g. 17.5 kmpl"
                        value={variantForm.mileage}
                        onChange={(e) =>
                          setVariantForm({
                            ...variantForm,
                            mileage: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Cylinders</label>
                      <Input
                        className="h-[50px]"
                        placeholder="e.g. 4"
                        value={variantForm.cylinders}
                        onChange={(e) =>
                          setVariantForm({
                            ...variantForm,
                            cylinders: formatNumeric(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        Fuel Tank Capacity
                      </label>
                      <Input
                        className="h-[50px]"
                        placeholder="e.g. 45 L"
                        value={variantForm.fuelTankCapacity}
                        onChange={(e) =>
                          setVariantForm({
                            ...variantForm,
                            fuelTankCapacity: e.target.value,
                          })
                        }
                      />
                    </div>
                    {variantForm.fuelType === "CNG" && (
                      <div>
                        <label className="text-sm font-medium">
                          CNG Cylinder Capacity
                        </label>
                        <Input
                          className="h-[50px]"
                          placeholder="e.g. 60 L"
                          value={variantForm.cngCylinderCapacity}
                          onChange={(e) =>
                            setVariantForm({
                              ...variantForm,
                              cngCylinderCapacity: e.target.value,
                            })
                          }
                        />
                      </div>
                    )}
                  </div>
                  <div className="mt-3">
                    <Checkbox
                      checked={variantForm.turboCharger}
                      onChange={(e) =>
                        setVariantForm({
                          ...variantForm,
                          turboCharger: e.target.checked,
                        })
                      }
                    >
                      Turbo Charger
                    </Checkbox>
                  </div>
                </div>
              )}

              {/* Electric Specs */}
              {variantForm.fuelType === "Electric" && (
                <div className="md:col-span-2 border-t pt-4 mt-2">
                  <h3 className="text-sm font-bold text-blue-500 mb-3">
                    EV Battery & Motor Specifications
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-sm font-medium">
                        Battery Capacity
                      </label>
                      <Input
                        className="h-[50px]"
                        placeholder="e.g. 40.5 kWh"
                        value={variantForm.batteryCapacity}
                        onChange={(e) =>
                          setVariantForm({
                            ...variantForm,
                            batteryCapacity: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        Battery Type
                      </label>
                      <Input
                        className="h-[50px]"
                        placeholder="e.g. Lithium-Ion"
                        value={variantForm.batteryType}
                        onChange={(e) =>
                          setVariantForm({
                            ...variantForm,
                            batteryType: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        Battery Cell Type
                      </label>
                      <Input
                        className="h-[50px]"
                        placeholder="e.g. LFP"
                        value={variantForm.batteryCellType}
                        onChange={(e) =>
                          setVariantForm({
                            ...variantForm,
                            batteryCellType: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        HV Battery Warranty
                      </label>
                      <Input
                        className="h-[50px]"
                        placeholder="e.g. 8 Years / 1,60,000 km"
                        value={variantForm.hvBatteryWarranty}
                        onChange={(e) =>
                          setVariantForm({
                            ...variantForm,
                            hvBatteryWarranty: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        Claimed Range
                      </label>
                      <Input
                        className="h-[50px]"
                        placeholder="e.g. 437 km"
                        value={variantForm.claimedRange}
                        onChange={(e) =>
                          setVariantForm({
                            ...variantForm,
                            claimedRange: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        Real Life Range
                      </label>
                      <Input
                        className="h-[50px]"
                        placeholder="e.g. 320 km"
                        value={variantForm.realLifeRange}
                        onChange={(e) =>
                          setVariantForm({
                            ...variantForm,
                            realLifeRange: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Motor Power</label>
                      <Input
                        className="h-[50px]"
                        placeholder="e.g. 140 bhp"
                        value={variantForm.motorPower}
                        onChange={(e) =>
                          setVariantForm({
                            ...variantForm,
                            motorPower: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Motor Type</label>
                      <Input
                        className="h-[50px]"
                        placeholder="e.g. PMSM"
                        value={variantForm.motorType}
                        onChange={(e) =>
                          setVariantForm({
                            ...variantForm,
                            motorType: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        Charging Port Type
                      </label>
                      <Input
                        className="h-[50px]"
                        placeholder="e.g. CCS2"
                        value={variantForm.chargingPortType}
                        onChange={(e) =>
                          setVariantForm({
                            ...variantForm,
                            chargingPortType: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        Max Fast Charging Support
                      </label>
                      <Input
                        className="h-[50px]"
                        placeholder="e.g. 50 kW"
                        value={variantForm.maxFastChargingSupport}
                        onChange={(e) =>
                          setVariantForm({
                            ...variantForm,
                            maxFastChargingSupport: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        Frunk Capacity
                      </label>
                      <Input
                        className="h-[50px]"
                        placeholder="e.g. 35 L"
                        value={variantForm.frunk}
                        onChange={(e) =>
                          setVariantForm({
                            ...variantForm,
                            frunk: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <Checkbox
                      checked={variantForm.v2l}
                      onChange={(e) =>
                        setVariantForm({
                          ...variantForm,
                          v2l: e.target.checked,
                        })
                      }
                    >
                      V2L (Vehicle-to-Load)
                    </Checkbox>
                    <Checkbox
                      checked={variantForm.v2v}
                      onChange={(e) =>
                        setVariantForm({
                          ...variantForm,
                          v2v: e.target.checked,
                        })
                      }
                    >
                      V2V (Vehicle-to-Vehicle)
                    </Checkbox>
                  </div>

                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Charging Timings & Options
                      </label>
                      <Button
                        size="small"
                        type="dashed"
                        onClick={handleAddChargingOption}
                      >
                        + Add Option
                      </Button>
                    </div>
                    {variantForm.chargingOptions.map((opt, idx) => (
                      <div key={idx} className="flex gap-2 mb-2 items-center">
                        <Input
                          placeholder="Charger Type (e.g 3.3 KW AC)"
                          value={opt.charger}
                          onChange={(e) =>
                            handleChargingOptionChange(
                              idx,
                              "charger",
                              e.target.value,
                            )
                          }
                        />
                        <Input
                          placeholder="Percentage (e.g 0-100%)"
                          value={opt.percentage}
                          onChange={(e) =>
                            handleChargingOptionChange(
                              idx,
                              "percentage",
                              e.target.value,
                            )
                          }
                        />
                        <Input
                          placeholder="Time (e.g 14 Hours)"
                          value={opt.time}
                          onChange={(e) =>
                            handleChargingOptionChange(
                              idx,
                              "time",
                              e.target.value,
                            )
                          }
                        />
                        {variantForm.chargingOptions.length > 1 && (
                          <Button
                            danger
                            type="text"
                            onClick={() => handleRemoveChargingOption(idx)}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Power & Performance */}
              <div className="md:col-span-2 border-t pt-4 mt-2">
                <h3 className="text-sm font-bold text-blue-500 mb-3">
                  Power & Performance Outputs
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Max Power</label>
                    <Input
                      className="h-[50px]"
                      placeholder="e.g. 118 bhp @ 6000 rpm"
                      value={variantForm.maxPower}
                      onChange={(e) =>
                        setVariantForm({
                          ...variantForm,
                          maxPower: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Max Torque</label>
                    <Input
                      className="h-[50px]"
                      placeholder="e.g. 250 Nm @ 1750 rpm"
                      value={variantForm.maxTorque}
                      onChange={(e) =>
                        setVariantForm({
                          ...variantForm,
                          maxTorque: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Infotainment & Technology */}
              <div className="md:col-span-2 border-t pt-4 mt-2">
                <h3 className="text-sm font-bold text-blue-500 mb-3">
                  Infotainment & Technology
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-sm font-medium">
                      Touchscreen Size
                    </label>
                    <Input
                      className="h-[50px]"
                      placeholder="e.g. 10.25 inch"
                      value={variantForm.touchscreenSize}
                      onChange={(e) =>
                        setVariantForm({
                          ...variantForm,
                          touchscreenSize: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">
                      No. of Speakers
                    </label>
                    <Input
                      className="h-[50px]"
                      placeholder="e.g. 6"
                      value={variantForm.speakers}
                      onChange={(e) =>
                        setVariantForm({
                          ...variantForm,
                          speakers: formatNumeric(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">
                      Audio System Brand
                    </label>
                    <Input
                      className="h-[50px]"
                      placeholder="e.g. JBL / Bose / Sony"
                      value={variantForm.audioSystemBrand}
                      onChange={(e) =>
                        setVariantForm({
                          ...variantForm,
                          audioSystemBrand: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">
                      USB Ports (Count)
                    </label>
                    <Input
                      className="h-[50px]"
                      placeholder="e.g. 2"
                      value={variantForm.usbPort}
                      onChange={(e) =>
                        setVariantForm({
                          ...variantForm,
                          usbPort: formatNumeric(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">
                      Type-C Ports (Count)
                    </label>
                    <Input
                      className="h-[50px]"
                      placeholder="e.g. 2"
                      value={variantForm.cPort}
                      onChange={(e) =>
                        setVariantForm({
                          ...variantForm,
                          cPort: formatNumeric(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                  <Checkbox
                    checked={variantForm.tweeter}
                    onChange={(e) =>
                      setVariantForm({
                        ...variantForm,
                        tweeter: e.target.checked,
                      })
                    }
                  >
                    Tweeters
                  </Checkbox>
                  <Checkbox
                    checked={variantForm.wirelessAndroidAutoAppleCarPlay}
                    onChange={(e) =>
                      setVariantForm({
                        ...variantForm,
                        wirelessAndroidAutoAppleCarPlay: e.target.checked,
                      })
                    }
                  >
                    Wireless Android Auto / Apple CarPlay
                  </Checkbox>
                  <Checkbox
                    checked={variantForm.wirelessCharger}
                    onChange={(e) =>
                      setVariantForm({
                        ...variantForm,
                        wirelessCharger: e.target.checked,
                      })
                    }
                  >
                    Wireless Charger
                  </Checkbox>
                  <Checkbox
                    checked={variantForm.alexaBuiltInWithChatGPT}
                    onChange={(e) =>
                      setVariantForm({
                        ...variantForm,
                        alexaBuiltInWithChatGPT: e.target.checked,
                      })
                    }
                  >
                    Alexa Built-In / ChatGPT
                  </Checkbox>
                  <Checkbox
                    checked={variantForm.coastToCoastTripleScreen}
                    onChange={(e) =>
                      setVariantForm({
                        ...variantForm,
                        coastToCoastTripleScreen: e.target.checked,
                      })
                    }
                  >
                    Triple Screen Setup
                  </Checkbox>
                  <Checkbox
                    checked={variantForm.advanceInternetFeatures}
                    onChange={(e) =>
                      setVariantForm({
                        ...variantForm,
                        advanceInternetFeatures: e.target.checked,
                      })
                    }
                  >
                    Advance Internet Features
                  </Checkbox>

                  <Checkbox
                    checked={variantForm.bluetoothConnectivity}
                    onChange={(e) =>
                      setVariantForm({
                        ...variantForm,
                        bluetoothConnectivity: e.target.checked,
                      })
                    }
                  >
                    Bluetooth Connectivity
                  </Checkbox>
                </div>
              </div>

              {/* Comfort & Convenience */}
              <div className="md:col-span-2 border-t pt-4 mt-2">
                <h3 className="text-sm font-bold text-blue-500 mb-3">
                  Comfort & Convenience
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Steering Column
                    </label>
                    <Select
                      className="w-full h-[50px]"
                      placeholder="Select Steering Column"
                      allowClear
                      value={variantForm.steeringColumn || undefined}
                      onChange={(val) =>
                        setVariantForm({
                          ...variantForm,
                          steeringColumn: val || "",
                        })
                      }
                    >
                      {["Tilt", "Telescopic", "Tilt & Telescopic", "Fixed"].map(
                        (item) => (
                          <Select.Option key={item} value={item}>
                            {item}
                          </Select.Option>
                        ),
                      )}
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Power Windows
                    </label>
                    <Select
                      className="w-full h-[50px]"
                      placeholder="Select Power Windows"
                      allowClear
                      value={variantForm.powerWindows || undefined}
                      onChange={(val) =>
                        setVariantForm({
                          ...variantForm,
                          powerWindows: val || "",
                        })
                      }
                    >
                      {["Front Only", "Rear Only", "Front & Rear", "None"].map(
                        (item) => (
                          <Select.Option key={item} value={item}>
                            {item}
                          </Select.Option>
                        ),
                      )}
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Sunroof Type
                    </label>
                    <Select
                      className="w-full h-[50px]"
                      placeholder="Select Sunroof"
                      allowClear
                      value={variantForm.sunroof || undefined}
                      onChange={(val) =>
                        setVariantForm({ ...variantForm, sunroof: val || "No" })
                      }
                    >
                      {["Panoramic", "Single Pane", "Fixed", "No"].map(
                        (item) => (
                          <Select.Option key={item} value={item}>
                            {item}
                          </Select.Option>
                        ),
                      )}
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                  <Checkbox
                    checked={variantForm.bootOpeningElectronic}
                    onChange={(e) =>
                      setVariantForm({
                        ...variantForm,
                        bootOpeningElectronic: e.target.checked,
                      })
                    }
                  >
                    Electronic Boot Opening
                  </Checkbox>
                  <Checkbox
                    checked={variantForm.heightAdjustableDriverSeat}
                    onChange={(e) =>
                      setVariantForm({
                        ...variantForm,
                        heightAdjustableDriverSeat: e.target.checked,
                      })
                    }
                  >
                    Height Adj. Driver Seat
                  </Checkbox>
                  <Checkbox
                    checked={variantForm.ventilatedSeats}
                    onChange={(e) =>
                      setVariantForm({
                        ...variantForm,
                        ventilatedSeats: e.target.checked,
                      })
                    }
                  >
                    Ventilated Seats
                  </Checkbox>
                  <Checkbox
                    checked={variantForm.electricAdjustableSeats}
                    onChange={(e) =>
                      setVariantForm({
                        ...variantForm,
                        electricAdjustableSeats: e.target.checked,
                      })
                    }
                  >
                    Electric Adjustable Seats
                  </Checkbox>
                  <Checkbox
                    checked={variantForm.automaticClimateControl}
                    onChange={(e) =>
                      setVariantForm({
                        ...variantForm,
                        automaticClimateControl: e.target.checked,
                      })
                    }
                  >
                    Auto Climate Control
                  </Checkbox>
                  <Checkbox
                    checked={variantForm.frontArmRest}
                    onChange={(e) =>
                      setVariantForm({
                        ...variantForm,
                        frontArmRest: e.target.checked,
                      })
                    }
                  >
                    Front Armrest
                  </Checkbox>
                  <Checkbox
                    checked={variantForm.rearSeatCentreArmRest}
                    onChange={(e) =>
                      setVariantForm({
                        ...variantForm,
                        rearSeatCentreArmRest: e.target.checked,
                      })
                    }
                  >
                    Rear Seat Armrest
                  </Checkbox>
                  <Checkbox
                    checked={variantForm.rearACVents}
                    onChange={(e) =>
                      setVariantForm({
                        ...variantForm,
                        rearACVents: e.target.checked,
                      })
                    }
                  >
                    Rear AC Vents
                  </Checkbox>
                  <Checkbox
                    checked={variantForm.cruiseControl}
                    onChange={(e) =>
                      setVariantForm({
                        ...variantForm,
                        cruiseControl: e.target.checked,
                      })
                    }
                  >
                    Cruise Control
                  </Checkbox>
                  <Checkbox
                    checked={variantForm.engineStartStopButton}
                    onChange={(e) =>
                      setVariantForm({
                        ...variantForm,
                        engineStartStopButton: e.target.checked,
                      })
                    }
                  >
                    Push Engine Start/Stop
                  </Checkbox>
                </div>
              </div>

              {/* Exterior & Lighting */}
              <div className="md:col-span-2 border-t pt-4 mt-2">
                <h3 className="text-sm font-bold text-blue-500 mb-3">
                  Lighting & Exterior
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Headlamps
                    </label>
                    <Select
                      className="w-full h-[50px]"
                      placeholder="Select Headlamps"
                      allowClear
                      value={variantForm.headlamps || undefined}
                      onChange={(val) =>
                        setVariantForm({ ...variantForm, headlamps: val || "" })
                      }
                    >
                      {["LED", "Projector", "Halogen","LED Projector","Halogen Projector"].map((item) => (
                        <Select.Option key={item} value={item}>
                          {item}
                        </Select.Option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                  <Checkbox
                    checked={variantForm.rainSensingWiper}
                    onChange={(e) =>
                      setVariantForm({
                        ...variantForm,
                        rainSensingWiper: e.target.checked,
                      })
                    }
                  >
                    Rain Sensing Wiper
                  </Checkbox>
                  <Checkbox
                    checked={variantForm.rearWindowWiper}
                    onChange={(e) =>
                      setVariantForm({
                        ...variantForm,
                        rearWindowWiper: e.target.checked,
                      })
                    }
                  >
                    Rear Wiper
                  </Checkbox>
                  <Checkbox
                    checked={variantForm.rearWindowDefogger}
                    onChange={(e) =>
                      setVariantForm({
                        ...variantForm,
                        rearWindowDefogger: e.target.checked,
                      })
                    }
                  >
                    Rear Defogger
                  </Checkbox>
                  <Checkbox
                    checked={variantForm.fogLamps}
                    onChange={(e) =>
                      setVariantForm({
                        ...variantForm,
                        fogLamps: e.target.checked,
                      })
                    }
                  >
                    Fog Lamps
                  </Checkbox>
                  <Checkbox
                    checked={variantForm.roofRails}
                    onChange={(e) =>
                      setVariantForm({
                        ...variantForm,
                        roofRails: e.target.checked,
                      })
                    }
                  >
                    Roof Rails
                  </Checkbox>
                  <Checkbox
                    checked={variantForm.automaticHeadlamps}
                    onChange={(e) =>
                      setVariantForm({
                        ...variantForm,
                        automaticHeadlamps: e.target.checked,
                      })
                    }
                  >
                    Automatic Headlamps
                  </Checkbox>
                </div>
              </div>

              {/* Dimensions */}
              <div className="md:col-span-2 border-t pt-4 mt-2">
                <h3 className="text-sm font-bold text-blue-500 mb-3">
                  Dimensions & Capacities
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-sm font-medium">Length</label>
                    <Input
                      className="h-[50px]"
                      placeholder="e.g. 3995 mm"
                      value={variantForm.length}
                      onChange={(e) =>
                        setVariantForm({
                          ...variantForm,
                          length: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Width</label>
                    <Input
                      className="h-[50px]"
                      placeholder="e.g. 1765 mm"
                      value={variantForm.width}
                      onChange={(e) =>
                        setVariantForm({
                          ...variantForm,
                          width: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Height</label>
                    <Input
                      className="h-[50px]"
                      placeholder="e.g. 1555 mm"
                      value={variantForm.height}
                      onChange={(e) =>
                        setVariantForm({
                          ...variantForm,
                          height: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Wheelbase</label>
                    <Input
                      className="h-[50px]"
                      placeholder="e.g. 2500 mm"
                      value={variantForm.wheelBase}
                      onChange={(e) =>
                        setVariantForm({
                          ...variantForm,
                          wheelBase: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">
                      Ground Clearance
                    </label>
                    <Input
                      className="h-[50px]"
                      placeholder="e.g. 209 mm"
                      value={variantForm.groundClearance}
                      onChange={(e) =>
                        setVariantForm({
                          ...variantForm,
                          groundClearance: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Tyre Size</label>
                    <Input
                      className="h-[50px]"
                      placeholder="e.g. 215/60 R16"
                      value={variantForm.tyreSize}
                      onChange={(e) =>
                        setVariantForm({
                          ...variantForm,
                          tyreSize: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Kerb Weight</label>
                    <Input
                      className="h-[50px]"
                      placeholder="e.g. 1180 kg"
                      value={variantForm.kerbWeight}
                      onChange={(e) =>
                        setVariantForm({
                          ...variantForm,
                          kerbWeight: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Boot Space</label>
                    <Input
                      className="h-[50px]"
                      placeholder="e.g. 350 L"
                      value={variantForm.bootSpace}
                      onChange={(e) =>
                        setVariantForm({
                          ...variantForm,
                          bootSpace: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Safety & Brakes */}
              <div className="md:col-span-2 border-t pt-4 mt-2">
                <h3 className="text-sm font-bold text-blue-500 mb-3">
                  Safety & Braking Controls
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="text-sm font-medium block mb-1">
                      Airbags Count
                    </label>
                    <Input
                      className="h-[50px]"
                      placeholder="e.g. 6"
                      value={variantForm.airbags}
                      onChange={(e) =>
                        setVariantForm({
                          ...variantForm,
                          airbags: formatNumeric(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">
                      Front Brake Type
                    </label>
                    <Select
                      className="w-full h-[50px]"
                      placeholder="Select Front Brake Type"
                      allowClear
                      value={variantForm.frontBrakeType || undefined}
                      onChange={(val) =>
                        setVariantForm({
                          ...variantForm,
                          frontBrakeType: val || "",
                        })
                      }
                    >
                      {["Ventilated Disc", "Disc", "Drum"].map((item) => (
                        <Select.Option key={item} value={item}>
                          {item}
                        </Select.Option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">
                      Rear Brake Type
                    </label>
                    <Select
                      className="w-full h-[50px]"
                      placeholder="Select Rear Brake Type"
                      allowClear
                      value={variantForm.rearBrakeType || undefined}
                      onChange={(val) =>
                        setVariantForm({
                          ...variantForm,
                          rearBrakeType: val || "",
                        })
                      }
                    >
                      {["Solid Disc", "Disc", "Drum"].map((item) => (
                        <Select.Option key={item} value={item}>
                          {item}
                        </Select.Option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                  <Checkbox
                    checked={variantForm.tpms}
                    onChange={(e) =>
                      setVariantForm({
                        ...variantForm,
                        tpms: e.target.checked,
                      })
                    }
                  >
                    TPMS
                  </Checkbox>
                  <Checkbox
                    checked={variantForm.abs}
                    onChange={(e) =>
                      setVariantForm({ ...variantForm, abs: e.target.checked })
                    }
                  >
                    ABS
                  </Checkbox>
                  <Checkbox
                    checked={variantForm.ebd}
                    onChange={(e) =>
                      setVariantForm({ ...variantForm, ebd: e.target.checked })
                    }
                  >
                    EBD
                  </Checkbox>
                  <Checkbox
                    checked={variantForm.esc}
                    onChange={(e) =>
                      setVariantForm({ ...variantForm, esc: e.target.checked })
                    }
                  >
                    ESC
                  </Checkbox>
                  <Checkbox
                    checked={variantForm.hillAssist}
                    onChange={(e) =>
                      setVariantForm({
                        ...variantForm,
                        hillAssist: e.target.checked,
                      })
                    }
                  >
                    Hill Assist
                  </Checkbox>
                  <Checkbox
                    checked={variantForm.hillDescentControl}
                    onChange={(e) =>
                      setVariantForm({
                        ...variantForm,
                        hillDescentControl: e.target.checked,
                      })
                    }
                  >
                    Hill Descent Control
                  </Checkbox>
                  <Checkbox
                    checked={variantForm.reverseCamera}
                    onChange={(e) =>
                      setVariantForm({
                        ...variantForm,
                        reverseCamera: e.target.checked,
                      })
                    }
                  >
                    Reverse Camera
                  </Checkbox>
                  <Checkbox
                    checked={variantForm.camera360}
                    onChange={(e) =>
                      setVariantForm({
                        ...variantForm,
                        camera360: e.target.checked,
                      })
                    }
                  >
                    360° Camera
                  </Checkbox>
                  <Checkbox
                    checked={variantForm.frontParkingSensors}
                    onChange={(e) =>
                      setVariantForm({
                        ...variantForm,
                        frontParkingSensors: e.target.checked,
                      })
                    }
                  >
                    Front Parking Sensors
                  </Checkbox>
                  <Checkbox
                    checked={variantForm.rearParkingSensors}
                    onChange={(e) =>
                      setVariantForm({
                        ...variantForm,
                        rearParkingSensors: e.target.checked,
                      })
                    }
                  >
                    Rear Parking Sensors
                  </Checkbox>
                  <Checkbox
                    checked={variantForm.adas}
                    onChange={(e) =>
                      setVariantForm({
                        ...variantForm,
                        adas: e.target.checked,
                      })
                    }
                  >
                    ADAS Features
                  </Checkbox>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-6 border-t pt-4">
              <Button onClick={closeAndResetModals}>Cancel</Button>
              <Button type="primary" onClick={handleSaveVariant}>
                Save Variant
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}