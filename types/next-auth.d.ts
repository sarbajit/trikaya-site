import type { DefaultSession } from "next-auth";
import type { UserRole } from "@/models/User";
import type { AgentStatus } from "@/models/Agent";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      approved?: boolean;
      agentStatus?: AgentStatus;
    } & DefaultSession["user"];
  }

  interface User {
    role: UserRole;
    approved?: boolean;
    agentStatus?: AgentStatus;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    approved?: boolean;
    agentStatus?: AgentStatus;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    approved?: boolean;
    agentStatus?: AgentStatus;
  }
}
