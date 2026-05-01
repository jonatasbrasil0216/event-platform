import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  CodeToggle,
  CreateLink,
  DiffSourceToggleWrapper,
  InsertCodeBlock,
  ListsToggle,
  MDXEditor,
  type MDXEditorMethods,
  Separator,
  codeBlockPlugin,
  codeMirrorPlugin,
  diffSourcePlugin,
  headingsPlugin,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  markdownShortcutPlugin,
  quotePlugin,
  thematicBreakPlugin,
  toolbarPlugin
} from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";
import { useEffect, useRef } from "react";
import { useIsMobile } from "../hooks/useIsMobile";
import styles from "./MarkdownEditorField.module.css";

interface MarkdownEditorFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  height?: number;
}

export const MarkdownEditorField = ({
  value,
  onChange,
  placeholder = "Write here...",
  maxLength = 2000,
  height = 200
}: MarkdownEditorFieldProps) => {
  const editorRef = useRef<MDXEditorMethods | null>(null);
  const lastSyncedValueRef = useRef(value);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (value === lastSyncedValueRef.current) return;
    editorRef.current?.setMarkdown(value);
    lastSyncedValueRef.current = value;
  }, [value]);

  return (
    <div
      className={styles.mdEditor}
      style={{ "--md-editor-height": `${height}px` } as { [key: string]: string }}
    >
      <MDXEditor
        contentEditableClassName={styles.mdxContent}
        markdown={value}
        onChange={(nextValue) => {
          const limitedValue = nextValue.slice(0, maxLength);
          lastSyncedValueRef.current = limitedValue;
          onChange(limitedValue);
        }}
        placeholder={placeholder}
        plugins={[
          headingsPlugin(),
          listsPlugin(),
          quotePlugin(),
          thematicBreakPlugin(),
          codeBlockPlugin({ defaultCodeBlockLanguage: "text" }),
          codeMirrorPlugin({
            codeBlockLanguages: {
              text: "Plain text",
              js: "JavaScript",
              jsx: "JSX",
              ts: "TypeScript",
              tsx: "TSX",
              json: "JSON",
              css: "CSS",
              html: "HTML",
              bash: "Bash"
            }
          }),
          linkPlugin(),
          linkDialogPlugin(),
          diffSourcePlugin({ viewMode: "rich-text", diffMarkdown: "" }),
          markdownShortcutPlugin(),
          toolbarPlugin({
            toolbarContents: () => (
              <>
                <DiffSourceToggleWrapper
                  options={["rich-text", "source"]}
                  SourceToolbar={<div className={styles.sourceModeLabel}>Source mode</div>}
                >
                  <>
                    <BoldItalicUnderlineToggles />
                    <CodeToggle />
                    <Separator />
                    <BlockTypeSelect />
                    {!isMobile && (
                      <>
                        <ListsToggle />
                        <Separator />
                        <InsertCodeBlock />
                        <Separator />
                        <CreateLink />
                      </>
                    )}
                  </>
                </DiffSourceToggleWrapper>
              </>
            )
          })
        ]}
        ref={editorRef}
      />
    </div>
  );
};
