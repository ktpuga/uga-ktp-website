'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, FolderOpen, FileText, Trash2, Users, Images, Plus, ArrowLeft, Download, X } from 'lucide-react';
import {
  getPhotos,
  getAlbums,
  createAlbum,
  deleteAlbum,
  uploadPhoto,
  deletePhoto,
  getDocumentFolders,
  getDocuments,
  createDocumentFolder,
  deleteDocumentFolder,
  uploadDocument,
  deleteDocument,
} from '@/lib/portal-api';
import { formatPhotoDate } from '@/lib/portal-format';
import { isRedirectError } from '@/lib/is-redirect-error';
import PhotoMedia from './PhotoMedia';

const GENERAL_ALBUM = { id: null, name: 'Shared Album', description: 'General chapter photos, open to everyone' };

function EmptyTab({ icon: Icon, message }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center px-4 py-10 text-center sm:py-12">
        <Icon className="w-12 h-12 text-gray-400 mb-4" />
        <p className="text-gray-600 dark:text-gray-400 text-center max-w-sm">{message}</p>
      </CardContent>
    </Card>
  );
}

function PhotoCard({ photo, canDelete, onDelete }) {
  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-square bg-gray-100 dark:bg-slate-800">
        <PhotoMedia photo={photo} />
        <a
          href={`/api/photos/${photo.id}/media`}
          download={photo.title || `photo-${photo.id}`}
          title="Download"
          className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
        >
          <Download className="h-4 w-4" />
        </a>
      </div>
      <CardHeader className="p-4 pb-3 sm:p-6 sm:pb-3">
        <CardTitle className="text-sm truncate">{photo.title || 'Untitled'}</CardTitle>
        <CardDescription className="break-words text-xs">
          <span className="block">
            {photo.created_at ? formatPhotoDate(photo.created_at) : '-'}
            {photo.caption ? ` - ${photo.caption}` : ''}
          </span>
          {photo.uploaded_by_name && (
            <span className="mt-0.5 block text-gray-500">Added by {photo.uploaded_by_name}</span>
          )}
        </CardDescription>
        {canDelete && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onDelete(photo.id)}
            className="mt-2 h-8 w-fit gap-1.5 px-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
        )}
      </CardHeader>
    </Card>
  );
}

