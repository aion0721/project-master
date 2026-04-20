import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { mockProjectApi } from "../../test/mockProjectApi";
import { renderWithProviders } from "../../test/renderWithProviders";
import { CrossProjectViewPage } from "./CrossProjectViewPage";
import styles from "./CrossProjectViewPage.module.css";

async function openFilterPanel() {
  const toggleButton = await screen.findByRole("button", {
    name: "絞り込みを表示",
  });
  fireEvent.click(toggleButton);
  await screen.findByText("状態フィルター");
}

describe("CrossProjectViewPage", () => {
  it("横断ビューと週表示データを表示する", async () => {
    mockProjectApi();

    renderWithProviders(<CrossProjectViewPage />, {
      initialEntries: ["/cross-project"],
    });

    expect(
      await screen.findByRole("heading", { name: "横断案件ビュー" }),
    ).toBeInTheDocument();
    expect(screen.getByText("基幹会計刷新")).toBeInTheDocument();
    expect(screen.getByText("表示案件数")).toBeInTheDocument();
    expect(
      screen.getByTestId("cross-project-event-PRJ-001-ev-p1-1"),
    ).toHaveTextContent("環境提供");
    expect(screen.queryByText("PRJ-001")).not.toBeInTheDocument();
  });

  it("ブックマーク表示と検索で案件を絞り込める", async () => {
    mockProjectApi();
    window.localStorage.setItem("project-master:user-id", "m1");

    renderWithProviders(<CrossProjectViewPage />, {
      initialEntries: ["/cross-project"],
    });

    await openFilterPanel();
    expect(
      await screen.findByText("田中 さんのブックマーク 2 件"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "ブックマーク" }));

    await waitFor(() => {
      expect(screen.getByText("基幹会計刷新")).toBeInTheDocument();
      expect(screen.queryByText("営業管理BI改善")).not.toBeInTheDocument();
    });

    fireEvent.change(
      screen.getByLabelText("プロジェクト番号または案件名でフィルター"),
      {
        target: { value: "PRJ-005" },
      },
    );

    await waitFor(() => {
      expect(screen.getByText("販売促進モバイル連携")).toBeInTheDocument();
      expect(screen.queryByText("基幹会計刷新")).not.toBeInTheDocument();
    });
  });

  it("状態フィルターを開いて案件を絞り込める", async () => {
    mockProjectApi();

    renderWithProviders(<CrossProjectViewPage />, {
      initialEntries: ["/cross-project"],
    });

    await screen.findByRole("heading", { name: "横断案件ビュー" });

    await openFilterPanel();
    fireEvent.click(screen.getByRole("checkbox", { name: "完了" }));

    await waitFor(() => {
      expect(screen.queryByText("営業管理BI改善")).not.toBeInTheDocument();
      expect(screen.getByText("基幹会計刷新")).toBeInTheDocument();
      expect(screen.getByText("販売促進モバイル連携")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("checkbox", { name: "未着手" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "進行中" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "遅延" }));

    await waitFor(() => {
      expect(screen.getByText("条件に一致する案件はありません")).toBeInTheDocument();
      expect(screen.queryByText("基幹会計刷新")).not.toBeInTheDocument();
      expect(screen.queryByText("社内ポータル刷新")).not.toBeInTheDocument();
      expect(screen.queryByText("販促モバイル連携強化")).not.toBeInTheDocument();
    });
  });

  it("状態フィルターの既定値を保存できる", async () => {
    mockProjectApi();
    window.localStorage.setItem("project-master:user-id", "m1");

    const view = renderWithProviders(<CrossProjectViewPage />, {
      initialEntries: ["/cross-project"],
    });

    await openFilterPanel();
    expect(
      await screen.findByText("田中 さんのブックマーク 2 件"),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox", { name: "未着手" }));
    await waitFor(() => {
      expect(screen.getByRole("checkbox", { name: "未着手" })).not.toBeChecked();
    });
    fireEvent.click(
      screen.getByRole("button", { name: "この状態を既定値に保存" }),
    );

    await waitFor(() => {
      expect(
        screen.getByText("現在の状態フィルターを既定値として保存しました。"),
      ).toBeInTheDocument();
    });

    view.unmount();

    renderWithProviders(<CrossProjectViewPage />, {
      initialEntries: ["/cross-project"],
    });

    expect(
      await screen.findByRole("heading", { name: "横断案件ビュー" }),
    ).toBeInTheDocument();

    await openFilterPanel();
    await waitFor(() => {
      expect(screen.getByRole("checkbox", { name: "未着手" })).not.toBeChecked();
      expect(screen.getByRole("checkbox", { name: "完了" })).toBeChecked();
    });
  });

  it("報告対象ありの案件セルを強調表示できる", async () => {
    mockProjectApi();

    renderWithProviders(<CrossProjectViewPage />, {
      initialEntries: ["/cross-project"],
    });

    await screen.findByRole("heading", { name: "横断案件ビュー" });

    expect(
      screen.getByTestId("cross-project-project-info-PRJ-001").closest("td"),
    ).toHaveClass(styles.stickyColumnAlert);
    expect(
      screen.getByTestId("cross-project-project-info-PRJ-004").closest("td"),
    ).not.toHaveClass(styles.stickyColumnAlert);
  });

  it("タイムラインのツールバーから表示切替できる", async () => {
    mockProjectApi();

    renderWithProviders(<CrossProjectViewPage />, {
      initialEntries: ["/cross-project"],
    });

    await screen.findByRole("heading", { name: "横断案件ビュー" });

    fireEvent.click(screen.getByRole("button", { name: "体制: OFF" }));

    await waitFor(() => {
      expect(
        screen.getByTestId("cross-project-structure-PRJ-001-as-p1-1"),
      ).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("button", { name: "システムグルーピング: OFF" }),
    );

    await waitFor(() => {
      expect(
        screen.getByTestId("cross-project-group-sys-accounting / 会計基盤"),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByTestId("cross-project-group-sys-accounting / 会計基盤"),
    ).toHaveClass(styles.stickyColumn);
  });

  it("主システムのクエリで案件を絞り込める", async () => {
    mockProjectApi();

    renderWithProviders(<CrossProjectViewPage />, {
      initialEntries: ["/cross-project?systemId=sys-accounting"],
    });

    await openFilterPanel();
    expect(
      await screen.findByText("主システム絞り込み中: sys-accounting / 会計基盤"),
    ).toBeInTheDocument();
    expect(screen.getByText("基幹会計刷新")).toBeInTheDocument();
    expect(screen.queryByText("営業管理BI改善")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "解除" })).toHaveAttribute(
      "href",
      "/cross-project",
    );
  });

  it("初回表示時に今週列の位置まで自動スクロールする", async () => {
    mockProjectApi();

    const scrollTo = vi.fn();
    const originalOffsetLeft = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      "offsetLeft",
    );
    const originalOffsetWidth = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      "offsetWidth",
    );
    const originalScrollTo = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      "scrollTo",
    );

    Object.defineProperty(HTMLElement.prototype, "offsetLeft", {
      configurable: true,
      get() {
        const testId = this.getAttribute?.("data-testid") ?? "";
        return testId.startsWith("cross-project-current-week-") ? 520 : 0;
      },
    });
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
      configurable: true,
      get() {
        return this.classList?.contains(styles.stickyColumn) ? 280 : 0;
      },
    });
    Object.defineProperty(HTMLElement.prototype, "scrollTo", {
      configurable: true,
      value: scrollTo,
    });

    try {
      renderWithProviders(<CrossProjectViewPage />, {
        initialEntries: ["/cross-project"],
      });

      await screen.findByTestId("cross-project-table-wrap");

      await waitFor(() => {
        expect(scrollTo).toHaveBeenCalledWith({
          behavior: "smooth",
          left: 216,
        });
      });
    } finally {
      if (originalOffsetLeft) {
        Object.defineProperty(
          HTMLElement.prototype,
          "offsetLeft",
          originalOffsetLeft,
        );
      }
      if (originalOffsetWidth) {
        Object.defineProperty(
          HTMLElement.prototype,
          "offsetWidth",
          originalOffsetWidth,
        );
      }
      if (originalScrollTo) {
        Object.defineProperty(
          HTMLElement.prototype,
          "scrollTo",
          originalScrollTo,
        );
      }
    }
  });

  it("月表示に切り替えると今月列と月単位イベントを表示する", async () => {
    mockProjectApi();

    renderWithProviders(<CrossProjectViewPage />, {
      initialEntries: ["/cross-project"],
    });

    await screen.findByRole("heading", { name: "横断案件ビュー" });
    fireEvent.click(screen.getByRole("button", { name: "月表示" }));

    expect(screen.getByText("今月")).toBeInTheDocument();
    expect(screen.getByText("2026/4")).toBeInTheDocument();
    expect(screen.getByText("今月").closest("th")).toHaveAttribute(
      "data-testid",
      "cross-project-current-month-2",
    );
    expect(
      screen.getByTestId("cross-project-event-PRJ-001-ev-p1-1"),
    ).toHaveTextContent("環境提供");
  });

  it("詳細表示ONのときだけプロジェクト番号を表示する", async () => {
    mockProjectApi();

    renderWithProviders(<CrossProjectViewPage />, {
      initialEntries: ["/cross-project"],
    });

    await screen.findByRole("heading", { name: "横断案件ビュー" });
    expect(screen.queryByText("PRJ-001")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "詳細表示: OFF" }));

    await waitFor(() => {
      expect(screen.getByText("PRJ-001")).toBeInTheDocument();
    });
  });
});
