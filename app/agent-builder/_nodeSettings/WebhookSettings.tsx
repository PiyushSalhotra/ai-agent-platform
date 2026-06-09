"use client"
import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Copy } from 'lucide-react'

function WebhookSettings({ selectedNode, updateFormData }: any) {
    const [name, setName] = useState('');
    const [customBaseUrl, setCustomBaseUrl] = useState('');
    const [webhookUrl, setWebhookUrl] = useState('');

    useEffect(() => {
        if (selectedNode?.data) {
            setName(selectedNode.data.label || 'Webhook Trigger');
            setCustomBaseUrl(selectedNode.data.settings?.customBaseUrl || '');
        }
    }, [selectedNode]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const pathParts = window.location.pathname.split('/');
            const agentId = pathParts[2] || '';
            const base = customBaseUrl.trim() || window.location.origin;
            const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
            setWebhookUrl(`${cleanBase}/api/trigger/${agentId}`);
        }
    }, [customBaseUrl, selectedNode]);

    const handleCopy = () => {
        if (webhookUrl) {
            navigator.clipboard.writeText(webhookUrl);
            toast.success("Webhook URL copied to clipboard!");
        }
    }

    const onSave = () => {
        updateFormData({
            name: name,
            customBaseUrl: customBaseUrl,
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

            <div className='mt-4 space-y-1.5'>
                <Label className='text-xs font-semibold text-slate-600'>Base URL Override (Optional)</Label>
                <Input
                    placeholder='e.g., http://localhost:3000 or https://xxxx.ngrok-free.app'
                    onChange={(event) => setCustomBaseUrl(event.target.value)}
                    value={customBaseUrl}
                    className='h-9 text-xs'
                />
                <p className='text-slate-400 text-[10px] leading-relaxed'>
                    Override the base URL if testing locally with a tunnel, custom domain, or ngrok.
                </p>
            </div>

            <Button className='w-full mt-6 h-9 font-medium' onClick={onSave}>Save</Button>
        </div>
    )
}

export default WebhookSettings;
