import { useEffect, useMemo, useState, type RefObject } from "react";

interface UseVirtualWindowParams {
  containerRef: RefObject<HTMLElement | null>;
  itemCount: number;
  getItemSize: (index: number) => number;
  overscan?: number;
}

interface VirtualWindowResult {
  endIndex: number;
  paddingBottom: number;
  paddingTop: number;
  startIndex: number;
}

function findStartIndex(offsets: number[], value: number) {
  let low = 0;
  let high = offsets.length - 1;

  while (low < high) {
    const mid = Math.floor((low + high + 1) / 2);

    if (offsets[mid] <= value) {
      low = mid;
    } else {
      high = mid - 1;
    }
  }

  return low;
}

function findEndIndex(offsets: number[], sizes: number[], value: number) {
  let low = 0;
  let high = sizes.length - 1;

  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    const itemEnd = offsets[mid] + sizes[mid];

    if (itemEnd < value) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  return low;
}

export function useVirtualWindow({
  containerRef,
  itemCount,
  getItemSize,
  overscan = 6,
}: UseVirtualWindowParams): VirtualWindowResult {
  const [viewport, setViewport] = useState({ height: 0, scrollTop: 0 });

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const updateViewport = () => {
      setViewport({
        height: container.clientHeight,
        scrollTop: container.scrollTop,
      });
    };

    updateViewport();
    container.addEventListener("scroll", updateViewport, { passive: true });
    window.addEventListener("resize", updateViewport);

    return () => {
      container.removeEventListener("scroll", updateViewport);
      window.removeEventListener("resize", updateViewport);
    };
  }, [containerRef]);

  const { offsets, sizes, totalSize } = useMemo(() => {
    const nextSizes = Array.from({ length: itemCount }, (_, index) =>
      getItemSize(index),
    );
    const nextOffsets = Array.from({ length: itemCount }, () => 0);
    let runningOffset = 0;

    nextSizes.forEach((size, index) => {
      nextOffsets[index] = runningOffset;
      runningOffset += size;
    });

    return {
      offsets: nextOffsets,
      sizes: nextSizes,
      totalSize: runningOffset,
    };
  }, [getItemSize, itemCount]);

  if (itemCount === 0) {
    return {
      startIndex: 0,
      endIndex: -1,
      paddingTop: 0,
      paddingBottom: 0,
    };
  }

  const visibleStart = Math.max(0, viewport.scrollTop);
  const visibleEnd = visibleStart + viewport.height;
  const rawStartIndex = findStartIndex(offsets, visibleStart);
  const rawEndIndex = findEndIndex(offsets, sizes, visibleEnd);
  const startIndex = Math.max(0, rawStartIndex - overscan);
  const endIndex = Math.min(itemCount - 1, rawEndIndex + overscan);
  const paddingTop = offsets[startIndex] ?? 0;
  const renderedSize =
    endIndex >= startIndex
      ? offsets[endIndex] + sizes[endIndex] - paddingTop
      : 0;
  const paddingBottom = Math.max(
    0,
    totalSize - paddingTop - renderedSize,
  );

  return {
    startIndex,
    endIndex,
    paddingTop,
    paddingBottom,
  };
}
