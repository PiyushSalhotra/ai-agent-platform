"use client";

import React, { useContext, useEffect, useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import Image from "next/image";
import {
  Gem,
  Headphones,
  LayoutDashboard,
  User2Icon,
  WalletCards,
} from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { UserDetailContext } from "@/context/UserDetailContext";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { useConvex } from "convex/react";
import { api } from "@/convex/_generated/api";

/* ---------------- MENU OPTIONS ---------------- */

const MenuOptions = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "AI Agents", url: "/dashboard/my-agents", icon: Headphones },
  { title: "Pricing", url: "/dashboard/pricing", icon: WalletCards },
  { title: "Profile", url: "/dashboard/profile", icon: User2Icon },
];

/* ---------------- COMPONENT ---------------- */
//It renders the main navigation sidebar for the dashboard
function AppSidebar() {
  const { open } = useSidebar();
  //The usePathname hook is a Client Component hook used to read the current URL's pathname
  const path = usePathname();
  const convex = useConvex();

  /* ---- User Context ---- */
  const userContext = useContext(UserDetailContext);
  if (!userContext) return null;

  const { userDetail } = userContext;

  /* ---- Clerk Plan Check ---- */
  const { has } = useAuth();
// Clerk checks if user has unlimited_plans
// If yes → paid user
// If no → free user
  const isPaidUser = has?.({ plan: "unlimited_plans" }) ?? false;

  /* ---- Credits state (frontend-only) ---- */
// Default free plan limit = 2 agents
// This is UI state only
// Not a security mechanism
  const [remainingCredits, setRemainingCredits] = useState<number>(2);

//  Runs only when:
// User data is available
// User is NOT paid
  useEffect(() => {
    if (!userDetail || isPaidUser) return;

    const fetchUserAgents = async () => {
      const agents = await convex.query(api.agent.GetUserAgents, {
        userId: userDetail._id,
      });

//  Max free agents = 2
// Credits left = 2 − agents created
// Never goes below 0
      const creditsLeft = Math.max(0, 2 - (agents?.length ?? 0));
      setRemainingCredits(creditsLeft);

      console.log("User Agents:", agents);
    };

    fetchUserAgents();
  }, [convex, userDetail?._id, isPaidUser]);


  return (
    <Sidebar collapsible="icon">
      {/* ---------- HEADER ---------- */}
      <SidebarHeader>
        <div className="flex gap-2 items-center">
          <Image src="/logo.svg" alt="logo" width={35} height={35} />
          {open && <h2 className="font-bold text-lg">PiAgent</h2>}
        </div>
      </SidebarHeader>

      {/* ---------- CONTENT ---------- */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {MenuOptions.map((menu, index) => (
                <SidebarMenuItem key={index}>
                  <SidebarMenuButton
                    asChild
                    size={open ? "lg" : "default"}
                    isActive={path === menu.url} //Compares current URL with menu route
                                                 //If matched, UI changes (active state)
                  >
                    <Link href={menu.url}>
                      <menu.icon />
                      <span>{menu.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* ---------- FOOTER ---------- */}
      <SidebarFooter className="mb-10">
        {!isPaidUser ? (
          <div>
            <div className="flex gap-2 items-center">
              <Gem />
              {open && (
                <h2>
                  Remaining Credits:{" "}
                  <span className="font-bold">
                    {remainingCredits}/2
                  </span>
                </h2>
              )}
            </div>

            {open && (
                            <Link href="/dashboard/pricing">
                                <Button className='mt-2 w-full'>Upgrade to Unlimited</Button>
                            </Link>
                        )}
          </div>
        ) : (
          <h2>You can create Unlimited Agents</h2>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

export default AppSidebar;
