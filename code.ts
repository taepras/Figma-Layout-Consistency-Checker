// This plugin will open a window to prompt the user to enter a number, and
// it will then create that many rectangles on the screen.

// This file holds the main code for the plugins. It has access to the *document*.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (see documentation).

// This shows the HTML page in "ui.html".
figma.showUI(__html__, { width: 500, height: 600 });

let selection: SceneNode[] = [];

const isUnderComponent = function (f: SceneNode) {
  for (let p = f.parent; p && p.type !== "PAGE"; p = p.parent) {
    if (p.type == "COMPONENT" || p.type == "INSTANCE") return true;
  }
  return false;
};

const isUnderInvisibleComponent = function (f: SceneNode) {
  for (let p = f.parent; p && p.type !== "PAGE"; p = p.parent) {
    if (!(p as SceneNode).visible) return true;
  }
  return false;
};

const summarizeSelectedFrames = function () {
  selection = [...figma.currentPage.selection];
  const framesInSelection = selection.filter(
    (n) =>
      n.type == "FRAME" ||
      n.type == "INSTANCE" ||
      n.type == "COMPONENT" ||
      n.type == "SECTION"
  );
  console.log("frames in selection:", framesInSelection);
  console.log(
    "frames in selection (names):",
    framesInSelection.map((n) => n.name)
  );
  let allFrames: FrameNode[] = [];
  framesInSelection.forEach((n) => {
    const frames = (n as FrameNode).findAll(
      (subNode) =>
        subNode.type == "FRAME" ||
        subNode.type == "INSTANCE" ||
        subNode.type == "COMPONENT"
    );
    allFrames = [...allFrames, n as FrameNode];
    allFrames = [...allFrames, ...(frames as FrameNode[])];
  });
  console.log(allFrames);
  const framesWithAutoLayout = allFrames.filter((f) => f.layoutMode != "NONE");

  console.log("frames in selection w/ auto layout:", framesWithAutoLayout);
  console.log(
    "frames in selection w/ auto layout (names):",
    framesWithAutoLayout.map((f) => f.name)
  );

  figma.ui.postMessage(
    framesWithAutoLayout.map((f, i) => ({
      index: i,
      frame: f,
      name: f.name,
      itemSpacing:
        f.primaryAxisAlignItems == "SPACE_BETWEEN" ? "Auto" : f.itemSpacing,
      layoutMode: f.layoutMode,
      paddingTop: f.paddingTop,
      paddingBottom: f.paddingBottom,
      paddingLeft: f.paddingLeft,
      paddingRight: f.paddingRight,
      primaryAxisAlignItems: f.primaryAxisAlignItems,
      isUnderComponent: isUnderComponent(f),
      visible: f.visible && !isUnderInvisibleComponent(f),
      type: f.type,
      cornerRadius: f.cornerRadius == figma.mixed ? "Mixed" : f.cornerRadius,
    }))
  );
};

// Calls to "parent.postMessage" from within the HTML page will trigger this
// callback. The callback will be passed the "pluginMessage" property of the
// posted message.
figma.ui.onmessage = (msg) => {
  console.log("msg", msg);

  // One way of distinguishing between different types of messages sent from
  // your HTML page is to use an object with a "type" property like this.
  if (msg.type === "inspect-auto-layout") {
    summarizeSelectedFrames();
  }

  if (msg.type === "select") {
    const ids: string[] = msg.node.map((n: any) => n.frame.id);
    console.log("select", ids);
    const newSelection = ids.map((id) => figma.getNodeById(id) as SceneNode);
    if (msg.append) {
      figma.currentPage.selection =
        figma.currentPage.selection.concat(newSelection);
    } else {
      figma.currentPage.selection = newSelection;
    }
    figma.viewport.scrollAndZoomIntoView(figma.currentPage.selection);
  }

  if (msg.type === "select-reset") {
    figma.currentPage.selection = selection;
    figma.viewport.scrollAndZoomIntoView(figma.currentPage.selection);
    summarizeSelectedFrames();
  }

  // // Make sure to close the plugin when you're done. Otherwise the plugin will
  // // keep running, which shows the cancel button at the bottom of the screen.
  // figma.closePlugin();
};
