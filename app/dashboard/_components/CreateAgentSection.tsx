"use client"
import { Button } from '@/components/ui/button'
import { Loader2Icon, Plus } from 'lucide-react'
import React, { useContext, useState } from 'react'
import { v4 as uuidv4 } from 'uuid';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from '@/components/ui/input'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useRouter } from 'next/navigation';
import { UserDetailContext } from '@/context/UserDetailContext';

function CreateAgentSection() {
    const [openDialog,setOpenDialog] = useState(false)
    const CreateAgentMutation = useMutation(api.agent.CreateAgent);
    const [agentName, setAgentName] = useState<string>()
    const router = useRouter();
    const [loader,setLoader] = useState(false);
    const {userDetail,setUserDetail} = useContext(UserDetailContext)

    const CreateAgent=async()=>{
        setLoader(true);
        const agentId = uuidv4();//Generate Unique Agent Id
        const result = await CreateAgentMutation({
            agentId:agentId,
            name:agentName??'',
            userId:userDetail?._id
        });
        console.log(result);
        setOpenDialog(false);
        setLoader(false);

        //navigaet to Agent builder screen
        router.push('/agent-builder'+agentId)
    }
  return (
    <div className='space-y-2 flex flex-col justify-center items-center mt-24'>
      <h2 className='font-bold text-2xl'>Create AI Agent</h2>
      <p className='text-lg'>Build an AI Agent workflow with custom logic and tools</p>
      
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
  <DialogTrigger asChild>
    <Button size={'lg'} onClick={()=> setOpenDialog(true)}><Plus/>Create</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Enter Agent Name</DialogTitle>
      <DialogDescription>
        <Input placeholder='Agent Name' onChange={(event)=>setAgentName(event.target.value)}/>
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
        <DialogClose>
    <Button variant={'ghost'}>Cancel</Button>
    </DialogClose>
    <Button onClick={()=> CreateAgent()} disabled={loader}>
        {loader && <Loader2Icon className='animate-spin'/>}
        Create</Button>
  </DialogFooter>
  </DialogContent>
  
</Dialog>
    </div>
  )
}

export default CreateAgentSection
