import { authService as apiAuthService, LoginRequest } from "@/services/authService";
import { toast } from "sonner";
import { login as loginAction, logout as logoutAction, checkAuthStatus as checkAuthStatusAction } from "./authSlice";
import { AppDispatch } from "@/lib/store";

// Wrapper functions for the API service
export const login = (credentials: LoginRequest) => async (dispatch: AppDispatch) => {
  try {
    // Set mode 7 for authentication as shown in the example
    const mode7Credentials = {
      ...credentials,
      mode: 7,
      action: "akshay",
      parameters: {},
    };

    await dispatch(loginAction(mode7Credentials)).unwrap();
    toast.success("Logged in successfully");
    return true;
  } catch (error) {
    // The error is already handled in the thunk
    return false;
  }
};

export const logoutUser = () => (dispatch: AppDispatch) => {
  dispatch(logoutAction());
  toast.info("Logged out successfully");
};

export const checkAuth = () => (dispatch: AppDispatch) => {
  dispatch(checkAuthStatusAction());
};
