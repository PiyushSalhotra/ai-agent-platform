"use client"
import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Copy } from 'lucide-react'

function WebhookSettings({ selectedNode, updateFormData }: any) {
    const [name, setName] = useState('');
    const [webhookUrl, setWebhookUrl] = useState('');

    useEffect(() => {
        if (selectedNode?.data) {
            setName(selectedNode.data.label || 'Webhook Trigger');
        }
        if (typeof window !== 'undefined') {
            const pathParts = window.location.pathname.split('/');
            const agentId = pathParts[2] || '';
            setWebhookUrl(`${window.location.origin}/api/trigger/${agentId}`);
        }
    }, [selectedNode]);

    const handleCopy = () => {
        if (webhookUrl) {
            navigator.clipboard.writeText(webhookUrl);
            toast.success("Webhook URL copied to clipboard!");
        }
    }

    const onSave = () => {
        updateFormData({
            name: name,
        });
        toast.success("Webhook settings saved!");
    }

    return (
        <div>
            <h2 className='font-bold text-slate-800'>Webhook Trigger</h2>
            <p className='text-gray-500 text-xs mt-1 leading-relaxed'>
                Trigger this agent workflow externally by sending an HTTP POST request.
            </p>

            <div className='mt-4 space-y-1.5'>
                <Label className='text-xs font-semibold text-slate-600'>Node Name</Label>
                <Input
                    placeholder='Webhook Trigger'
                    onChange={(event) => setName(event.target.value)}
                    value={name}
                    className='h-9'
                />
            </div>

            <div className='mt-4 space-y-1.5'>
                <Label className='text-xs font-semibold text-slate-600'>Webhook URL</Label>
                <div className='flex gap-2'>
                    <Input
                        readOnly
                        value={webhookUrl}
                        className='bg-slate-50 text-slate-500 text-xs h-9 cursor-text select-all'
                    />
                    <Button variant='outline' size='icon' onClick={handleCopy} className='h-9 w-9 shrink-0'>
                        <Copy className='h-4 w-4' />
                    </Button>
                </div>
            </div>

            <Button className='w-full mt-6 h-9 font-medium' onClick={onSave}>Save</Button>
        </div>
    )
}

export default WebhookSettings;
