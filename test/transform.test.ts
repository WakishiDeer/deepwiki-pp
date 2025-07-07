import { transformUrl } from "../domain/services/transform-url";

describe("transformUrl", () => {
  test("github to deepwiki - extracts owner/repo path", () => {
    expect(transformUrl("https://github.com/PlasmoHQ/examples")).toBe(
      "https://deepwiki.com/PlasmoHQ/examples"
    );
  });

  test("github with complex path to deepwiki - extracts owner/repo", () => {
    expect(
      transformUrl(
        "https://github.com/PlasmoHQ/examples/tree/main/with-content-script"
      )
    ).toBe("https://deepwiki.com/PlasmoHQ/examples");
  });

  test("github microsoft/vscode to deepwiki", () => {
    expect(transformUrl("https://github.com/microsoft/vscode")).toBe(
      "https://deepwiki.com/microsoft/vscode"
    );
  });

  test("deepwiki to github - extracts owner/repo path", () => {
    expect(transformUrl("https://deepwiki.com/microsoft/vscode")).toBe(
      "https://github.com/microsoft/vscode"
    );
  });

  test("deepwiki with documentation path to github - extracts owner/repo", () => {
    expect(
      transformUrl(
        "https://deepwiki.com/microsoft/vscode/1-vs-code-architecture-overview"
      )
    ).toBe("https://github.com/microsoft/vscode");
  });

  test("deepwiki with complex documentation path to github - extracts owner/repo", () => {
    expect(
      transformUrl(
        "https://deepwiki.com/microsoft/vscode/1.2-build-system-and-package-management"
      )
    ).toBe("https://github.com/microsoft/vscode");
  });

  test("github with incomplete path to deepwiki - redirects to deepwiki top", () => {
    expect(transformUrl("https://github.com/microsoft")).toBe(
      "https://deepwiki.com/"
    );
  });

  test("deepwiki with incomplete path to github - redirects to github top", () => {
    expect(transformUrl("https://deepwiki.com/microsoft")).toBe(
      "https://github.com/"
    );
  });

  test("github root to deepwiki - redirects to deepwiki top", () => {
    expect(transformUrl("https://github.com/")).toBe("https://deepwiki.com/");
  });

  test("deepwiki root to github - redirects to github top", () => {
    expect(transformUrl("https://deepwiki.com/")).toBe("https://github.com/");
  });

  test("unsupported host", () => {
    expect(transformUrl("https://example.com/foo")).toBeNull();
  });
});
