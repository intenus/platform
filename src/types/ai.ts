import { tools } from "@/ai/tools";
import { IGSIntent, IGSSolution } from "@intenus/common";
import { DataUIPart, InferUITools, UIDataPartSchemas, UIMessage } from "ai";

export type CustomUIMessage = UIMessage<
  CustomMetadata,
  CustomDataPart,
  CustomTools
>;
export type CustomMetadata = unknown;
export type CustomTools = InferUITools<typeof tools>;

export type CustomDataPart = UIDataPartSchemas | DataIntentPart;

export type DataIntentPart = {
  intent: IGSIntent;
  solution: IGSSolution;
};
