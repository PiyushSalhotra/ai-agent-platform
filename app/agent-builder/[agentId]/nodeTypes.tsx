import StartNode from "../_customNodes/StartNode";
import AgentNode from "../_customNodes/AgentNode";
import EndNode from "../_customNodes/EndNode";
import IfElseNode from "../_customNodes/IfElseNode";
import WhileNode from "../_customNodes/WhileNode";
import UserApprovalNode from "../_customNodes/UserApprovalNode";
import ApiNode from "../_customNodes/ApiNode";
import WebhookNode from "../_customNodes/WebhookNode";
import CronNode from "../_customNodes/CronNode";

export const nodeTypes = {
  start: StartNode,
  StartNode,
  AgentNode,
  EndNode,
  IfElseNode,
  WhileNode,
  UserApprovalNode,
  ApiNode,
  WebhookNode,
  CronNode,
};
