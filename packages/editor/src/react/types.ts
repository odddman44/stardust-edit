import type { Ref } from 'react';
import type { CosmosDocument, EditorError, Result } from '../document/types.js';

export type ChangeInfo = { pendingUploadCount: number; failedUploadCount: number };
export type UploadImage = (file: File) => Promise<{ url: string }>;
export type CosmosEditorHandle = { getDocument(): Result<CosmosDocument> };
export type CosmosEditorProps = {
  initialDocument?: CosmosDocument;
  onChange?: (document: CosmosDocument, info: ChangeInfo) => void;
  onError?: (error: EditorError) => void;
  uploadImage?: UploadImage;
  className?: string;
  ref?: Ref<CosmosEditorHandle>;
};
