import {
  AddHeadingSectionInput,
  GetHeadingSectionsInput,
} from "../application/usecases/heading-collection";

// Message types for communication between extension components
export interface SwitchTabMessage {
  action: "switchTab";
  tabId: number;
}

export interface CheckCanSwitchMessage {
  action: "checkCanSwitch";
  url: string;
}

export interface AddHeadingSectionMessage {
  action: "addHeadingSection";
  headingSection: AddHeadingSectionInput;
}

export interface GetHeadingSectionsMessage {
  action: "getHeadingSections";
  input?: GetHeadingSectionsInput;
}

export interface ClearAllHeadingSectionsMessage {
  action: "clearAllHeadingSections";
}

export interface RemoveHeadingSectionMessage {
  action: "removeHeadingSection";
  sectionId: string;
}

export type Message =
  | SwitchTabMessage
  | CheckCanSwitchMessage
  | AddHeadingSectionMessage
  | GetHeadingSectionsMessage
  | ClearAllHeadingSectionsMessage
  | RemoveHeadingSectionMessage;
