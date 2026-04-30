import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  CreateLink,
  ListsToggle,
  MDXEditor,
  type MDXEditorMethods,
  Separator,
  headingsPlugin,
  linkPlugin,
  listsPlugin,
  markdownShortcutPlugin,
  quotePlugin,
  thematicBreakPlugin,
  toolbarPlugin
} from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";
import { useEffect, useRef } from "react";

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

  useEffect(() => {
    if (value === lastSyncedValueRef.current) return;
    editorRef.current?.setMarkdown(value);
    lastSyncedValueRef.current = value;
  }, [value]);

  return (
    <div className="event-form-md-editor" style={{ "--md-editor-height": `${height}px` } as { [key: string]: string }}>
      <MDXEditor
        contentEditableClassName="event-form-mdx-content"
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
          linkPlugin(),
          markdownShortcutPlugin(),
          toolbarPlugin({
            toolbarContents: () => (
              <>
                <BoldItalicUnderlineToggles />
                <Separator />
                <BlockTypeSelect />
                <ListsToggle />
                <Separator />
                <CreateLink />
              </>
            )
          })
        ]}
        ref={editorRef}
      />
    </div>
  );
};
