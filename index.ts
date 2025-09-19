import "dotenv/config";
import { traceable } from "langsmith/traceable";
import { Client } from "langsmith";

import * as fs from "fs";

const client = new Client({
  debug: true,
});

const longText = fs.readFileSync("demo.txt").toString();

console.log(longText.length);

const mockLLM = traceable(async (messages: Record<string, any>[]) => {
  if (messages.length === 1) {
    return {
      role: "assistant",
      content: "",
      tool_calls: [
        {
          "id": "call_123",
          "type": "function",
          "function": {
            "name": "get_script",
            "arguments": '{"foo": "bar"}'
          }
        }
      ]
    }
  } else {
    return {
      role: "assistant",
      content: "Got long text",
    }
  }
}, {
  run_type: "llm",
  name: 'MockLLM',
});

const mockTool = traceable(async (_input: Record<string, any>) => {
  const reverse = traceable(async () => {
    return longText.toString().split("").reverse().join("")
  }, {
    name: "NestedReverseCall",
  });
  return { reverseCode: await reverse() }
}, {
  run_type: "tool",
  name: "FakeTool"
});

const largeTest = traceable(async (message: Record<string, any>) => {
  const res = await mockLLM([message]);
  const toolRes = await mockTool(res);
  return mockLLM([message, res, toolRes]);
}, {
  client,
  name: "LargeTest"
});

const start = new Date().toISOString();

console.log("STARTING", start);

await largeTest([{
  role: "user",
  content: "call the fake tool"
}]);

await Promise.all(Array.from({ length: 100 }, async () => {
  await largeTest([{
    role: "user",
    content: "call the fake tool"
  }]);
}));

console.log("TRACES SENT IN", new Date().getTime() - new Date(start).getTime(), "ms")

await client.awaitPendingTraceBatches();

const end = new Date().toISOString();

console.log("ENDING", end);

console.log("TIME", new Date(end).getTime() - new Date(start).getTime(), "ms");
