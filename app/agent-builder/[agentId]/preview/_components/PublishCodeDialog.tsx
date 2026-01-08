import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { BundledLanguage } from '@/components/ui/shadcn-io/code-block';
import {
  CodeBlock,
  CodeBlockBody,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockFilename,
  CodeBlockFiles,
  CodeBlockHeader,
  CodeBlockItem,
  CodeBlockSelect,
  CodeBlockSelectContent,
  CodeBlockSelectItem,
  CodeBlockSelectTrigger,
  CodeBlockSelectValue,
} from '@/components/ui/shadcn-io/code-block';


type Props = {
    openDialog:boolean,
    setOpenDialog:(open:boolean)=>void
}

// This stores:
// Code language
// File name
// Example client-side code
// The code shows:
// How to call /api/agent-chat
// How to read streamed responses
// How to process chunks in real time
const code = [
  {
    language: 'jsx',
    filename: 'MyComponent.jsx',
    code: `const res = await fetch('https://piagent.com/api/agent-chat',{
            method:'POST',
            headers:{
                'Content-Type':'application/json'
            },
            body:JSON.stringify({
                agentId: <agentId>,
                userId: <userId>,
                userInput: <userInput>
            })
    })

    if(!res.body) return;

    //read streamed chunks
    //convert bytes → text
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let done = false;
    while(!done){
        const {value, done: doneReading} = await reader.read();
        done = doneReading;
        if(value){
            console.log(decoder.decode(value));
            const chunk = decoder.decode(value);
            // Process the chunk
        }
    }`,
  },]
function PublishCodeDialog({openDialog, setOpenDialog}:Props) {
  return (
    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
  
  <DialogContent className='min-w-3xl'>
    <DialogHeader>
      <DialogTitle>Get Code</DialogTitle>
      <DialogDescription>
        <CodeBlock data={code} defaultValue={code[0].language}>
    <CodeBlockHeader>
      <CodeBlockFiles>
        {(item) => (
          <CodeBlockFilename key={item.language} value={item.language}>
            {item.filename}
          </CodeBlockFilename>
        )}
      </CodeBlockFiles>
      <CodeBlockSelect>
        <CodeBlockSelectTrigger>
          <CodeBlockSelectValue />
        </CodeBlockSelectTrigger>
        <CodeBlockSelectContent>
          {(item) => (
            <CodeBlockSelectItem key={item.language} value={item.language}>
              {item.language}
            </CodeBlockSelectItem>
          )}
        </CodeBlockSelectContent>
      </CodeBlockSelect>
      <CodeBlockCopyButton
        onCopy={() => console.log('Copied code to clipboard')}
        onError={() => console.error('Failed to copy code to clipboard')}
      />
    </CodeBlockHeader>
    <CodeBlockBody>
      {(item) => (
        <CodeBlockItem key={item.language} value={item.language}>
          <CodeBlockContent language={item.language as BundledLanguage}>
            {item.code}
          </CodeBlockContent>
        </CodeBlockItem>
      )}
    </CodeBlockBody>
  </CodeBlock>
      </DialogDescription>
    </DialogHeader>
  </DialogContent>
</Dialog>
  )
}

export default PublishCodeDialog
