import {
  getNodesBounds,
  getViewportForBounds,
  type Node,
} from "@xyflow/react";

interface ReactFlowPdfExportOptions<NodeType extends Node> {
  bounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  extraBoundsSelector?: string;
  fileName: string;
  flowContainer: HTMLDivElement;
  nodes: NodeType[];
}

const exportPadding = 32;
const exportPixelRatio = 2;
const exportBackgroundColor = "#f8fafc";

export async function exportReactFlowToPdf<NodeType extends Node>({
  bounds,
  extraBoundsSelector,
  fileName,
  flowContainer,
  nodes,
}: ReactFlowPdfExportOptions<NodeType>) {
  if (nodes.length === 0) {
    throw new Error("PDF 出力の準備ができていません。");
  }

  const reactFlowElement = flowContainer.querySelector<HTMLElement>(".react-flow");
  const viewportElement =
    flowContainer.querySelector<HTMLElement>(".react-flow__viewport");
  const backgroundElement =
    flowContainer.querySelector<SVGElement>(".react-flow__background");

  if (!reactFlowElement || !viewportElement) {
    throw new Error("PDF 出力の準備ができていません。");
  }

  const exportBounds = bounds ?? getNodesBounds(nodes);
  const extraBounds = extraBoundsSelector
    ? Array.from(
        flowContainer.querySelectorAll<HTMLElement>(extraBoundsSelector),
      )
        .map((element) => ({
          x: element.offsetLeft,
          y: element.offsetTop,
          width: element.offsetWidth,
          height: element.offsetHeight,
        }))
        .filter((bound) => bound.width > 0 && bound.height > 0)
    : [];
  const minX = Math.min(exportBounds.x, ...extraBounds.map((bound) => bound.x));
  const minY = Math.min(exportBounds.y, ...extraBounds.map((bound) => bound.y));
  const maxX = Math.max(
    exportBounds.x + exportBounds.width,
    ...extraBounds.map((bound) => bound.x + bound.width),
  );
  const maxY = Math.max(
    exportBounds.y + exportBounds.height,
    ...extraBounds.map((bound) => bound.y + bound.height),
  );
  const exportWidth = Math.max(
    Math.ceil(maxX - minX + exportPadding * 2),
    1,
  );
  const exportHeight = Math.max(
    Math.ceil(maxY - minY + exportPadding * 2),
    1,
  );
  const exportViewport = getViewportForBounds(
    {
      x: minX - exportPadding,
      y: minY - exportPadding,
      width: Math.max(maxX - minX + exportPadding * 2, 1),
      height: Math.max(maxY - minY + exportPadding * 2, 1),
    },
    exportWidth,
    exportHeight,
    1,
    1,
    0,
  );
  const previousFlowStyle = {
    width: reactFlowElement.style.width,
    height: reactFlowElement.style.height,
    background: reactFlowElement.style.background,
  };
  const previousViewportStyle = {
    width: viewportElement.style.width,
    height: viewportElement.style.height,
    transform: viewportElement.style.transform,
  };
  const previousBackgroundStyle = backgroundElement
    ? {
        width: backgroundElement.style.width,
        height: backgroundElement.style.height,
      }
    : null;

  const { toPng } = await import("html-to-image");
  const { jsPDF } = await import("jspdf");

  try {
    reactFlowElement.style.width = `${exportWidth}px`;
    reactFlowElement.style.height = `${exportHeight}px`;
    reactFlowElement.style.background = exportBackgroundColor;
    viewportElement.style.width = `${exportWidth}px`;
    viewportElement.style.height = `${exportHeight}px`;
    viewportElement.style.transform = `translate(${exportViewport.x}px, ${exportViewport.y}px) scale(${exportViewport.zoom})`;

    if (backgroundElement) {
      backgroundElement.style.width = `${exportWidth}px`;
      backgroundElement.style.height = `${exportHeight}px`;
    }

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });

    const imageDataUrl = await toPng(reactFlowElement, {
      backgroundColor: exportBackgroundColor,
      cacheBust: true,
      canvasWidth: exportWidth * exportPixelRatio,
      canvasHeight: exportHeight * exportPixelRatio,
      pixelRatio: 1,
      filter: (domNode) => {
        const classList = "classList" in domNode ? domNode.classList : null;

        return !(
          classList?.contains("react-flow__controls") ||
          classList?.contains("react-flow__attribution")
        );
      },
    });

    const pdf = new jsPDF({
      orientation: exportWidth >= exportHeight ? "landscape" : "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const availableWidth = pageWidth - margin * 2;
    const availableHeight = pageHeight - margin * 2;
    const imageRatio = exportWidth / exportHeight;
    let renderWidth = availableWidth;
    let renderHeight = renderWidth / imageRatio;

    if (renderHeight > availableHeight) {
      renderHeight = availableHeight;
      renderWidth = renderHeight * imageRatio;
    }

    pdf.addImage(
      imageDataUrl,
      "PNG",
      (pageWidth - renderWidth) / 2,
      (pageHeight - renderHeight) / 2,
      renderWidth,
      renderHeight,
    );
    pdf.save(fileName);
  } finally {
    reactFlowElement.style.width = previousFlowStyle.width;
    reactFlowElement.style.height = previousFlowStyle.height;
    reactFlowElement.style.background = previousFlowStyle.background;
    viewportElement.style.width = previousViewportStyle.width;
    viewportElement.style.height = previousViewportStyle.height;
    viewportElement.style.transform = previousViewportStyle.transform;

    if (backgroundElement && previousBackgroundStyle) {
      backgroundElement.style.width = previousBackgroundStyle.width;
      backgroundElement.style.height = previousBackgroundStyle.height;
    }
  }
}
