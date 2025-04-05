
import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { authService, LoginRequest, LoginResponse } from "@/services/authService";
import { toast } from "sonner";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  fullName?: string;
  phoneNo?: string;
  departmentName?: string;
  roleName?: string;
  companyName?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Async thunks
export const login = createAsyncThunk("auth/login", async (credentials: LoginRequest, { rejectWithValue }) => {
  try {
    const response = await authService.login(credentials);
    return response;
  } catch (error) {
    if (error instanceof Error) {
      return rejectWithValue(error.message);
    }
    return rejectWithValue("An unknown error occurred");
  }
});

export const refreshToken = createAsyncThunk("auth/refreshToken", async (_, { getState, rejectWithValue }) => {
  const state = getState() as { auth: AuthState };
  const refreshToken = state.auth.refreshToken || localStorage.getItem("refreshToken");

  if (!refreshToken) {
    return rejectWithValue("No refresh token found");
  }

  try {
    const response = await authService.refreshToken({ refreshToken });
    return response;
  } catch (error) {
    if (error instanceof Error) {
      return rejectWithValue(error.message);
    }
    return rejectWithValue("An unknown error occurred");
  }
});

export const logout = createAsyncThunk("auth/logout", async (_, { dispatch }) => {
  authService.logout();
  return true;
});

export const checkAuthStatus = createAsyncThunk("auth/checkStatus", async (_, { dispatch, getState }) => {
  // Check for token in storage
  const token = sessionStorage.getItem("token") || localStorage.getItem("token");
  const refreshTokenStr = localStorage.getItem("refreshToken");

  if (!token) {
    return false;
  }

  // Check if the main token is expired
  if (authService.isTokenExpired()) {
    // Token is expired, check if we can refresh it
    if (refreshTokenStr && !authService.isRefreshTokenExpired()) {
      try {
        // Try to refresh the token
        await dispatch(refreshToken()).unwrap();
        return true;
      } catch (error) {
        // If refresh token fails, clear everything
        authService.logout();
        return false;
      }
    } else {
      // No valid refresh token, logout
      authService.logout();
      return false;
    }
  }

  return true;
});

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    token: localStorage.getItem("token") || null,
    refreshToken: localStorage.getItem("refreshToken") || null,
    isAuthenticated: !authService.isTokenExpired(),
    isLoading: false,
    error: null,
  },
  reducers: {
    // Legacy actions to maintain backwards compatibility
    loginStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    loginSuccess: (state, action: PayloadAction<{ user: User; token: string; refreshToken: string }>) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      state.error = null;
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    logoutAction: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;

        if (action.payload.success && action.payload.token && action.payload.user) {
          state.isAuthenticated = true;
          state.token = action.payload.token;
          state.refreshToken = action.payload.refreshToken || null;

          // Map API user structure to our state structure
          state.user = {
            id: action.payload.user.userID.toString(),
            name: action.payload.user.userName,
            email: action.payload.user.emailID,
            role: action.payload.user.roleName || "user",
            fullName: action.payload.user.userFullName,
            phoneNo: action.payload.user.phoneNo,
            departmentName: action.payload.user.departmentName,
            roleName: action.payload.user.roleName,
            companyName: action.payload.user.companyName,
          };
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || "Login failed";
      })

      // Refresh token
      .addCase(refreshToken.fulfilled, (state, action) => {
        if (action.payload.success && action.payload.token && action.payload.user) {
          state.isAuthenticated = true;
          state.token = action.payload.token;
          state.refreshToken = action.payload.refreshToken || null;

          // Map API user structure to our state structure
          state.user = {
            id: action.payload.user.userID.toString(),
            name: action.payload.user.userName,
            email: action.payload.user.emailID,
            role: action.payload.user.roleName || "user",
            fullName: action.payload.user.userFullName,
            phoneNo: action.payload.user.phoneNo,
            departmentName: action.payload.user.departmentName,
            roleName: action.payload.user.roleName,
            companyName: action.payload.user.companyName,
          };
        }
      })
      .addCase(refreshToken.rejected, (state) => {
        state.isAuthenticated = false;
        state.token = null;
        state.refreshToken = null;
        state.user = null;
      })

      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.error = null;
      })

      // Check auth status
      .addCase(checkAuthStatus.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        if (!action.payload) {
          state.isAuthenticated = false;
          state.user = null;
          state.token = null;
          state.refreshToken = null;
        }
      })
      .addCase(checkAuthStatus.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.refreshToken = null;
      });
  },
});

export const { loginStart, loginSuccess, loginFailure, logoutAction } = authSlice.actions;

export default authSlice.reducer;
