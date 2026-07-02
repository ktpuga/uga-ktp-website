'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, FolderOpen, FileText } from 'lucide-react';
import { getPhotos } from '@/lib/portal-api';
import { formatPhotoDate } from '@/lib/portal-format';

function EmptyTab({ icon: Icon, message }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center px-4 py-10 text-center sm:py-12">
        <Icon className="w-12 h-12 text-gray-400 mb-4" />
        <p className="text-gray-600 text-center max-w-sm">{message}</p>
      </CardContent>
    </Card>
  );
}

export default function PhotoFiles({ title, description, accentClass = 'bg-blue-100 text-blue-900' }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    getPhotos()
      .then(setPhotos)
      .catch((err) => setError(err.message ?? 'Could not load photos'))
      .finally(() => setLoading(false));
  }, []);

  const filteredPhotos = photos.filter((p) =>
    (p.title ?? '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 overflow-x-hidden">
      <div>
        <h1 className="mb-2 text-2xl font-bold text-gray-900 sm:text-3xl">{title}</h1>
        <p className="text-sm text-gray-600 sm:text-base">{description}</p>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 text-sm text-red-700">{error}</CardContent>
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

      <Tabs defaultValue="photos" className="w-full min-w-0">
        <TabsList className="grid h-auto w-full grid-cols-3 gap-1">
          <TabsTrigger value="photos" className="min-w-0 px-2 py-2 text-xs sm:text-sm">Photos</TabsTrigger>
          <TabsTrigger value="documents" className="min-w-0 px-2 py-2 text-xs sm:text-sm">Documents</TabsTrigger>
          <TabsTrigger value="folders" className="min-w-0 px-2 py-2 text-xs sm:text-sm">Folders</TabsTrigger>
        </TabsList>

        <TabsContent value="photos" className="mt-6">
          {loading ? (
            <p className="py-10 text-center text-sm text-gray-500 sm:py-12">Loading photos...</p>
          ) : filteredPhotos.length === 0 ? (
            <EmptyTab icon={Search} message="No photos yet. Uploaded images will appear here." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredPhotos.map((photo) => (
                <Card key={photo.id} className="overflow-hidden">
                  <div className={`aspect-square flex items-center justify-center p-4 ${accentClass} bg-opacity-20`}>
                    <span className="line-clamp-4 break-words text-center text-sm font-medium text-gray-700">
                      {photo.title || 'Untitled'}
                    </span>
                  </div>
                  <CardHeader className="p-4 pb-3 sm:p-6 sm:pb-3">
                    <CardTitle className="text-sm truncate">{photo.title || 'Untitled'}</CardTitle>
                    <CardDescription className="break-words text-xs">
                      {photo.created_at ? formatPhotoDate(photo.created_at) : '-'}
                      {photo.caption ? ` - ${photo.caption}` : ''}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <EmptyTab
            icon={FileText}
            message="Document storage is not available yet."
          />
        </TabsContent>

        <TabsContent value="folders" className="mt-6">
          <EmptyTab
            icon={FolderOpen}
            message="Folders are not available yet. There is no folders API."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
