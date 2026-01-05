import { Button } from '@/components/ui/button'
import { Agent } from '@/types/AgentType'
import { Loader2Icon, RefreshCwIcon, Send } from 'lucide-react'
import React, { useState } from 'react'
import { string } from 'zod/v4'

type Props = {
    GenerateAgentToolConfig:()=> void,
    loading:boolean
    agentDetail:Agent
    conversationId:string | null
}


function ChatUi({GenerateAgentToolConfig,loading,agentDetail,conversationId}: Props) {
    const [userInput,setUserInput]=useState<string>('');
    const [loadingMsg,setLoadingMsg]=useState(false);
    //user enter input and ai response back in chat
    //role: 'user' | 'assistant'
//content: message text
    const [messages,setMessages]=useState<{role:string, content:string}[]>([]);

    //call our chat api endpoint
    //Sending a message
    //Triggered when user clicks Send.
    const OnSendMsg=async()=>{
        setLoadingMsg(true);
        //Add user message to chat
        setMessages([...messages,{role:'user', content:userInput}]);
        //Clear input box
        setUserInput('');
        //Call backend agent API
        const res = await fetch('/api/agent-chat',{
            method:'POST',
            headers:{
                'Content-Type':'application/json'
            },
            body:JSON.stringify({
                agentName:agentDetail?.name,
                agents:agentDetail?.config?.agents||[],
                tools:agentDetail?.config?.tools||[],
                input:userInput,
                conversationId:conversationId
            })
    })

    if(!res.body) return;

    //read streamed chunks
    //convert bytes → text
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let done = false;

    //Add empty assistant message first
    //inorder to avoid overwriting previous messages
    setMessages((prev)=>[...prev, {role:'assistant', content:''}]);

    while(!done){
        const {value, done: doneReading} = await reader.read();
        done = doneReading;
        if(value){
            console.log(decoder.decode(value));
            const chunk = decoder.decode(value);
            setMessages((prev)=>{
                const updated = [...prev];
                updated[updated.length -1] = {
                    role:'assistant',
                    content:(updated[updated.length -1]?.content || '') + chunk
                    //Appends streamed text live to assistant message.
//This creates real-time typing effect.
                }
                return updated;
            });
        }
    } 
    setLoadingMsg(false);  
}
  return (
    <div>
        <div className="flex justify-between items-center border-b p-4">
  <h2>{agentDetail?.name}</h2>
  <Button onClick={GenerateAgentToolConfig} disabled={loading}>
    <RefreshCwIcon className={`${loading && "animate-spin"}`} /> Reboot Agent
  </Button>
</div>

<div className="w-full h-[80vh] p-4 flex flex-col">

  {/* Message Section */}
  <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col">

    {messages.map((msg, index)=>(

      <div className={`p-2 flex rounded-lg max-w-[80%]
      ${msg.role === 'user' ? 'self-end bg-blue-500 text-white' : 'self-start bg-gray-300 text-black'}`} key={index}>
        <h2 className="text-sm">{msg.content}</h2>
      </div>

    ))}
    

    
    {/* Loading state */}
   {loadingMsg&& <div className="flex justify-center items-center p-4">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-zinc-800"></div>
      <span className="ml-2 text-zinc-800">Thinking... Working on your request</span>
    </div>}

  </div>

  {/* Footer Input */}
  <div className="p-1 mt-3 border-t flex items-center gap-2">
    <textarea value={userInput} onChange={(e)=> setUserInput(e.target.value)}
      placeholder="Type your message here..."
      className="flex-1 resize-none border rounded-lg px-3 py-2 focus:outline-none focus:ring-2"
    />
    <Button onClick={OnSendMsg} disabled={loadingMsg || !userInput.trim().length} >{loadingMsg?<Loader2Icon className='animate-spin'/>:<Send/>}</Button>
  </div>

</div>

    </div>
  )
}

export default ChatUi
