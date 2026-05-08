'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Download, Share2, FolderOpen, FileText, Upload } from 'lucide-react';

const folders = [
  { id: 1, name: 'Events 2026', files: 45, lastUpdated: '2 days ago' },
  { id: 2, name: 'Professional Development', files: 23, lastUpdated: '1 week ago' },
  { id: 3, name: 'Social Events', files: 67, lastUpdated: '3 days ago' },
  { id: 4, name: 'Chapter Documents', files: 18, lastUpdated: '5 days ago' },
  { id: 5, name: 'Hackathon Projects', files: 12, lastUpdated: '1 week ago' },
];

const photos = [
  { id: 1, url: 'https://images.unsplash.com/photo-1758598306835-2c030e203707?w=400', title: 'Tech Talk Event', date: 'Feb 20, 2026', folder: 'Events 2026' },
  { id: 2, url: 'https://images.unsplash.com/photo-1758270705172-07b53627dfcb?w=400', title: 'Study Session', date: 'Feb 18, 2026', folder: 'Social Events' },
  { id: 3, url: 'https://images.unsplash.com/photo-1765366417030-16d9765d920a?w=400', title: 'Workshop Setup', date: 'Feb 15, 2026', folder: 'Professional Development' },
  { id: 4, url: 'https://images.unsplash.com/photo-1758270702512-089c0da33998?w=400', title: 'Graduation Celebration', date: 'Feb 10, 2026', folder: 'Events 2026' },
  { id: 5, url: 'https://images.unsplash.com/photo-1758598306835-2c030e203707?w=400', title: 'Team Building', date: 'Feb 8, 2026', folder: 'Social Events' },
  { id: 6, url: 'https://images.unsplash.com/photo-1758270705172-07b53627dfcb?w=400', title: 'Networking Night', date: 'Feb 5, 2026', folder: 'Professional Development' },
  { id: 7, url: 'https://images.unsplash.com/photo-1765366417030-16d9765d920a?w=400', title: 'Hackathon', date: 'Feb 1, 2026', folder: 'Hackathon Projects' },
  { id: 8, url: 'https://images.unsplash.com/photo-1758270702512-089c0da33998?w=400', title: 'Award Ceremony', date: 'Jan 28, 2026', folder: 'Events 2026' },
];

const documents = [
  { id: 1, name: 'KTP Constitution.pdf', size: '2.4 MB', modified: '1 week ago' },
  { id: 2, name: 'Spring 2026 Budget.xlsx', size: '156 KB', modified: '3 days ago' },
  { id: 3, name: 'Meeting Minutes - Feb.docx', size: '89 KB', modified: '2 days ago' },
  { id: 4, name: 'Rush Schedule.pdf', size: '1.2 MB', modified: '5 days ago' },
  { id: 5, name: 'Professional Dev Resources.pdf', size: '3.1 MB', modified: '1 week ago' },
];

export default function MemberFiles() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPhotos = photos.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredDocs = documents.filter((d) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Files & Photos</h1>
          <p className="text-gray-600">Access chapter documents, photos, and resources</p>
        </div>
        <Button className="bg-blue-900 hover:bg-blue-800">
          <Upload className="w-4 h-4 mr-2" /> Upload Files
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search files and photos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <Tabs defaultValue="photos" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="photos">Photos</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="folders">Folders</TabsTrigger>
        </TabsList>

        <TabsContent value="photos" className="mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredPhotos.map((photo) => (
              <Card key={photo.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
                <div className="aspect-square relative overflow-hidden bg-gray-100">
                  <img
                    src={photo.url}
                    alt={photo.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-4 flex gap-2">
                      <Button size="sm" variant="secondary" className="flex-1">
                        <Download className="w-4 h-4 mr-1" /> Download
                      </Button>
                      <Button size="sm" variant="secondary">
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm truncate">{photo.title}</CardTitle>
                  <CardDescription className="text-xs">{photo.date} • {photo.folder}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <div className="grid gap-3">
            {filteredDocs.map((doc) => (
              <Card key={doc.id} className="hover:shadow-md transition-shadow">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-blue-900" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-gray-900 truncate">{doc.name}</h4>
                      <p className="text-sm text-gray-600">{doc.size} • Modified {doc.modified}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" variant="outline"><Download className="w-4 h-4" /></Button>
                    <Button size="sm" variant="outline"><Share2 className="w-4 h-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="folders" className="mt-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {folders.map((folder) => (
              <Card key={folder.id} className="hover:shadow-md transition-shadow cursor-pointer group">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                      <FolderOpen className="w-6 h-6 text-blue-900" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 mb-1 truncate">{folder.name}</h4>
                      <p className="text-sm text-gray-600">{folder.files} files</p>
                      <p className="text-xs text-gray-500 mt-1">Updated {folder.lastUpdated}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
