import React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import MyAgents from './MyAgents'

function AiAgentTab() {
  return (
    <div className='px-10 md:px-24 lg:px-32 mt-14'>
      <Tabs defaultValue="myagent" className="w-[700px]">
  <TabsList>
    <TabsTrigger value="myagent">My Agents</TabsTrigger>
    <TabsTrigger value="template">Templates</TabsTrigger>
  </TabsList>
  <TabsContent value="myagent"><MyAgents/></TabsContent>
  <TabsContent value="template">Templates</TabsContent>
</Tabs>
    </div>
  )
}

export default AiAgentTab
