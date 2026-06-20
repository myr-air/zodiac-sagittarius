interface InlineOptionPickerAnchorRect {
  bottom: number;
  left: number;
  top: number;
  width: number;
}

interface InlineOptionPickerViewport {
  height: number;
  width: number;
}

const menuMargin = 8;
const menuGap = 6;
const menuRowHeight = 34;
const maxMenuHeight = 260;
const minMenuWidth = 180;

export function inlineOptionPickerMenuHeight(optionCount: number): number {
  return Math.min(maxMenuHeight, optionCount * menuRowHeight + menuMargin);
}

export function inlineOptionPickerMenuPosition({
  anchorRect,
  optionCount,
  viewport,
}: {
  anchorRect: InlineOptionPickerAnchorRect;
  optionCount: number;
  viewport: InlineOptionPickerViewport;
}) {
  const menuHeight = inlineOptionPickerMenuHeight(optionCount);
  const menuWidth = Math.max(anchorRect.width, minMenuWidth);
  const spaceBelow = viewport.height - anchorRect.bottom - menuMargin;

  return {
    left: Math.min(
      Math.max(menuMargin, anchorRect.left),
      Math.max(menuMargin, viewport.width - menuWidth - menuMargin),
    ),
    top:
      spaceBelow >= menuHeight
        ? anchorRect.bottom + menuGap
        : Math.max(menuMargin, anchorRect.top - menuHeight - menuGap),
    width: menuWidth,
  };
}

export function inlineOptionPickerSideMenuPosition({
  activeIndex,
  menuLeft,
  menuTop,
  menuWidth,
  sideOptionCount,
  sideMenuWidth,
  viewport,
}: {
  activeIndex: number;
  menuLeft: number;
  menuTop: number;
  menuWidth: number;
  sideOptionCount: number;
  sideMenuWidth: number;
  viewport: InlineOptionPickerViewport;
}) {
  const right = menuLeft + menuWidth + menuGap;
  const left = menuLeft - sideMenuWidth - menuGap;

  return {
    left:
      right + sideMenuWidth <= viewport.width - menuMargin
        ? right
        : left >= menuMargin
          ? left
          : Math.max(menuMargin, viewport.width - sideMenuWidth - menuMargin),
    top: Math.min(
      Math.max(menuMargin, menuTop + activeIndex * menuRowHeight),
      Math.max(
        menuMargin,
        viewport.height -
          inlineOptionPickerMenuHeight(sideOptionCount) -
          menuMargin,
      ),
    ),
  };
}
