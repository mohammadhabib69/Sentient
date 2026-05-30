import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authService, RegisterInput, LoginInput } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";
import { useRouter } from "next/navigation";

export function useCurrentUser() {
  const setAuth = useAuthStore((state) => state.setAuth);
  
  return useQuery({
    queryKey: ["auth", "user"],
    queryFn: async () => {
      try {
        const response = await authService.me();
        if (response.success && response.data) {
          setAuth(response.data.user, response.data.org);
          return response.data;
        }
        return null;
      } catch (error) {
        return null;
      }
    },
    // Don't retry on 401s if we fail to fetch the user
    retry: false,
  });
}

export function useLogin() {
  const setAuth = useAuthStore((state) => state.setAuth);
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: LoginInput) => {
      return await authService.login(data);
    },
    onSuccess: (response) => {
      if (response.success && response.data) {
        setAuth(response.data.user, response.data.org);
        queryClient.setQueryData(["auth", "user"], response.data);
        router.push("/dashboard");
      }
    },
  });
}

export function useRegister() {
  const setAuth = useAuthStore((state) => state.setAuth);
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: RegisterInput) => {
      return await authService.register(data);
    },
    onSuccess: (response) => {
      if (response.success && response.data) {
        setAuth(response.data.user, response.data.org);
        queryClient.setQueryData(["auth", "user"], response.data);
        router.push("/dashboard"); // or maybe /verify-email depending on flow
      }
    },
  });
}

export function useLogout() {
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      return await authService.logout();
    },
    onSettled: () => {
      clearAuth();
      queryClient.clear();
      router.push("/login");
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: async (email: string) => {
      return await authService.forgotPassword(email);
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async (data: { token: string; password: string }) => {
      return await authService.resetPassword(data.token, data.password);
    },
  });
}
