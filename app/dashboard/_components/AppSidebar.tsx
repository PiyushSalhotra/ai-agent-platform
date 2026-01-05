"use client"
import React, { useContext, useEffect } from 'react'
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
} from "@/components/ui/sidebar"
import Image from 'next/image'
import { Database, Gem, Headphones, LayoutDashboard, User2Icon, WalletCards } from 'lucide-react'
import { useAuth, UserAvatar } from '@clerk/nextjs'
import Link from 'next/link'
import { UserDetailContext } from '@/context/UserDetailContext'
import { Button } from '@/components/ui/button'
import { usePathname } from 'next/navigation'
import { useConvex } from 'convex/react'
import { api } from '@/convex/_generated/api'

const MenuOptions=[
    {
        title: 'Dashboard',
        url: '/dashboard',
        icon: LayoutDashboard
    },
    {
        title: 'AI Agents',
        url: '/dashboard/my-agents',
        icon: Headphones
    },
    {
        title: 'Pricing',
        url: '/dashboard/pricing',
        icon: WalletCards
    },
    {
        title: 'Profile',
        url: '/dashboard/profile',
        icon: User2Icon
    },
]
function AppSidebar() {
    const {open} = useSidebar();
    const {userDetail, setUserDetail} = useContext(UserDetailContext);
    const path = usePathname()
    const {has} = useAuth()
    const isPaidUser = has&&has({ plan: 'unlimited_plans'})
    console.log("isPaidUser:", isPaidUser)
    const convex = useConvex()
    const [totalRemainingCredits, setTotalRemainingCredits] = React.useState<number>(0);
    
    //it is called when user is not paid user
    useEffect(()=>{
        if(!isPaidUser && userDetail){
            GetUserAgent();
        }
    },[userDetail])
    //if its not paid user then we have to show count
    const GetUserAgent= async()=>{
        const result = await convex.query(api.agent.GetUserAgents, {
            userId: userDetail?._id
        })
        setTotalRemainingCredits(2-Number(result?.length || 0));
        setUserDetail((prev:any)=>({
            ...prev,
            remainingCredits: 2-Number(result?.length || 0)
        }))
        console.log("User Agents:", result)
        //return result of agents user created
    }
  return (
     <Sidebar collapsible='icon'>
      <SidebarHeader>
        <div className='flex gap-2 items-center'>
        <Image src={'/logo.svg'} alt='logo' width={35} height={35}/>
        {open && <h2 className='font-bold text-lg'>PiAgent</h2>}
        </div>
        </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
            <SidebarGroupLabel>Application</SidebarGroupLabel>
            <SidebarGroupContent>
                <SidebarMenu>
                    {MenuOptions.map((menu,index)=>(
                        <SidebarMenuItem key={index}>
                            <SidebarMenuButton asChild size={open?'lg':'default'} isActive={path==menu.url?true:false}>
                                <Link href={menu.url}>
                                <menu.icon/>
                                <span>{menu.title}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className='mb-10'>
        {!isPaidUser?
        <div>
        <div className='flex gap-2 items-center'>
            <Gem/>
            {open && <h2>Remaining Credits: <span className='font-bold'>{totalRemainingCredits}/2</span></h2>}
        </div>
        {open && <Button className='mt-2'>Upgrade to Unlimited</Button>}
        </div>: 
        <div>
            <h2>You can create Unlimited Agents</h2></div>}
        </SidebarFooter>
    </Sidebar>
  )
}

export default AppSidebar
