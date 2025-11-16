'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Youtube from '@tiptap/extension-youtube';
import { common, createLowlight } from 'lowlight';
import { useEffect, useState, useCallback } from 'react';

const lowlight = createLowlight(common);

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'დაწერეთ ტექსტი...',
  minHeight = '200px',
}: RichTextEditorProps) {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [showYoutubeInput, setShowYoutubeInput] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeWidth, setYoutubeWidth] = useState('640');
  const [youtubeHeight, setYoutubeHeight] = useState('480');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // Disable default code block
      }),
      Placeholder.configure({
        placeholder,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-500 underline cursor-pointer',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      Subscript,
      Superscript,
      CodeBlockLowlight.configure({
        lowlight,
      }),
      Youtube.configure({
        controls: true,
        nocookie: true,
        HTMLAttributes: {
          class: 'youtube-video',
        },
      }),
    ],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none p-4 text-foreground bg-background',
      },
    },
  });

  // Update editor content when value prop changes externally
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  const addLink = useCallback(() => {
    if (linkUrl) {
      editor?.chain().focus().setLink({ href: linkUrl }).run();
      setLinkUrl('');
      setShowLinkInput(false);
    }
  }, [editor, linkUrl]);

  const addImage = useCallback(() => {
    if (imageUrl) {
      editor?.chain().focus().setImage({ src: imageUrl }).run();
      setImageUrl('');
      setShowImageInput(false);
    }
  }, [editor, imageUrl]);

  const addYoutube = useCallback(() => {
    if (youtubeUrl) {
      editor?.commands.setYoutubeVideo({ 
        src: youtubeUrl,
        width: parseInt(youtubeWidth) || 640,
        height: parseInt(youtubeHeight) || 480,
      });
      
      setYoutubeUrl('');
      setYoutubeWidth('640');
      setYoutubeHeight('480');
      setShowYoutubeInput(false);
    }
  }, [editor, youtubeUrl, youtubeWidth, youtubeHeight]);

  if (!editor) {
    return null;
  }

  return (
    <div className="border border-foreground/20 rounded-lg overflow-hidden bg-background">
      {/* Toolbar */}
      <div className="border-b border-foreground/20 p-2 bg-background/50">
        {/* Row 1: Text Formatting */}
        <div className="flex flex-wrap gap-1 mb-2">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`px-2 py-1 rounded text-base font-bold transition-colors ${
              editor.isActive('bold')
                ? 'bg-blue-500 text-white'
                : 'bg-foreground/10 text-foreground hover:bg-foreground/20'
            }`}
            title="Bold (Ctrl+B)"
          >
            B
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`px-2 py-1 rounded text-base italic transition-colors ${
              editor.isActive('italic')
                ? 'bg-blue-500 text-white'
                : 'bg-foreground/10 text-foreground hover:bg-foreground/20'
            }`}
            title="Italic (Ctrl+I)"
          >
            I
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`px-2 py-1 rounded text-base underline transition-colors ${
              editor.isActive('underline')
                ? 'bg-blue-500 text-white'
                : 'bg-foreground/10 text-foreground hover:bg-foreground/20'
            }`}
            title="Underline (Ctrl+U)"
          >
            U
          </button>

          <div className="w-px h-6 bg-foreground/20 mx-1"></div>

          {/* Text Color */}
          <input
            type="color"
            onInput={(e) => editor.chain().focus().setColor((e.target as HTMLInputElement).value).run()}
            value={editor.getAttributes('textStyle').color || '#000000'}
            className="w-8 h-6 rounded cursor-pointer"
            title="Text Color"
          />
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            className={`px-2 py-1 rounded text-base transition-colors ${
              editor.isActive('highlight')
                ? 'bg-yellow-400 text-black'
                : 'bg-foreground/10 text-foreground hover:bg-foreground/20'
            }`}
            title="Highlight"
          >
            🖍
          </button>

          <div className="w-px h-6 bg-foreground/20 mx-1"></div>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`px-2 py-1 rounded text-base transition-colors ${
              editor.isActive('bulletList')
                ? 'bg-blue-500 text-white'
                : 'bg-foreground/10 text-foreground hover:bg-foreground/20'
            }`}
            title="Bullet List"
          >
            ≡
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`px-2 py-1 rounded text-base transition-colors ${
              editor.isActive('orderedList')
                ? 'bg-blue-500 text-white'
                : 'bg-foreground/10 text-foreground hover:bg-foreground/20'
            }`}
            title="Numbered List"
          >
            ≣
          </button>

          <div className="w-px h-6 bg-foreground/20 mx-1"></div>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`px-2 py-1 rounded text-base transition-colors ${
              editor.isActive('blockquote')
                ? 'bg-blue-500 text-white'
                : 'bg-foreground/10 text-foreground hover:bg-foreground/20'
            }`}
            title="Blockquote"
          >
            "
          </button>

          <div className="w-px h-6 bg-foreground/20 mx-1"></div>

          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={`px-2 py-1 rounded text-base transition-colors ${
              editor.isActive({ textAlign: 'left' })
                ? 'bg-blue-500 text-white'
                : 'bg-foreground/10 text-foreground hover:bg-foreground/20'
            }`}
            title="Align Left"
          >
            ☰
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={`px-2 py-1 rounded text-base transition-colors ${
              editor.isActive({ textAlign: 'center' })
                ? 'bg-blue-500 text-white'
                : 'bg-foreground/10 text-foreground hover:bg-foreground/20'
            }`}
            title="Align Center"
          >
            ☷
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={`px-2 py-1 rounded text-base transition-colors ${
              editor.isActive({ textAlign: 'right' })
                ? 'bg-blue-500 text-white'
                : 'bg-foreground/10 text-foreground hover:bg-foreground/20'
            }`}
            title="Align Right"
          >
            ☰
          </button>

          <div className="w-px h-6 bg-foreground/20 mx-1"></div>

          <select
            onChange={(e) => {
              const value = e.target.value;
              if (value === 'p') editor.chain().focus().setParagraph().run();
              else if (value === 'h1') editor.chain().focus().toggleHeading({ level: 1 }).run();
              else if (value === 'h2') editor.chain().focus().toggleHeading({ level: 2 }).run();
              else if (value === 'h3') editor.chain().focus().toggleHeading({ level: 3 }).run();
            }}
            value={
              editor.isActive('heading', { level: 1 }) ? 'h1' :
              editor.isActive('heading', { level: 2 }) ? 'h2' :
              editor.isActive('heading', { level: 3 }) ? 'h3' : 'p'
            }
            className="px-2 py-1 rounded text-sm bg-foreground/10 text-foreground hover:bg-foreground/20 border-none cursor-pointer"
            title="Text Style"
          >
            <option value="p">Paragraph</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
          </select>

          <div className="w-px h-6 bg-foreground/20 mx-1"></div>

          <button
            type="button"
            onClick={() => {
              const previousUrl = editor.getAttributes('link').href;
              setLinkUrl(previousUrl || '');
              setShowLinkInput(!showLinkInput);
            }}
            className={`px-2 py-1 rounded text-base transition-colors ${
              editor.isActive('link')
                ? 'bg-blue-500 text-white'
                : 'bg-foreground/10 text-foreground hover:bg-foreground/20'
            }`}
            title="Add Link"
          >
            🔗
          </button>
          <button
            type="button"
            onClick={() => setShowImageInput(!showImageInput)}
            className="px-2 py-1 rounded text-base bg-foreground/10 text-foreground hover:bg-foreground/20 transition-colors"
            title="Add Image"
          >
            🖼
          </button>
          <button
            type="button"
            onClick={() => setShowYoutubeInput(!showYoutubeInput)}
            className="px-2 py-1 rounded text-base bg-foreground/10 text-foreground hover:bg-foreground/20 transition-colors"
            title="Add YouTube Video"
          >
            ▶️
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`px-2 py-1 rounded text-base transition-colors ${
              editor.isActive('codeBlock')
                ? 'bg-blue-500 text-white'
                : 'bg-foreground/10 text-foreground hover:bg-foreground/20'
            }`}
            title="Code Block"
          >
            &lt;/&gt;
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className="px-2 py-1 rounded text-base bg-foreground/10 text-foreground hover:bg-foreground/20 transition-colors"
            title="Horizontal Rule"
          >
            ⎯
          </button>
        </div>

        {/* Link Input Row */}
        {showLinkInput && (
          <div className="flex gap-2 mt-2 p-2 bg-background border border-foreground/10 rounded">
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              className="flex-1 px-3 py-1 text-sm border border-foreground/20 rounded bg-background text-foreground"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addLink();
                }
              }}
            />
            <button
              type="button"
              onClick={addLink}
              className="px-3 py-1 rounded text-sm bg-blue-500 text-white hover:bg-blue-600 transition-colors"
            >
              დამატება
            </button>
            <button
              type="button"
              onClick={() => {
                setShowLinkInput(false);
                setLinkUrl('');
              }}
              className="px-3 py-1 rounded text-sm bg-foreground/10 text-foreground hover:bg-foreground/20 transition-colors"
            >
              გაუქმება
            </button>
          </div>
        )}

        {/* Image Input Row */}
        {showImageInput && (
          <div className="flex gap-2 mt-2 p-2 bg-background border border-foreground/10 rounded">
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="flex-1 px-3 py-1 text-sm border border-foreground/20 rounded bg-background text-foreground"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addImage();
                }
              }}
            />
            <button
              type="button"
              onClick={addImage}
              className="px-3 py-1 rounded text-sm bg-blue-500 text-white hover:bg-blue-600 transition-colors"
            >
              დამატება
            </button>
            <button
              type="button"
              onClick={() => {
                setShowImageInput(false);
                setImageUrl('');
              }}
              className="px-3 py-1 rounded text-sm bg-foreground/10 text-foreground hover:bg-foreground/20 transition-colors"
            >
              გაუქმება
            </button>
          </div>
        )}

        {/* YouTube Input Row */}
        {showYoutubeInput && (
          <div className="flex flex-col gap-2 mt-2 p-3 bg-background border border-foreground/10 rounded">
            <input
              type="url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full px-3 py-2 text-sm border border-foreground/20 rounded bg-background text-foreground"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addYoutube();
                }
              }}
            />
            <div className="flex gap-3 items-center">
              <div className="flex gap-2 items-center">
                <label className="text-sm text-foreground">სიგანე:</label>
                <input
                  type="number"
                  value={youtubeWidth}
                  onChange={(e) => setYoutubeWidth(e.target.value)}
                  placeholder="640"
                  className="w-24 px-3 py-1 text-sm border border-foreground/20 rounded bg-background text-foreground"
                />
              </div>
              <div className="flex gap-2 items-center">
                <label className="text-sm text-foreground">სიმაღლე:</label>
                <input
                  type="number"
                  value={youtubeHeight}
                  onChange={(e) => setYoutubeHeight(e.target.value)}
                  placeholder="480"
                  className="w-24 px-3 py-1 text-sm border border-foreground/20 rounded bg-background text-foreground"
                />
              </div>
              <div className="flex gap-2 ml-auto">
                <button
                  type="button"
                  onClick={addYoutube}
                  className="px-3 py-1 rounded text-sm bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                >
                  დამატება
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowYoutubeInput(false);
                    setYoutubeUrl('');
                    setYoutubeWidth('640');
                    setYoutubeHeight('480');
                  }}
                  className="px-3 py-1 rounded text-sm bg-foreground/10 text-foreground hover:bg-foreground/20 transition-colors"
                >
                  გაუქმება
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Editor */}
      <div style={{ minHeight }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
