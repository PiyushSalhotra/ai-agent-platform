import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'

function WhileSettings({selectedNode,updateFormData}:any) {
    const [formData,setFormData] = useState({whileCondition: ''})
        useEffect(()=>{
            selectedNode&&setFormData(selectedNode?.data.settings)
        },[selectedNode])
  return (
    <div>
      I<h2 className='font-bold'>While</h2>
      <p className='text-gray-500 mt-2'>Loop your logic</p>
      <div className='mt-3'>
        <Label>while</Label>
        <Input placeholder='Enter condition e.g output==`any condition`' className='mt-2' onChange={(e)=>setFormData({whileCondition:e.target.value})}
        value={formData?.whileCondition}/>
      </div>
      <Button className='w-full mt-5' onClick={()=>{updateFormData(formData);toast.success('Updated!')}}>Save</Button>
    </div>
  )
}

export default WhileSettings
