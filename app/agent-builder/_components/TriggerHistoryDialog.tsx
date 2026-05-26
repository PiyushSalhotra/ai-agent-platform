"use client"
import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Calendar, ChevronDown, ChevronUp, Clock, RefreshCw, AlertCircle, CheckCircle, Webhook, XCircle } from 'lucide-react'

type Props = {
  openDialog: boolean,
  setOpenDialog: (open: boolean) => void,
  agentId: string
}

function TriggerHistoryDialog({ openDialog, setOpenDialog, agentId }: Props) {
  // Fetch execution history logs from Convex
  const runs = useQuery(api.agent.GetTriggerRuns, { agentId });
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedRunId(expandedRunId === id ? null : id);
  };

  return (
    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
      <DialogContent className='max-w-2xl max-h-[85vh] flex flex-col p-6 rounded-2xl border bg-white shadow-xl overflow-hidden'>
        <DialogHeader className='border-b pb-4'>
          <DialogTitle className='text-xl font-bold text-slate-800 flex items-center gap-2'>
            <Clock className='h-5 w-5 text-indigo-600' />
            Trigger Execution History
          </DialogTitle>
          <DialogDescription className='text-xs text-slate-500'>
            View and audit detailed execution logs for Webhook and Cron runs.
          </DialogDescription>
        </DialogHeader>

        <div className='flex-1 overflow-y-auto mt-4 pr-1 space-y-3 min-h-[300px]'>
          {runs === undefined ? (
            <div className='flex flex-col items-center justify-center h-full py-16 text-slate-400 gap-3'>
              <RefreshCw className='h-8 w-8 animate-spin text-slate-400' />
              <p className='text-sm font-medium'>Loading audit logs...</p>
            </div>
          ) : runs.length === 0 ? (
            <div className='flex flex-col items-center justify-center h-full py-16 text-slate-400 gap-2 border-2 border-dashed border-slate-100 rounded-xl'>
              <AlertCircle className='h-10 w-10 text-slate-300' />
              <p className='text-sm font-medium text-slate-500'>No execution logs found yet</p>
              <p className='text-xs text-slate-400 max-w-sm text-center px-4'>
                Trigger this agent via a webhook call or publish it with a schedule to log runs here.
              </p>
            </div>
          ) : (
            runs.map((run: any) => {
              const isExpanded = expandedRunId === run._id;
              const isSuccess = run.status === 'success';

              return (
                <div 
                  key={run._id} 
                  className={`border rounded-xl transition-all duration-200 overflow-hidden bg-white hover:border-slate-300 ${isExpanded ? 'shadow-sm ring-1 ring-slate-100' : ''}`}
                >
                  {/* Summary Bar */}
                  <div 
                    onClick={() => toggleExpand(run._id)}
                    className='p-3.5 px-4 flex items-center justify-between cursor-pointer select-none gap-4 bg-slate-50/50 hover:bg-slate-50 transition-colors duration-150'
                  >
                    <div className='flex items-center gap-3 min-w-0'>
                      {/* Icon Source */}
                      {run.source === 'cron' ? (
                        <div className='p-2 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0'>
                          <Clock className='h-4 w-4' />
                        </div>
                      ) : (
                        <div className='p-2 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0'>
                          <Webhook className='h-4 w-4' />
                        </div>
                      )}

                      <div className='min-w-0'>
                        <h4 className='text-xs font-semibold text-slate-700 capitalize flex items-center gap-1.5'>
                          {run.source} Trigger
                        </h4>
                        <p className='text-[10px] text-slate-400 flex items-center gap-1 mt-0.5'>
                          <Calendar className='h-3 w-3 shrink-0' />
                          {new Date(run.executedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className='flex items-center gap-3 shrink-0'>
                      {/* Status Badge */}
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        isSuccess 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {isSuccess ? (
                          <>
                            <CheckCircle className='h-3 w-3' />
                            Success
                          </>
                        ) : (
                          <>
                            <XCircle className='h-3 w-3' />
                            Failed
                          </>
                        )}
                      </span>

                      {/* Expand Chevron */}
                      {isExpanded ? (
                        <ChevronUp className='h-4 w-4 text-slate-400' />
                      ) : (
                        <ChevronDown className='h-4 w-4 text-slate-400' />
                      )}
                    </div>
                  </div>

                  {/* Expanded Logs Panel */}
                  {isExpanded && (
                    <div className='p-4 border-t bg-white space-y-3.5 text-xs animate-fade-in'>
                      <div className='space-y-1'>
                        <span className='font-bold text-slate-500 uppercase text-[9px] tracking-wider block'>Input Prompt</span>
                        <div className='p-2.5 bg-slate-50 border rounded-lg text-slate-700 font-mono text-[11px] leading-relaxed break-words whitespace-pre-wrap'>
                          {run.inputPrompt || "None"}
                        </div>
                      </div>

                      <div className='space-y-1'>
                        <span className='font-bold text-slate-500 uppercase text-[9px] tracking-wider block'>
                          {isSuccess ? "Agent Output Response" : "Error Log Detail"}
                        </span>
                        <div className={`p-3 border rounded-lg leading-relaxed whitespace-pre-wrap break-words ${
                          isSuccess 
                            ? 'bg-slate-50/30 text-slate-800' 
                            : 'bg-rose-50/30 text-rose-900 border-rose-100 font-mono text-[11px]'
                        }`}>
                          {run.response}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default TriggerHistoryDialog;
