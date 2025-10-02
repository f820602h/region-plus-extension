import {
  FoldingRange,
  FoldingRangeKind,
  window,
  Range,
  OverviewRulerLane,
  Event,
  EventEmitter,
  TreeDataProvider,
  TreeItem,
  TreeItemCollapsibleState,
  Selection,
  TextEditorRevealType,
  workspace,
} from "vscode";
import {
  defineConfigs,
  computed,
  defineExtension,
  useActiveTextEditor,
  useTextEditorSelection,
  useCommand,
  ref,
  useDocumentText,
  useActiveEditorDecorations,
  useFoldingRangeProvider,
} from "reactive-vscode";
import { registerDiagnostics, updateDiagnostics, clearDiagnostics } from "./diagnostics";

function getTextLine(fullText: string, regex: RegExp): number[] {
  const result: number[] = [];
  let match;
  while ((match = regex.exec(fullText))) {
    const startIndex = match.index!;
    const linesBefore = fullText.substring(0, startIndex).split("\n");
    result.push(linesBefore.length - 1);
  }

  return result;
}

export = defineExtension((context) => {
  const { firstLineColor, blockColor } = defineConfigs("region-plus", {
    firstLineColor: "string",
    blockColor: "string",
  });

  registerDiagnostics(context);

  const activeTextEditor = useActiveTextEditor();
  const activeDocument = ref(activeTextEditor.value?.document);
  const editorSelection = useTextEditorSelection(activeTextEditor);

  const regionStartLines = computed<number[]>(() => {
    const textDocument = useDocumentText(activeDocument.value);
    if (!textDocument.value) return [];
    return getTextLine(textDocument.value, new RegExp(/\/\/\s*#region/, "g"));
  });
  const regionEndLines = computed<number[]>(() => {
    const textDocument = useDocumentText(activeDocument.value);
    if (!textDocument.value) return [];
    return getTextLine(textDocument.value, new RegExp(/\/\/\s*#endregion/, "g"));
  });

  const regionRangeSet = computed(() => {
    if (!regionStartLines.value.length || !regionEndLines.value.length) return [];
    const cloneStartLines = [...regionStartLines.value];
    return regionEndLines.value.reduce<number[][]>((acc, end) => {
      if (!cloneStartLines.length) return acc;
      const targetIndex = [...cloneStartLines, end].sort((a, b) => a - b).indexOf(end) - 1;
      const start = cloneStartLines[targetIndex];
      cloneStartLines.splice(targetIndex, 1);
      acc.push([start, end]);
      return acc;
    }, []);
  });

  const regionDecorationRanges = computed(() => {
    if (!activeTextEditor.value) return [];
    const editor = activeTextEditor.value;
    return regionRangeSet.value.map(([start, end]) => {
      const startLine = editor.document?.lineAt?.(start);
      const endLine = editor.document?.lineAt?.(end);
      return {
        line: new Range(startLine.range.start, startLine.range.end),
        block: new Range(startLine.range.start, endLine.range.end),
      };
    });
  });

  const firstLineDecoration = computed(() => ({
    isWholeLine: true,
    backgroundColor: firstLineColor.value,
    overviewRulerColor: firstLineColor.value,
    overviewRulerLane: OverviewRulerLane.Full,
  }));
  const { update: updateFirstLineDecorations } = useActiveEditorDecorations(firstLineDecoration, () =>
    regionDecorationRanges.value.map((range) => range.line)
  );

  const blockDecoration = computed(() => ({
    isWholeLine: true,
    backgroundColor: blockColor.value,
    overviewRulerColor: blockColor.value,
    overviewRulerLane: OverviewRulerLane.Full,
  }));
  const { update: updateBlockDecorations } = useActiveEditorDecorations(blockDecoration, () => {
    return regionDecorationRanges.value
      .map((range) => range.block)
      .filter((range) => range.contains(editorSelection.value));
  });

  useFoldingRangeProvider(
    [
      { language: "javascript", scheme: "file" },
      { language: "vue", scheme: "file" },
    ],
    () => regionRangeSet.value.map(([start, end]) => new FoldingRange(start, end, FoldingRangeKind.Region))
  );

  useCommand("region-plus.jump", (range: Range) => {
    if (!activeTextEditor.value) return;
    const editor = activeTextEditor.value;
    editor.selection = new Selection(range.start, range.start);
    editor.revealRange(range, TextEditorRevealType.InCenter);
  });

  class MyItem extends TreeItem {
    children: MyItem[] = [];

    constructor(label: string, range: Range) {
      super(label, TreeItemCollapsibleState.None);
      this.command = { command: "region-plus.jump", title: "", arguments: [range] };
    }
  }

  class MyTreeDataProvider implements TreeDataProvider<MyItem> {
    private _onDidChangeTreeData: EventEmitter<MyItem | undefined | void> = new EventEmitter<
      MyItem | undefined | void
    >();
    readonly onDidChangeTreeData: Event<MyItem | undefined | void> = this._onDidChangeTreeData.event;

    refresh(): void {
      this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: MyItem): TreeItem {
      return element;
    }

    getChildren(element: MyItem): MyItem[] {
      if (element === undefined) {
        if (!activeTextEditor.value) return [];
        return regionDecorationRanges.value.map((rangeObj) => {
          const line = activeTextEditor.value?.document.lineAt(rangeObj.line.start.line);
          const name = line?.text.replace(/\/\/\s*#region\s*/, "") || "";
          return new MyItem(name, rangeObj.line);
        });
      } else {
        return element.children;
      }
    }
  }

  const treeDataProvider = new MyTreeDataProvider();
  context.subscriptions.push(window.registerTreeDataProvider("region-block", treeDataProvider));

  function update() {
    clearDiagnostics();
    updateFirstLineDecorations();
    updateBlockDecorations();
    treeDataProvider.refresh();

    if (!activeTextEditor.value) return;
    const editor = activeTextEditor.value;

    regionStartLines.value.forEach((line) => {
      if (!regionRangeSet.value.some(([s]) => s === line)) {
        const startLine = editor.document?.lineAt?.(line);
        updateDiagnostics(editor.document, new Range(startLine.range.start, startLine.range.end));
      }
    });
    regionEndLines.value.forEach((line) => {
      if (!regionRangeSet.value.some(([, e]) => e === line)) {
        const endLine = editor.document?.lineAt?.(line);
        updateDiagnostics(editor.document, new Range(endLine.range.start, endLine.range.end));
      }
    });
  }

  context.subscriptions.push(
    workspace.onDidChangeTextDocument((event) => {
      if (event.document === activeTextEditor.value?.document) {
        activeDocument.value = event.document;
        update();
      }
    })
  );

  context.subscriptions.push(
    window.onDidChangeActiveTextEditor((editor) => {
      activeDocument.value = editor?.document;
      update();
    })
  );
});
