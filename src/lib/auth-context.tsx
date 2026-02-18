import { createContext, useContext } from "react";

export type AppAuthUser = {
	id: string;
	email: string;
	firstName: string | null;
	lastName: string | null;
	profilePictureUrl: string | null;
};

type AppAuthContextValue = {
	user: AppAuthUser | null;
	loading: boolean;
};

const AppAuthContext = createContext<AppAuthContextValue>({
	user: null,
	loading: true,
});

export const AppAuthProvider = AppAuthContext.Provider;

export function useAppAuth() {
	return useContext(AppAuthContext);
}
