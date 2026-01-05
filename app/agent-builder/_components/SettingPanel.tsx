import { WorkflowContext } from '@/context/WorkflowContext'
import React, { useContext } from 'react'
import AgentSettings from '../_nodeSettings/AgentSettings'
import EndNode from '../_customNodes/EndNode'
import EndSettings from '../_nodeSettings/EndSettings'
import IfElseSettings from '../_nodeSettings/IfElseSettings'
import WhileSettings from '../_nodeSettings/WhileSettings'
import UserApproval from '../_nodeSettings/UserApproval'
import ApiSettings from '../_nodeSettings/ApiSettings'

function SettingPanel() {
    const {selectedNode,setAddedNodes} = useContext(WorkflowContext)
    
    //update node form data
    //This function is called when a user changes a setting in the right panel.
//     When the user types in the form:
// the selected node’s data must update
// the node UI (label) must update
// the workflow state must stay immutable

// User types in settings form
//         ↓
// Settings component calls updateFormData(formData)
//         ↓
// SettingPanel receives formData
//         ↓
// onUpdateNodeData(formData) runs
//         ↓
// Selected node is updated inside nodes array
//         ↓
// ReactFlow re-renders the node
    const onUpdateNodeData=(formData:any)=>{
        const updateNode={
            ...selectedNode,
            data:{
                ...selectedNode.data,
                label:formData.name,
                settings:formData
            }
        }
        setAddedNodes((prevNode:any)=>
        prevNode.map((node:any)=>
        node.id===selectedNode.id?updateNode:node
        )
        )
    }
  return selectedNode && (
    <div className='p-5 bg-white rounded-2xl w-[350]px shadow'>
      {selectedNode?.type=='AgentNode' && <AgentSettings selectedNode={selectedNode}
      updateFormData={(value:any)=>onUpdateNodeData(value)}/>}
      {selectedNode?.type=='EndNode'&& <EndSettings selectedNode={selectedNode}
      updateFormData={(value:any)=>onUpdateNodeData(value)}/> }
      {selectedNode?.type=='IfElseNode' && <IfElseSettings selectedNode={selectedNode}
      updateFormData={(value:any)=>onUpdateNodeData(value)}/>}
      {selectedNode?.type=='WhileNode' && <WhileSettings selectedNode={selectedNode}
      updateFormData={(value:any)=>onUpdateNodeData(value)}/>}
      {selectedNode?.type=='UserApprovalNode' && <UserApproval selectedNode={selectedNode}
      updateFormData={(value:any)=>onUpdateNodeData(value)}/>}
      {selectedNode?.type=='ApiNode' && <ApiSettings selectedNode={selectedNode}
      updateFormData={(value:any)=>onUpdateNodeData(value)}/>}
    </div>
  )
}

export default SettingPanel
