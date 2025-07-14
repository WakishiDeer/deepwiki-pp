// Domain entity for tab switching settings
export interface TabSwitchSettings {
  host1: string;
  host2: string;
}

export const DEFAULT_SETTINGS: TabSwitchSettings = {
  host1: "github.com",
  host2: "deepwiki.com",
};
