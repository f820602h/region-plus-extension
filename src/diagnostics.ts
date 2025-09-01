import {
  type DiagnosticCollection,
  type Range,
  languages,
  Diagnostic,
  DiagnosticSeverity,
  TextDocument,
  ExtensionContext,
} from "vscode";

let collection: DiagnosticCollection;

export function registerDiagnostics(context: ExtensionContext) {
  context.subscriptions.push((collection = languages.createDiagnosticCollection("region-plus")));
}

export function updateDiagnostics(doc: TextDocument, range: Range) {
  const diagnostics: Diagnostic[] = [...(collection.get(doc.uri) || [])];
  const diagnostic = new Diagnostic(range, `Region block not closed completely.`, DiagnosticSeverity.Warning);
  diagnostics.push(diagnostic);
  collection.set(doc.uri, diagnostics);
}

export function clearDiagnostics() {
  collection.clear();
}
