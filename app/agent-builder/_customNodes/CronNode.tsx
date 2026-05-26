import { Handle, Position } from '@xyflow/react'
import { Clock } from 'lucide-react'
import React from 'react'

function CronNode({ data }: any) {
  return (
    <div className='bg-white rounded-2xl p-3 px-4 border border-amber-200 shadow-sm hover:shadow-md transition-all duration-300 min-w-[170px] relative overflow-hidden group'>
      <div className='absolute top-0 left-0 w-1 h-full bg-amber-500' />
      <div className='flex gap-3 items-center'>
        <div className='p-2 rounded-xl bg-amber-50 text-amber-600 transition-transform duration-300 group-hover:scale-110 flex items-center justify-center'>
          <Clock className='h-5 w-5' />
        </div>
        <div className='flex flex-col text-left'>
          <h2 className='text-sm font-semibold text-slate-800'>{data?.label || 'Cron Trigger'}</h2>
          <p className='text-[10px] text-amber-500 font-medium tracking-wider uppercase'>Scheduled</p>
        </div>
        <Handle 
          type='source' 
          position={Position.Right} 
          style={{ width: 8, height: 8, backgroundColor: '#f59e0b', border: '2px solid #fff' }}
        />
      </div>
    </div>
  )
}

export default CronNode
