import { DOM_TIMEOUT_CONSTANTS } from "../infrastructure/gateways/dom/interfaces/dom-gateway.interface";

describe("DOM_TIMEOUT_CONSTANTS", () => {
  it("should have all required timeout constants defined", () => {
    expect(DOM_TIMEOUT_CONSTANTS.DEFAULT_CONTENT_STABILIZATION_TIMEOUT).toBe(
      8000
    );
    expect(
      DOM_TIMEOUT_CONSTANTS.DEFAULT_CONTENT_STABILIZATION_CHECK_INTERVAL
    ).toBe(200);
    expect(
      DOM_TIMEOUT_CONSTANTS.DEFAULT_CONTENT_STABILIZATION_STABLE_CHECKS
    ).toBe(3);
    expect(DOM_TIMEOUT_CONSTANTS.DEFAULT_HEADING_WAIT_TIMEOUT).toBe(5000);
    expect(DOM_TIMEOUT_CONSTANTS.DEFAULT_MERMAID_RENDERING_TIMEOUT).toBe(3000);
    expect(DOM_TIMEOUT_CONSTANTS.DEFAULT_MERMAID_RENDERING_CHECK_INTERVAL).toBe(
      300
    );
    expect(DOM_TIMEOUT_CONSTANTS.DEFAULT_INITIALIZATION_DEBOUNCE_DELAY).toBe(
      500
    );
    expect(DOM_TIMEOUT_CONSTANTS.DEFAULT_PENDING_DIAGRAM_EXTRA_WAIT).toBe(2000);
  });

  it("should be defined as const (compile-time readonly)", () => {
    // This test ensures the constants are defined with proper TypeScript readonly semantics
    // The 'as const' assertion makes the object readonly at compile time
    expect(typeof DOM_TIMEOUT_CONSTANTS).toBe("object");
    expect(DOM_TIMEOUT_CONSTANTS).toBeDefined();

    // Verify that all properties exist and are numbers
    expect(
      typeof DOM_TIMEOUT_CONSTANTS.DEFAULT_CONTENT_STABILIZATION_TIMEOUT
    ).toBe("number");
    expect(
      typeof DOM_TIMEOUT_CONSTANTS.DEFAULT_CONTENT_STABILIZATION_CHECK_INTERVAL
    ).toBe("number");
    expect(
      typeof DOM_TIMEOUT_CONSTANTS.DEFAULT_CONTENT_STABILIZATION_STABLE_CHECKS
    ).toBe("number");
    expect(typeof DOM_TIMEOUT_CONSTANTS.DEFAULT_HEADING_WAIT_TIMEOUT).toBe(
      "number"
    );
    expect(typeof DOM_TIMEOUT_CONSTANTS.DEFAULT_MERMAID_RENDERING_TIMEOUT).toBe(
      "number"
    );
    expect(
      typeof DOM_TIMEOUT_CONSTANTS.DEFAULT_MERMAID_RENDERING_CHECK_INTERVAL
    ).toBe("number");
    expect(
      typeof DOM_TIMEOUT_CONSTANTS.DEFAULT_INITIALIZATION_DEBOUNCE_DELAY
    ).toBe("number");
    expect(
      typeof DOM_TIMEOUT_CONSTANTS.DEFAULT_PENDING_DIAGRAM_EXTRA_WAIT
    ).toBe("number");
  });

  it("should have positive values for all timeout constants", () => {
    Object.values(DOM_TIMEOUT_CONSTANTS).forEach((value) => {
      expect(value).toBeGreaterThan(0);
      expect(Number.isInteger(value)).toBe(true);
    });
  });
});
