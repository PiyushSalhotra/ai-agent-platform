import { Button } from '@/components/ui/button'
import { Agent } from '@/types/AgentType'
import { ChevronLeft, Code2, Play, X, History } from 'lucide-react'
import Link from 'next/link'
import React, { useState } from 'react'
import TriggerHistoryDialog from './TriggerHistoryDialog'

type Props = {
  agentDetail: Agent | undefined,
  previewHeader?:boolean,
  onPublish:()=> void
}
function Header({agentDetail,previewHeader=false, onPublish}:Props) {
  const [openHistory, setOpenHistory] = useState(false);

  return (
    <div className='w-full p-3 flex items-center justify-between'>
        <div className='flex gap-2 items-center'>
            <ChevronLeft className='h-8 w-8'/>
      <h2 className='text-xl '>{agentDetail?.name}</h2>
    </div>
    <div className='flex items-center gap-3'>
        <Button variant={'ghost'} onClick={() => setOpenHistory(true)}>
            <History className='mr-1.5 h-4 w-4'/>History
        </Button>
        <Button variant={'ghost'}>
            <Code2/>Code
        </Button>
        {!previewHeader? <Link href={`/agent-builder/${agentDetail?.agentId}/preview`}>
        <Button><Play/>Preview</Button>
        </Link>:
        <Link href={`/agent-builder/${agentDetail?.agentId}`}>
        <Button variant={'outline'}><X/>Close Preview</Button>
        </Link>}

        <Button onClick={onPublish}>Publish</Button>
    </div>

    {agentDetail && (
      <TriggerHistoryDialog 
        openDialog={openHistory} 
        setOpenDialog={setOpenHistory} 
        agentId={agentDetail.agentId} 
      />
    )}
    </div>
  )
}

export default Header
