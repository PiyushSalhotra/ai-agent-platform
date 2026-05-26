"use client"
import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

function CronSettings({ selectedNode, updateFormData }: any) {
    const [name, setName] = useState('');
    const [interval, setInterval] = useState('60');
    const [triggerPrompt, setTriggerPrompt] = useState('');

    useEffect(() => {
        if (selectedNode?.data) {
            setName(selectedNode.data.label || 'Cron Trigger');
            if (selectedNode.data.settings) {
                setInterval(selectedNode.data.settings.interval || '60');
                setTriggerPrompt(selectedNode.data.settings.triggerPrompt || '');
            }
        }
    }, [selectedNode]);

    const onSave = () => {
        updateFormData({
            name: name,
            interval: interval,
            triggerPrompt: triggerPrompt
        });
        toast.success("Cron settings saved!");
    }

    return (
        <div>
            <h2 className='font-bold text-slate-800'>Cron Trigger</h2>
            <p className='text-gray-500 text-xs mt-1 leading-relaxed'>
                Schedule this agent to run automatically at periodic intervals.
            </p>

            <div className='mt-4 space-y-1.5'>
                <Label className='text-xs font-semibold text-slate-600'>Node Name</Label>
                <Input
                    placeholder='Cron Trigger'
                    onChange={(event) => setName(event.target.value)}
                    value={name}
                    className='h-9'
                />
            </div>

            <div className='mt-4 space-y-1.5'>
                <Label className='text-xs font-semibold text-slate-600'>Execution Interval (minutes)</Label>
                <div className='flex gap-2'>
                    <Select onValueChange={(val) => setInterval(val)} value={interval}>
                        <SelectTrigger className='w-full h-9'>
                            <SelectValue placeholder="Select Interval" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value='5'>5 minutes</SelectItem>
                            <SelectItem value='15'>15 minutes</SelectItem>
                            <SelectItem value='60'>1 hour</SelectItem>
                            <SelectItem value='1440'>24 hours</SelectItem>
                        </SelectContent>
                    </Select>
                    <Input
                        type="number"
                        placeholder="Custom mins"
                        onChange={(e) => setInterval(e.target.value)}
                        value={interval}
                        className='w-28 h-9 shrink-0'
                        min="1"
                    />
                </div>
            </div>

            <div className='mt-4 space-y-1.5'>
                <Label className='text-xs font-semibold text-slate-600'>Trigger Prompt (Starting Instructions)</Label>
                <Textarea
                    placeholder='Describe what instructions the agent should process on every scheduled trigger run...'
                    onChange={(e) => setTriggerPrompt(e.target.value)}
                    value={triggerPrompt}
                    className='min-h-[100px] text-xs resize-none'
                />
            </div>

            <Button className='w-full mt-6 h-9 font-medium' onClick={onSave}>Save</Button>
        </div>
    )
}

export default CronSettings;
