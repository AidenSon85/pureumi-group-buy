"use client";
import { createContext, useContext } from "react";

interface ShopUser {
  factoryId: string;
  userId: string;
  userName: string;
}

const ShopUserContext = createContext<ShopUser>({ factoryId: "", userId: "", userName: "" });

export function ShopUserProvider({ value, children }: { value: ShopUser; children: React.ReactNode }) {
  return <ShopUserContext.Provider value={value}>{children}</ShopUserContext.Provider>;
}

export const useShopUser = () => useContext(ShopUserContext);
