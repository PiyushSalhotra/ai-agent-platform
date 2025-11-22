import { Button } from '@/components/ui/button'
import { Agent } from '@/types/AgentType'
import { ChevronLeft, Code2, Play, X } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

type Props = {
  agentDetail: Agent | undefined,
  previewHeader?:boolean
}
function Header({agentDetail,previewHeader=false}:Props) {
  return (
    <div className='w-full p-3 flex items-center justify-between'>
        <div className='flex gap-2 items-center'>
            <ChevronLeft className='h-8 w-8'/>
      <h2 className='text-xl '>{agentDetail?.name}</h2>
    </div>
    <div className='flex items-center gap-3'>
        <Button variant={'ghost'}>
            <Code2/>Code
        </Button>
        {!previewHeader? <Link href={`/agent-builder/${agentDetail?.agentId}/preview`}>
        <Button><Play/>Preview</Button>
        </Link>:
        <Link href={`/agent-builder/${agentDetail?.agentId}`}>
        <Button variant={'outline'}><X/>Close Preview</Button>
        </Link>}

        <Button>Publish</Button>
    </div>
    </div>
  )
}

export default Header
