"use client";

import { Button } from "@/components/ui/button";
import { Loader2Icon, Plus } from "lucide-react";
import React, { useContext, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { UserDetailContext } from "@/context/UserDetailContext";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";

function CreateAgentSection() {
  const [openDialog, setOpenDialog] = useState(false);
  const [agentName, setAgentName] = useState<string>("");
  const [loader, setLoader] = useState(false);

  const router = useRouter();
  const { userDetail } = useContext(UserDetailContext);
  const { has } = useAuth();

  const isPaidUser = has?.({ plan: "unlimited_plans" }) ?? false;

  // Convex mutation
  const CreateAgentMutation = useMutation(api.agent.CreateAgent);

  const CreateAgent = async () => {
    try {
      // ⚠️ UX check only (real enforcement is backend)
      if (!isPaidUser && userDetail && userDetail.remainingCredits <= 0) {
        toast.error(
          "You have reached the free agent limit. Please upgrade your plan."
        );
        return;
      }

      setLoader(true);

      const agentId = uuidv4();

      await CreateAgentMutation({
        agentId,
        name: agentName.trim(),
        userId: userDetail?._id!,
      });

      setOpenDialog(false);

      // ✅ FIXED ROUTE
      router.push(`/agent-builder/${agentId}`);
    } catch (error: any) {
      // ✅ BACKEND ERROR HANDLING
      if (error?.message?.includes("FREE_AGENT_LIMIT_REACHED")) {
        toast.error(
          "Free plan limit reached. Upgrade to create more agents."
        );
      } else {
        console.error(error);
        toast.error("Something went wrong while creating the agent.");
      }
    } finally {
      setLoader(false);
    }
  };

  return (
    <div className="space-y-2 flex flex-col justify-center items-center mt-24">
      <h2 className="font-bold text-2xl">Create AI Agent</h2>
      <p className="text-lg">
        Build an AI Agent workflow with custom logic and tools
      </p>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogTrigger asChild>
          <Button size="lg">
            <Plus /> Create
          </Button>
        </DialogTrigger>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Agent Name</DialogTitle>
            <DialogDescription>
              <Input
                placeholder="Agent Name"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
              />
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>

            <Button onClick={CreateAgent} disabled={loader || !agentName.trim()}>
              {loader && <Loader2Icon className="animate-spin mr-2" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CreateAgentSection;
