'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2, ArrowUp, ArrowDown, ImageIcon } from 'lucide-react';
import {
  getHomepagePhotos,
  uploadHomepagePhoto,
  registerHomepagePhoto,
  removeHomepagePhoto,
  reorderHomepagePhotos,
} from '@/lib/portal-api';
import { isRedirectError } from '@/lib/is-redirect-error';

function PhotoMedia({ photo }) {
  const src = `/api/homepage-photos/${photo.id}/media`;
  if (photo.media_type === 'video') {
    return <video src={src} controls className="h-full w-full object-cover" />;
  }
  return <img src={src} alt={photo.title || 'Photo'} className="h-full w-full object-cover" />;
}

function UploadTab({ onAdded }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
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
      if (title.trim()) formData.append('title', title.trim());
      if (caption.trim()) formData.append('caption', caption.trim());

      const photo = await uploadHomepagePhoto(formData);
      onAdded(photo);
      setFile(null);
      setTitle('');
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
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-red-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-red-900 hover:file:bg-red-100"
          />
          <Input placeholder="Title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea
            placeholder="Caption (optional)"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="min-h-[60px]"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={!file || submitting} className="bg-red-900 hover:bg-red-800">
            {submitting ? 'Uploading...' : 'Add to homepage'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function RegisterTab({ onAdded }) {
  const [assetId, setAssetId] = useState('');
  const [mediaType, setMediaType] = useState('image');
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!assetId.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      const photo = await registerHomepagePhoto({
        immich_asset_id: assetId.trim(),
        media_type: mediaType,
        title: title.trim() || undefined,
        caption: caption.trim() || undefined,
      });
      onAdded(photo);
      setAssetId('');
      setTitle('');
      setCaption('');
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err.message ?? 'Failed to add photo');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <p className="text-sm text-gray-600">
          Already uploaded the file directly in Immich? Paste its asset ID here instead of re-uploading it.
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            placeholder="Immich asset ID"
            value={assetId}
            onChange={(e) => setAssetId(e.target.value)}
          />
          <select
            value={mediaType}
            onChange={(e) => setMediaType(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="image">Image</option>
            <option value="video">Video</option>
          </select>
          <Input placeholder="Title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea
            placeholder="Caption (optional)"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="min-h-[60px]"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={!assetId.trim() || submitting} className="bg-red-900 hover:bg-red-800">
            {submitting ? 'Adding...' : 'Add to homepage'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function HomepagePhotoManager() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reordering, setReordering] = useState(false);

  useEffect(() => {
    getHomepagePhotos()
      .then(setPhotos)
      .catch((err) => {
        if (isRedirectError(err)) throw err;
        setError(err.message ?? 'Could not load homepage photos');
      })
      .finally(() => setLoading(false));
  }, []);

  function handleAdded(photo) {
    setPhotos((prev) => [...prev, photo]);
  }

  async function handleRemove(id) {
    if (!window.confirm('Remove this photo from the homepage? (It stays in Immich.)')) return;
    try {
      await removeHomepagePhoto(id);
      setPhotos((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      if (isRedirectError(err)) throw err;
      window.alert(err.message ?? 'Failed to remove photo');
    }
  }

  async function move(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= photos.length) return;

    const reordered = [...photos];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setPhotos(reordered);
    setReordering(true);
    try {
      await reorderHomepagePhotos(reordered.map((p) => p.id));
    } catch (err) {
      if (isRedirectError(err)) throw err;
      window.alert(err.message ?? 'Failed to save the new order');
      // Revert on failure by re-fetching the server's actual order.
      getHomepagePhotos().then(setPhotos).catch((revertErr) => {
        if (isRedirectError(revertErr)) throw revertErr;
      });
    } finally {
      setReordering(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-red-900 mb-2 sm:text-3xl">Homepage Photos</h1>
        <p className="text-gray-600">Manage what appears in the public gallery on the chapter homepage</p>
      </div>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Upload a File</TabsTrigger>
          <TabsTrigger value="register">Register Existing Immich Asset</TabsTrigger>
        </TabsList>
        <TabsContent value="upload" className="mt-6">
          <UploadTab onAdded={handleAdded} />
        </TabsContent>
        <TabsContent value="register" className="mt-6">
          <RegisterTab onAdded={handleAdded} />
        </TabsContent>
      </Tabs>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 text-sm text-red-700">{error}</CardContent>
        </Card>
      )}

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Current homepage gallery {loading ? '' : `(${photos.length})`}
        </h2>
        {loading ? (
          <p className="text-sm text-gray-500 py-6">Loading...</p>
        ) : photos.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center px-4 py-10 text-center">
              <ImageIcon className="w-12 h-12 text-gray-400 mb-4" />
              <p className="text-gray-600">No homepage photos yet — add one above.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {photos.map((photo, index) => (
              <Card key={photo.id} className="overflow-hidden">
                <div className="aspect-square bg-gray-100">
                  <PhotoMedia photo={photo} />
                </div>
                <CardHeader className="p-4 pb-3">
                  <CardTitle className="text-sm truncate">{photo.title || 'Untitled'}</CardTitle>
                  {photo.caption && (
                    <CardDescription className="text-xs break-words">{photo.caption}</CardDescription>
                  )}
                  <div className="mt-2 flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={index === 0 || reordering}
                      onClick={() => move(index, -1)}
                      className="h-8 w-8 p-0"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={index === photos.length - 1 || reordering}
                      onClick={() => move(index, 1)}
                      className="h-8 w-8 p-0"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(photo.id)}
                      className="h-8 gap-1.5 px-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
