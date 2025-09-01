import {
  type ProviderResult,
  FoldingRange,
  FoldingRangeKind,
  languages,
  window,
  Range,
  OverviewRulerLane,
} from "vscode";
import {
  defineConfigs,
  computed,
  defineExtension,
  useActiveTextEditor,
  useTextEditorSelection,
  watchEffect,
} from "reactive-vscode";

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

  const regionStartLineDecoration = window.createTextEditorDecorationType({
    isWholeLine: true,
    backgroundColor: firstLineColor.value,
    overviewRulerColor: firstLineColor.value,
    overviewRulerLane: OverviewRulerLane.Full,
  });

  const regionBlockDecoration = window.createTextEditorDecorationType({
    isWholeLine: true,
    backgroundColor: blockColor.value,
    overviewRulerColor: blockColor.value,
    overviewRulerLane: OverviewRulerLane.Full,
  });

  const activeTextEditor = useActiveTextEditor();

  const regionStartLines = computed<number[]>(() => {
    if (!activeTextEditor.value) return [];
    return getTextLine(activeTextEditor.value.document.getText(), new RegExp(/\/\/\s*#region/, "g"));
  });
  const regionEndLines = computed<number[]>(() => {
    if (!activeTextEditor.value) return [];
    return getTextLine(activeTextEditor.value.document.getText(), new RegExp(/\/\/\s*#endregion/, "g"));
  });

  const regionRangeSet = computed(() => {
    if (!regionStartLines.value.length || !regionEndLines.value.length) return [];
    const cloneStartLines = [...regionStartLines.value];
    return regionEndLines.value.reduce<number[][]>((acc, end) => {
      const start = cloneStartLines[[...cloneStartLines, end].sort((a, b) => a - b).indexOf(end) - 1];
      cloneStartLines.splice(start, 1);
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

  function updateRegionStartLineDecorations() {
    if (!activeTextEditor.value) return;
    const editor = activeTextEditor.value;
    editor.setDecorations(
      regionStartLineDecoration,
      regionDecorationRanges.value.map((range) => range.line)
    );
  }

  function updateRegionBlockDecorations() {
    if (!activeTextEditor.value) return;
    const editor = activeTextEditor.value;
    const editorSelection = useTextEditorSelection(editor);
    editor.setDecorations(
      regionBlockDecoration,
      regionDecorationRanges.value.map((range) => range.block).filter((range) => range.contains(editorSelection.value))
    );
  }

  context.subscriptions.push(
    languages.registerFoldingRangeProvider(
      [
        { language: "javascript", scheme: "file" },
        { language: "vue", scheme: "file" },
      ],
      {
        provideFoldingRanges(): ProviderResult<FoldingRange[]> {
          return regionRangeSet.value.map(([start, end]) => new FoldingRange(start, end, FoldingRangeKind.Region));
        },
      }
    )
  );



  watchEffect(() => {
    updateRegionStartLineDecorations();
    updateRegionBlockDecorations();
  });
});
