import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { message } from "antd";
import { Eye, EyeOff } from "lucide-react";
import api from "../utils/axiosInstance";
import LoadingOverlay from "../components/LoadingOverlay";
import useAuth from "../context/useAuth";
import logo from "../assets/carspar-logo.png";

export default function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [messageApi, contextHolder] = message.useMessage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const validate = () => {
    const nextErrors = {};
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) nextErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      nextErrors.email = "Enter a valid email";
    }
    if (!password) nextErrors.password = "Password is required";
    else if (password.length < 8) nextErrors.password = "Password must be at least 8 characters";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) {
      messageApi.warning("Please fix the validation errors");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/auth/login", {
        email: email.trim().toLowerCase(),
        password,
      });
      login(response.data?.data?.accessToken, response.data?.data?.admin);
      messageApi.success("Login successful");
      navigate(location.state?.from || "/dashboard", { replace: true });
    } catch (error) {
      messageApi.error(error.response?.data?.message || error.message || "Unable to log in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center bg-gray-300 p-4">
      {contextHolder}
      {loading && <LoadingOverlay />}

      <section className="flex w-full max-w-[400px] flex-col overflow-hidden rounded-xl bg-amber-50 shadow-2xl md:h-[550px] md:w-[85%] md:max-w-none md:flex-row lg:w-[70%] xl:w-[50%]">
        <div className="flex h-[180px] w-full items-center justify-center bg-amber-300 p-8 sm:h-[220px] md:h-full md:w-1/2">
          <img className="h-auto w-full max-w-sm object-contain" src={logo} alt="Carspar" />
        </div>

        <div className="flex w-full bg-white flex-col items-center justify-center px-6 py-7 md:w-1/2 md:px-10">
          <span className="text-center text-2xl font-bold tracking-tight text-slate-900">
            Welcome to Carspar
          </span>
          <p className="mb-6 text-center text-xs text-gray-500">
            Log in to manage your account
          </p>

          <form onSubmit={handleSubmit} className="flex w-full mt-6 flex-col gap-4" noValidate>
            <div className="flex flex-col">
              <input
                type="email"
                autoComplete="username"
                placeholder="Email Address"
                value={email}
                disabled={loading}
                onChange={(event) => setEmail(event.target.value)}
                className={`w-full h-13 rounded-lg border bg-white px-4 py-2.5 text-slate-900 outline-none transition-all ${errors.email ? "border-red-500" : "border-gray-300 focus:border-blue-500"}`}
              />
              {errors.email && <span className="ml-1 mt-1 text-[10px] text-red-500">{errors.email}</span>}
            </div>

            <div className="flex flex-col">
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Password"
                  value={password}
                  disabled={loading}
                  onChange={(event) => setPassword(event.target.value)}
                  className={`w-full h-13 rounded-lg border bg-white px-4 py-2.5 pr-10 text-slate-900 outline-none transition-all ${errors.password ? "border-red-500" : "border-gray-300 focus:border-blue-500"}`}
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <span className="ml-1 mt-1 text-[10px] text-red-500">{errors.password}</span>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-5 flex h-11 w-full items-center leading-none text-white! justify-center rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "LOGGING IN…" : "LOGIN"}
            </button>
          </form>

          <p className="pt-3 text-center text-[10px] text-gray-400">© 2026 Carspar. All rights reserved.</p>
        </div>
      </section>
    </main>
  );
}
