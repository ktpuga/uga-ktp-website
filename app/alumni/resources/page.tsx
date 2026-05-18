'use client';


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, FileText, Download, ExternalLink, BookOpen, Briefcase, Users, GraduationCap } from 'lucide-react';
import { useState } from 'react';

export default function AlumniResources() {
  const [searchQuery, setSearchQuery] = useState('');

  const documents = [
    {
      id: 1,
      title: 'KTP Alumni Directory 2026',
      description: 'Comprehensive directory of all KTP Georgia alumni',
      type: 'PDF',
      size: '4.2 MB',
      category: 'directory',
      updated: '1 week ago',
    },
    {
      id: 2,
      title: 'Chapter History & Traditions',
      description: 'Learn about our chapter\'s rich history and traditions',
      type: 'PDF',
      size: '2.8 MB',
      category: 'general',
      updated: '2 weeks ago',
    },
    {
      id: 3,
      title: 'Alumni Benefits Guide',
      description: 'Overview of exclusive benefits available to alumni',
      type: 'PDF',
      size: '1.5 MB',
      category: 'general',
      updated: '3 days ago',
    },
    {
      id: 4,
      title: 'Mentorship Program Handbook',
      description: 'Guide for alumni interested in mentoring current members',
      type: 'PDF',
      size: '3.1 MB',
      category: 'mentorship',
      updated: '1 month ago',
    },
  ];

  const careerResources = [
    {
      id: 1,
      title: 'Resume Templates',
      description: 'Professional resume templates for tech roles',
      type: 'DOCX',
      size: '256 KB',
      category: 'career',
    },
    {
      id: 2,
      title: 'Interview Preparation Guide',
      description: 'Tips and strategies for technical interviews',
      type: 'PDF',
      size: '1.8 MB',
      category: 'career',
    },
    {
      id: 3,
      title: 'Salary Negotiation Tips',
      description: 'Best practices for negotiating job offers',
      type: 'PDF',
      size: '892 KB',
      category: 'career',
    },
    {
      id: 4,
      title: 'Tech Industry Insights 2026',
      description: 'Latest trends and opportunities in tech',
      type: 'PDF',
      size: '2.4 MB',
      category: 'career',
    },
  ];

  const externalLinks = [
    {
      id: 1,
      title: 'LinkedIn Alumni Group',
      description: 'Connect with KTP alumni on LinkedIn',
      url: 'linkedin.com/groups/ktp-georgia',
      icon: Users,
    },
    {
      id: 2,
      title: 'National KTP Website',
      description: 'Visit the national organization website',
      url: 'ktpnational.org',
      icon: GraduationCap,
    },
    {
      id: 3,
      title: 'UGA Alumni Association',
      description: 'University of Georgia alumni resources',
      url: 'alumni.uga.edu',
      icon: BookOpen,
    },
    {
      id: 4,
      title: 'Career Services',
      description: 'UGA career center for alumni',
      url: 'career.uga.edu',
      icon: Briefcase,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Alumni Resources</h1>
        <p className="text-gray-600">Access shared documents, guides, and helpful links</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search resources..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="documents" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="career">Career Resources</TabsTrigger>
          <TabsTrigger value="links">Useful Links</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="mt-6">
          <div className="grid gap-4">
            {documents.map((doc) => (
              <Card key={doc.id} className="hover:shadow-md transition-shadow">
                <CardContent className="flex items-start justify-between p-6">
                  <div className="flex gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-red-800" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{doc.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{doc.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{doc.type}</span>
                        <span>•</span>
                        <span>{doc.size}</span>
                        <span>•</span>
                        <span>Updated {doc.updated}</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" className="flex-shrink-0">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="career" className="mt-6">
          <div className="grid md:grid-cols-2 gap-4">
            {careerResources.map((resource) => (
              <Card key={resource.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-3 flex-1">
                      <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Briefcase className="w-5 h-5 text-amber-800" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-base mb-1">{resource.title}</CardTitle>
                        <CardDescription className="text-sm">{resource.description}</CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      {resource.type} • {resource.size}
                    </div>
                    <Button size="sm" variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="links" className="mt-6">
          <div className="grid md:grid-cols-2 gap-4">
            {externalLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Card key={link.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="flex items-center justify-between p-6">
                    <div className="flex gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon className="w-6 h-6 text-blue-800" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 mb-1">{link.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">{link.description}</p>
                        <p className="text-sm text-blue-600 truncate">{link.url}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="flex-shrink-0">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Featured Section */}
      <Card className="bg-gradient-to-br from-red-50 to-amber-50 border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            Mentorship Opportunities
          </CardTitle>
          <CardDescription>
            Make a difference by mentoring current KTP members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 mb-4">
            Our mentorship program connects experienced alumni with current members seeking guidance in their
            tech careers. Share your knowledge and help shape the next generation of tech professionals.
          </p>
          <Button className="bg-red-800 hover:bg-red-900">
            Become a Mentor
          </Button>
        </CardContent>
      </Card>

      {/* Contact Section */}
      <Card>
        <CardHeader>
          <CardTitle>Need Something Else?</CardTitle>
          <CardDescription>
            Can't find what you're looking for? Reach out to alumni relations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input placeholder="What resources are you looking for?" className="flex-1" />
            <Button className="bg-red-800 hover:bg-red-900">
              Submit Request
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
