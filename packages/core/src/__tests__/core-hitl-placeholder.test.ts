import { describe, it, expect, beforeEach, vi } from "vitest";
import { CopilotKitCore } from "../core";
import {
  MockAgent,
  createToolCallMessage,
  createToolResultMessage,
  createTool,
} from "./test-utils";

describe("CopilotKitCore.runAgent - HITL Placeholder", () => {
  let copilotKitCore: CopilotKitCore;

  beforeEach(() => {
    copilotKitCore = new CopilotKitCore({});
    vi.clearAllMocks();
  });

  it("should replace 'Forwarded to client' placeholder with actual tool execution", async () => {
    const toolHandler = vi.fn(async () => "Actual Result");
    const tool = createTool({
      name: "hitlTool",
      handler: toolHandler,
    });
    copilotKitCore.addTool(tool);

    const toolCallId = "hitl-call";
    const assistantMsg = createToolCallMessage("hitlTool");
    if (
      assistantMsg.role === "assistant" &&
      assistantMsg.toolCalls &&
      assistantMsg.toolCalls[0]
    ) {
      assistantMsg.toolCalls[0].id = toolCallId;
    }
    
    // Create the placeholder result
    const placeholderResult = createToolResultMessage(
      toolCallId,
      "Forwarded to client",
    );

    const agent = new MockAgent({
      newMessages: [assistantMsg, placeholderResult],
    });
    copilotKitCore.addAgent__unsafe_dev_only({
      id: "test",
      agent: agent as any,
    });

    await copilotKitCore.runAgent({ agent: agent as any });

    // Verify the tool was called
    expect(toolHandler).toHaveBeenCalled();
    
    // Verify the placeholder was replaced in agent messages
    const toolMessages = agent.messages.filter((m) => m.role === "tool");
    expect(toolMessages).toHaveLength(1);
    expect(toolMessages[0].content).toBe("Actual Result");
    expect(toolMessages[0].content).not.toBe("Forwarded to client");
  });
});
