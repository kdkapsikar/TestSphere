import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import TextStyle from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Quote, 
  Undo, 
  Redo,
  Table as TableIcon,
  Type,
  Minus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({ content, onChange, placeholder = "Enter text...", className }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      TextStyle,
      FontFamily.configure({
        types: ['textStyle'],
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[120px] p-3',
      },
    },
  });

  if (!editor) {
    return null;
  }

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const deleteTable = () => {
    editor.chain().focus().deleteTable().run();
  };

  const addColumnBefore = () => {
    editor.chain().focus().addColumnBefore().run();
  };

  const addColumnAfter = () => {
    editor.chain().focus().addColumnAfter().run();
  };

  const deleteColumn = () => {
    editor.chain().focus().deleteColumn().run();
  };

  const addRowBefore = () => {
    editor.chain().focus().addRowBefore().run();
  };

  const addRowAfter = () => {
    editor.chain().focus().addRowAfter().run();
  };

  const deleteRow = () => {
    editor.chain().focus().deleteRow().run();
  };

  const setFontSize = (size: string) => {
    if (size === 'default') {
      editor.chain().focus().unsetFontSize().run();
    } else {
      editor.chain().focus().setFontSize(size).run();
    }
  };

  const setFontFamily = (family: string) => {
    if (family === 'default') {
      editor.chain().focus().unsetFontFamily().run();
    } else {
      editor.chain().focus().setFontFamily(family).run();
    }
  };

  return (
    <div className={cn("border border-input rounded-md", className)}>
      {/* Toolbar */}
      <div className="border-b border-border p-2 flex items-center gap-1 flex-wrap">
        {/* Text Formatting */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive('bold') ? 'bg-accent' : ''
          )}
          data-testid="button-bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive('italic') ? 'bg-accent' : ''
          )}
          data-testid="button-italic"
        >
          <Italic className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Font Family */}
        <Select onValueChange={setFontFamily}>
          <SelectTrigger className="h-8 w-32 text-xs" data-testid="select-font-family">
            <SelectValue placeholder="Font" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default</SelectItem>
            <SelectItem value="Inter">Inter</SelectItem>
            <SelectItem value="Arial">Arial</SelectItem>
            <SelectItem value="Georgia">Georgia</SelectItem>
            <SelectItem value="Times New Roman">Times</SelectItem>
            <SelectItem value="Courier New">Courier</SelectItem>
          </SelectContent>
        </Select>

        {/* Font Size */}
        <Select onValueChange={setFontSize}>
          <SelectTrigger className="h-8 w-20 text-xs" data-testid="select-font-size">
            <SelectValue placeholder="Size" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default</SelectItem>
            <SelectItem value="12px">12px</SelectItem>
            <SelectItem value="14px">14px</SelectItem>
            <SelectItem value="16px">16px</SelectItem>
            <SelectItem value="18px">18px</SelectItem>
            <SelectItem value="20px">20px</SelectItem>
            <SelectItem value="24px">24px</SelectItem>
          </SelectContent>
        </Select>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Lists */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive('bulletList') ? 'bg-accent' : ''
          )}
          data-testid="button-bullet-list"
        >
          <List className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive('orderedList') ? 'bg-accent' : ''
          )}
          data-testid="button-ordered-list"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive('blockquote') ? 'bg-accent' : ''
          )}
          data-testid="button-blockquote"
        >
          <Quote className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Table Controls */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={insertTable}
          className="h-8 w-8 p-0"
          data-testid="button-insert-table"
        >
          <TableIcon className="h-4 w-4" />
        </Button>

        {editor.isActive('table') && (
          <>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={addColumnBefore}
              className="h-8 px-2 text-xs"
              data-testid="button-add-column-before"
            >
              +Col
            </Button>
            
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={addRowBefore}
              className="h-8 px-2 text-xs"
              data-testid="button-add-row-before"
            >
              +Row
            </Button>
            
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={deleteColumn}
              className="h-8 px-2 text-xs text-destructive"
              data-testid="button-delete-column"
            >
              -Col
            </Button>
            
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={deleteRow}
              className="h-8 px-2 text-xs text-destructive"
              data-testid="button-delete-row"
            >
              -Row
            </Button>
            
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={deleteTable}
              className="h-8 px-2 text-xs text-destructive"
              data-testid="button-delete-table"
            >
              Del Table
            </Button>
          </>
        )}

        <div className="w-px h-6 bg-border mx-1" />

        {/* Undo/Redo */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="h-8 w-8 p-0"
          data-testid="button-undo"
        >
          <Undo className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="h-8 w-8 p-0"
          data-testid="button-redo"
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor Content */}
      <EditorContent 
        editor={editor} 
        className="min-h-[120px] max-h-[400px] overflow-y-auto [&_.ProseMirror]:outline-none [&_.ProseMirror_table]:border-collapse [&_.ProseMirror_table]:table-auto [&_.ProseMirror_table]:w-full [&_.ProseMirror_td]:border [&_.ProseMirror_td]:border-border [&_.ProseMirror_td]:p-2 [&_.ProseMirror_th]:border [&_.ProseMirror_th]:border-border [&_.ProseMirror_th]:p-2 [&_.ProseMirror_th]:bg-muted [&_.ProseMirror_th]:font-semibold"
      />
    </div>
  );
}