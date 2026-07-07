'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, FolderOpen, FileText, Trash2, Users, Images, Plus, ArrowLeft, Download } from 'lucide-react';
import { getPhotos, getAlbums, createAlbum, uploadPhoto, deletePhoto } from '@/lib/portal-api';
import { formatPhotoDate } from '@/lib/portal-format';
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

function AlbumList({ albums, isEboard, onSelect, onCreated }) {
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
              <CardTitle className="flex items-center gap-2 text-base">
                <Images className="h-4 w-4 shrink-0 text-blue-800" />
                <span className="truncate">{album.name}</span>
              </CardTitle>
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
      .catch((err) => setError(err.message ?? 'Could not load photos'))
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
      .catch((err) => setError(err.message ?? 'Could not load albums'))
      .finally(() => setLoading(false));
  }, []);

  function handleCreated(album) {
    setAlbums((prev) => [album, ...prev]);
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
    <AlbumList albums={albums} isEboard={isEboard} onSelect={setSelectedAlbum} onCreated={handleCreated} />
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
        <TabsList className="grid h-auto w-full grid-cols-3 gap-1">
          <TabsTrigger value="albums" className="min-w-0 px-2 py-2 text-xs sm:text-sm">Albums</TabsTrigger>
          <TabsTrigger value="documents" className="min-w-0 px-2 py-2 text-xs sm:text-sm">Documents</TabsTrigger>
          <TabsTrigger value="folders" className="min-w-0 px-2 py-2 text-xs sm:text-sm">Folders</TabsTrigger>
        </TabsList>

        <TabsContent value="albums" className="mt-6">
          <AlbumsSection currentUserId={currentUserId} isEboard={isEboard} />
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <EmptyTab icon={FileText} message="Document storage is not available yet." />
        </TabsContent>

        <TabsContent value="folders" className="mt-6">
          <EmptyTab icon={FolderOpen} message="Folders are not available yet. There is no folders API." />
        </TabsContent>
      </Tabs>
    </div>
  );
}
