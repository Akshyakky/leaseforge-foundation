import { authService as apiAuthService, authService, LoginRequest } from "@/services/authService";
import { toast } from "sonner";
import { login as loginAction, logout as logoutAction, checkAuthStatus as checkAuthStatusAction, loginSuccess } from "./authSlice";
import { AppDispatch, RootState } from "@/lib/store";

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

export const switchUserCompany = (companyId: number) => async (dispatch: AppDispatch, getState: () => RootState) => {
  try {
    const state = getState();
    const userId = state.auth.user?.id;

    if (!userId) {
      toast.error("User not logged in");
      return false;
    }

    const request = {
      userID: parseInt(userId),
      companyID: companyId,
    };

    const result = await authService.switchCompany(request);

    if (result.success) {
      // Update auth state with new company info
      await dispatch(
        loginSuccess({
          user: {
            id: result.user.userID.toString(),
            name: result.user.userName,
            email: result.user.emailID,
            role: result.user.roleName || "user",
            fullName: result.user.userFullName,
            phoneNo: result.user.phoneNo,
            departmentName: result.user.departmentName,
            roleName: result.user.roleName,
            currentCompanyId: result.user.compID.toString(),
            currentCompanyName: result.user.companyName,
            companies: (result.companies || []).map((company) => ({
              id: company.companyID.toString(),
              name: company.companyName,
              isDefault: company.isDefault,
            })),
          },
          token: result.token,
          refreshToken: result.refreshToken,
        })
      );

      toast.success("Company switched successfully");
      return true;
    } else {
      toast.error(result.message || "Failed to switch company");
      return false;
    }
  } catch (error) {
    let errorMessage = "An error occurred while switching company";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    toast.error(errorMessage);
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
