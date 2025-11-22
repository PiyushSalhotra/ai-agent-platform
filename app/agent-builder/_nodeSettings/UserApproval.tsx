import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FileJson } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'

function UserApproval({selectedNode,updateFormData}:any) {
    const [formData,setFormData] = useState({name: '',message:''})
        useEffect(()=>{
            selectedNode&&setFormData(selectedNode?.data.settings)
        },[selectedNode])

        const handleChange=(Key:string, value:any)=>{
        setFormData((prev)=>({
            ...prev,
            [Key]:value
        }))
    }
    const onSave=()=>{
        console.log(formData)
        updateFormData(formData)
        toast.success("Settings Updated!")
    }
  return (
    <div>
      <h2 className='font-bold'>User Approval</h2>
      <p className='text-gray-500 mt-2'>Pause for a human to approve or reject a step</p>
        <div className='mt-3 space-y-1'>
        <Label>Name</Label>
        <Input placeholder='Name' onChange={(event)=>handleChange('name', event.target.value)} value={formData?.name}/>
      </div>
      <div className='mt-3 space-y-1'>
        <Label>Message</Label>
        <Textarea placeholder='Describe the message to show to the user' onChange={(event)=>handleChange('message', event.target.value)} value={formData?.message}/>
      </div>
      <Button className='w-full mt-5' onClick={onSave}>Save</Button>
    </div>
  )
}

export default UserApproval
