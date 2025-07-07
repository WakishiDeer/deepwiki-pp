// Message types for communication between extension components
export interface SwitchTabMessage {
  action: "switchTab";
  tabId: number;
}

export interface CheckCanSwitchMessage {
  action: "checkCanSwitch";
  url: string;
}

export type Message = SwitchTabMessage | CheckCanSwitchMessage;