function UploadForm({ albumId, onUploaded }) {
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) return;

    setSubmitting(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (albumId) formData.append('album_id', albumId);
      if (caption.trim()) formData.append('caption', caption.trim());

      const photo = await uploadPhoto(formData);
      onUploaded(photo);
      setFile(null);
      setCaption('');
      e.target.reset();
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err.message ?? 'Failed to upload photo');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-blue-900 hover:file:bg-blue-100"
          />
          <Textarea
            placeholder="Add a caption (optional)"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="min-h-[60px]"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={!file || submitting}>
            {submitting ? 'Uploading...' : 'Add photo'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function CreateAlbumForm({ onCreated }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      const album = await createAlbum(name.trim(), description.trim() || undefined);
      onCreated(album);
      setName('');
      setDescription('');
      setOpen(false);
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err.message ?? 'Failed to create album');
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <Button type="button" variant="outline" onClick={() => setOpen(true)} className="gap-2">
        <Plus className="h-4 w-4" /> New Album
      </Button>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input placeholder="Album name" value={name} onChange={(e) => setName(e.target.value)} />
          <Textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[60px]"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={!name.trim() || submitting}>
              {submitting ? 'Creating...' : 'Create album'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function AlbumList({ albums, isEboard, onSelect, onCreated, onDelete }) {
  const allAlbums = [GENERAL_ALBUM, ...albums];

  return (
    <div className="space-y-4">
      {isEboard && <CreateAlbumForm onCreated={onCreated} />}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {allAlbums.map((album) => (
          <Card
            key={album.id ?? 'general'}
            className="cursor-pointer transition-shadow hover:shadow-md"
            onClick={() => onSelect(album)}
          >
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="flex min-w-0 items-center gap-2 text-base">
                  <Images className="h-4 w-4 shrink-0 text-blue-800" />
                  <span className="truncate">{album.name}</span>
                </CardTitle>
                {isEboard && album.id != null && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(album.id);
                    }}
                    className="h-8 w-8 shrink-0 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {album.description && (
                <CardDescription className="line-clamp-2">{album.description}</CardDescription>
              )}
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}

function AlbumView({ album, currentUserId, isEboard, onBack }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setLoading(true);
    getPhotos(album.id ?? undefined)
      .then(setPhotos)
      .catch((err) => {
        if (isRedirectError(err)) throw err;
        setError(err.message ?? 'Could not load photos');
      })
      .finally(() => setLoading(false));
  }, [album.id]);

  function handleUploaded(photo) {
    setPhotos((prev) => [photo, ...prev]);
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this photo? This cannot be undone.')) return;
    try {
      await deletePhoto(id);
      setPhotos((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      if (isRedirectError(err)) throw err;
      window.alert(err.message ?? 'Failed to delete photo');
    }
  }

  const filteredPhotos = photos.filter((p) =>
    (p.title ?? '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <Button type="button" variant="ghost" size="sm" onClick={onBack} className="-ml-2 gap-1.5">
        <ArrowLeft className="h-4 w-4" /> Back to Albums
      </Button>

      <div>
        <h2 className="text-lg font-semibold text-gray-900">{album.name}</h2>
        {album.description && <p className="text-sm text-gray-600">{album.description}</p>}
      </div>

      <UploadForm albumId={album.id} onUploaded={handleUploaded} />

      {error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/40">
          <CardContent className="pt-6 text-sm text-red-700 dark:text-red-300">{error}</CardContent>
        </Card>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search photos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-gray-500 sm:py-12">Loading photos...</p>
      ) : filteredPhotos.length === 0 ? (
        <EmptyTab icon={Users} message="No photos yet. Be the first to add one above." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredPhotos.map((photo) => {
            const canDelete =
              photo.uploaded_by === currentUserId || (isEboard && album.created_by === currentUserId);
            return <PhotoCard key={photo.id} photo={photo} canDelete={canDelete} onDelete={handleDelete} />;
          })}
        </div>
      )}
    </div>
  );
}

function AlbumsSection({ currentUserId, isEboard }) {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAlbum, setSelectedAlbum] = useState(null);

  useEffect(() => {
    getAlbums()
      .then(setAlbums)
      .catch((err) => {
        if (isRedirectError(err)) throw err;
        setError(err.message ?? 'Could not load albums');
      })
      .finally(() => setLoading(false));
  }, []);

  function handleCreated(album) {
    setAlbums((prev) => [album, ...prev]);
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this album? Its photos will move to the Shared Album, not be deleted.')) return;
    try {
      await deleteAlbum(id);
      setAlbums((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      if (isRedirectError(err)) throw err;
      window.alert(err.message ?? 'Failed to delete album');
    }
  }

  if (selectedAlbum) {
    return (
      <AlbumView
        album={selectedAlbum}
        currentUserId={currentUserId}
        isEboard={isEboard}
        onBack={() => setSelectedAlbum(null)}
      />
    );
  }

  if (loading) {
    return <p className="py-10 text-center text-sm text-gray-500 sm:py-12">Loading albums...</p>;
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6 text-sm text-red-700">{error}</CardContent>
      </Card>
    );
  }

  return (
    <AlbumList
      albums={albums}
      isEboard={isEboard}
      onSelect={setSelectedAlbum}
      onCreated={handleCreated}
      onDelete={handleDelete}
    />
  );
}

function formatFileSize(bytes) {
  if (bytes === null || bytes === undefined) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function CreateFolderForm({ parentId, onCreated }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      const folder = await createDocumentFolder(name.trim(), parentId);
      onCreated(folder);
      setName('');
      setOpen(false);
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError('Failed to create folder');
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <Button type="button" variant="outline" onClick={() => setOpen(true)} className="gap-2">
        <Plus className="h-4 w-4" /> New Folder
      </Button>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <Input
            placeholder="Folder name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="sm:flex-1"
          />
          <div className="flex gap-2">
            <Button type="submit" disabled={!name.trim() || submitting}>
              {submitting ? 'Creating...' : 'Create'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </CardContent>
    </Card>
  );
}

function UploadDocumentForm({ folderId, onUploaded }) {
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) return;

    setSubmitting(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (folderId) formData.append('folder_id', folderId);

      const result = await uploadDocument(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        onUploaded(result);
        setFile(null);
        e.target.reset();
      }
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError('Failed to upload document');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-blue-900 hover:file:bg-blue-100 sm:flex-1"
          />
          <Button type="submit" disabled={!file || submitting}>
            {submitting ? 'Uploading...' : 'Upload file'}
          </Button>
        </form>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </CardContent>
    </Card>
  );
}

function FolderCard({ folder, isEboard, onOpen, onDelete }) {
  return (
    <Card className="cursor-pointer transition-shadow hover:shadow-md">
      <CardContent className="flex items-center justify-between gap-2 p-4">
        <button
          type="button"
          onClick={() => onOpen(folder)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <FolderOpen className="h-5 w-5 shrink-0 text-blue-800" />
          <span className="truncate text-sm font-medium text-gray-900 dark:text-slate-100">{folder.name}</span>
        </button>
        {isEboard && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onDelete(folder.id)}
            className="h-8 w-8 shrink-0 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function isPreviewable(mimeType) {
  return mimeType?.startsWith('image/') || mimeType === 'application/pdf';
}

function DocumentIcon({ doc }) {
  if (doc.mime_type?.startsWith('image/')) {
    return (
      <img
        src={`/api/documents/${doc.id}/preview`}
        alt=""
        className="h-10 w-10 shrink-0 rounded object-cover"
      />
    );
  }
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-gray-100 dark:bg-slate-800">
      <FileText className="h-5 w-5 text-gray-500" />
    </div>
  );
}

function DocumentRow({ doc, isEboard, onPreview, onDelete }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => onPreview(doc)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <DocumentIcon doc={doc} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-gray-900 hover:underline dark:text-slate-100">
              {doc.filename}
            </p>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              {formatFileSize(doc.file_size)}
              {doc.created_at ? ` • ${formatPhotoDate(doc.created_at)}` : ''}
            </p>
          </div>
        </button>
        <div className="flex shrink-0 gap-2">
          <Button type="button" variant="outline" size="sm" asChild>
            <a href={`/api/documents/${doc.id}/download`} download={doc.filename}>
              <Download className="mr-2 h-4 w-4" /> Download
            </a>
          </Button>
          {isEboard && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onDelete(doc.id)}
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function DocumentPreviewModal({ doc, onClose }) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const previewUrl = `/api/documents/${doc.id}/preview`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-full w-full max-w-4xl flex-col overflow-hidden rounded-lg bg-white dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-gray-200 p-4 dark:border-slate-700">
          <p className="min-w-0 truncate text-sm font-medium text-gray-900 dark:text-slate-100">{doc.filename}</p>
          <div className="flex shrink-0 items-center gap-2">
            <Button type="button" variant="outline" size="sm" asChild>
              <a href={`/api/documents/${doc.id}/download`} download={doc.filename}>
                <Download className="mr-2 h-4 w-4" /> Download
              </a>
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-auto bg-gray-50 dark:bg-slate-950">
          {isPreviewable(doc.mime_type) ? (
            doc.mime_type.startsWith('image/') ? (
              <img src={previewUrl} alt={doc.filename} className="mx-auto max-h-[75vh] w-auto object-contain" />
            ) : (
              <iframe src={previewUrl} title={doc.filename} className="h-[75vh] w-full" />
            )
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 px-4 py-20 text-center">
              <FileText className="h-12 w-12 text-gray-400" />
              <p className="text-sm text-gray-600 dark:text-slate-400">
                Preview isn't available for this file type — download it to view.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DocumentsSection({ isEboard }) {
  const [path, setPath] = useState([]); // [{ id, name }, ...] — empty means the top level
  const [folders, setFolders] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);

  const currentFolderId = path.length ? path[path.length - 1].id : null;

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([getDocumentFolders(currentFolderId), getDocuments(currentFolderId)])
      .then(([folderList, documentList]) => {
        setFolders(folderList);
        setDocuments(documentList);
      })
      .catch((err) => {
        if (isRedirectError(err)) throw err;
        setError('Could not load this folder');
      })
      .finally(() => setLoading(false));
  }, [currentFolderId]);

  function handleFolderCreated(folder) {
    setFolders((prev) => [...prev, folder]);
  }

  function handleDocumentUploaded(doc) {
    setDocuments((prev) => [doc, ...prev]);
  }

  function handleOpenFolder(folder) {
    setPath((prev) => [...prev, { id: folder.id, name: folder.name }]);
  }

  function handleBreadcrumb(index) {
    setPath((prev) => prev.slice(0, index + 1));
  }

  function handleBack() {
    setPath((prev) => prev.slice(0, -1));
  }

  async function handleDeleteFolder(id) {
    if (!window.confirm('Delete this folder and everything inside it? This cannot be undone.')) return;
    try {
      await deleteDocumentFolder(id);
      setFolders((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      if (isRedirectError(err)) throw err;
      window.alert('Failed to delete folder');
    }
  }

  async function handleDeleteDocument(id) {
    if (!window.confirm('Delete this document? This cannot be undone.')) return;
    try {
      await deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      if (isRedirectError(err)) throw err;
      window.alert('Failed to delete document');
    }
  }

  return (
    <div className="space-y-4">
      {path.length > 0 && (
        <Button type="button" variant="ghost" size="sm" onClick={handleBack} className="-ml-2 gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      )}

      <div className="flex flex-wrap items-center gap-1 text-sm text-gray-600 dark:text-slate-400">
        <button type="button" onClick={() => setPath([])} className="hover:underline">
          Documents
        </button>
        {path.map((crumb, index) => (
          <span key={crumb.id} className="flex items-center gap-1">
            <span>/</span>
            <button type="button" onClick={() => handleBreadcrumb(index)} className="hover:underline">
              {crumb.name}
            </button>
          </span>
        ))}
      </div>

      {isEboard && (
        <div className="flex flex-wrap gap-2">
          <CreateFolderForm parentId={currentFolderId} onCreated={handleFolderCreated} />
        </div>
      )}

      {isEboard && <UploadDocumentForm folderId={currentFolderId} onUploaded={handleDocumentUploaded} />}

      {error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/40">
          <CardContent className="pt-6 text-sm text-red-700 dark:text-red-300">{error}</CardContent>
        </Card>
      )}

      {loading ? (
        <p className="py-10 text-center text-sm text-gray-500 sm:py-12">Loading...</p>
      ) : folders.length === 0 && documents.length === 0 ? (
        <EmptyTab icon={FolderOpen} message="Nothing here yet." />
      ) : (
        <div className="space-y-4">
          {folders.length > 0 && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {folders.map((folder) => (
                <FolderCard
                  key={folder.id}
                  folder={folder}
                  isEboard={isEboard}
                  onOpen={handleOpenFolder}
                  onDelete={handleDeleteFolder}
                />
              ))}
            </div>
          )}
          {documents.length > 0 && (
            <div className="space-y-2">
              {documents.map((doc) => (
                <DocumentRow
                  key={doc.id}
                  doc={doc}
                  isEboard={isEboard}
                  onPreview={setPreviewDoc}
                  onDelete={handleDeleteDocument}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {previewDoc && <DocumentPreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />}
    </div>
  );
}

export default function PhotoFiles({ title, description }) {
  const { data: session } = useSession();
  const currentUserId = session?.user?.authentik_id;
  const isEboard = session?.user?.groups?.includes('eboard') ?? false;

  return (
    <div className="space-y-6 overflow-x-hidden">
      <div>
        <h1 className="mb-2 text-2xl font-bold text-gray-900 sm:text-3xl">{title}</h1>
        <p className="text-sm text-gray-600 sm:text-base">{description}</p>
      </div>

      <Tabs defaultValue="albums" className="w-full min-w-0">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1">
          <TabsTrigger value="albums" className="min-w-0 px-2 py-2 text-xs sm:text-sm">Albums</TabsTrigger>
          <TabsTrigger value="documents" className="min-w-0 px-2 py-2 text-xs sm:text-sm">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="albums" className="mt-6">
          <AlbumsSection currentUserId={currentUserId} isEboard={isEboard} />
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <DocumentsSection isEboard={isEboard} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
