'use client';


import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Mail, Linkedin, MapPin, Briefcase, GraduationCap } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function AlumniDirectory() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCompany, setFilterCompany] = useState('all');
  const [filterYear, setFilterYear] = useState('all');

  const alumni = [
    {
      id: 1,
      name: 'Sarah Chen',
      graduationYear: 2023,
      major: 'Computer Science',
      company: 'Google',
      position: 'Software Engineer',
      location: 'Mountain View, CA',
      linkedin: 'linkedin.com/in/sarahchen',
      email: 's.chen@example.com',
      initials: 'SC',
    },
    {
      id: 2,
      name: 'Michael Rodriguez',
      graduationYear: 2022,
      major: 'Information Systems',
      company: 'Amazon',
      position: 'Product Manager',
      location: 'Seattle, WA',
      linkedin: 'linkedin.com/in/mrodriguez',
      email: 'm.rodriguez@example.com',
      initials: 'MR',
    },
    {
      id: 3,
      name: 'Emily Johnson',
      graduationYear: 2024,
      major: 'Computer Science',
      company: 'Microsoft',
      position: 'Software Engineer II',
      location: 'Redmond, WA',
      linkedin: 'linkedin.com/in/emilyjohnson',
      email: 'e.johnson@example.com',
      initials: 'EJ',
    },
    {
      id: 4,
      name: 'David Park',
      graduationYear: 2021,
      major: 'Management Information Systems',
      company: 'Meta',
      position: 'Senior Software Engineer',
      location: 'Menlo Park, CA',
      linkedin: 'linkedin.com/in/davidpark',
      email: 'd.park@example.com',
      initials: 'DP',
    },
    {
      id: 5,
      name: 'Jessica Williams',
      graduationYear: 2023,
      major: 'Computer Science',
      company: 'Apple',
      position: 'iOS Developer',
      location: 'Cupertino, CA',
      linkedin: 'linkedin.com/in/jessicawilliams',
      email: 'j.williams@example.com',
      initials: 'JW',
    },
    {
      id: 6,
      name: 'Ryan Thompson',
      graduationYear: 2022,
      major: 'Information Technology',
      company: 'Netflix',
      position: 'Data Engineer',
      location: 'Los Gatos, CA',
      linkedin: 'linkedin.com/in/ryanthompson',
      email: 'r.thompson@example.com',
      initials: 'RT',
    },
    {
      id: 7,
      name: 'Priya Patel',
      graduationYear: 2024,
      major: 'Computer Science',
      company: 'Salesforce',
      position: 'Software Engineer',
      location: 'San Francisco, CA',
      linkedin: 'linkedin.com/in/priyapatel',
      email: 'p.patel@example.com',
      initials: 'PP',
    },
    {
      id: 8,
      name: 'Alex Martinez',
      graduationYear: 2021,
      major: 'Computer Engineering',
      company: 'Tesla',
      position: 'Embedded Software Engineer',
      location: 'Austin, TX',
      linkedin: 'linkedin.com/in/alexmartinez',
      email: 'a.martinez@example.com',
      initials: 'AM',
    },
  ];

  const companies = Array.from(new Set(alumni.map(a => a.company))).sort();
  const years = Array.from(new Set(alumni.map(a => a.graduationYear))).sort((a, b) => b - a);

  const filteredAlumni = alumni.filter(person => {
    const matchesSearch = person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         person.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         person.position.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCompany = filterCompany === 'all' || person.company === filterCompany;
    const matchesYear = filterYear === 'all' || person.graduationYear.toString() === filterYear;
    return matchesSearch && matchesCompany && matchesYear;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Alumni Directory</h1>
        <p className="text-gray-600">Connect with KTP Georgia alumni across the country</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Alumni</CardDescription>
            <CardTitle className="text-2xl">500+</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Companies</CardDescription>
            <CardTitle className="text-2xl">150+</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>States</CardDescription>
            <CardTitle className="text-2xl">35</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Countries</CardDescription>
            <CardTitle className="text-2xl">12</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search alumni..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterCompany} onValueChange={setFilterCompany}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by company" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Companies</SelectItem>
                {companies.map(company => (
                  <SelectItem key={company} value={company}>{company}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {years.map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Alumni Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {filteredAlumni.map((person) => (
          <Card key={person.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarFallback className="bg-red-800 text-white text-lg">
                    {person.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900">{person.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                    <GraduationCap className="w-4 h-4" />
                    <span>{person.major} '{person.graduationYear.toString().slice(-2)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700 mt-2">
                    <Briefcase className="w-4 h-4" />
                    <span className="font-medium">{person.position}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    at <span className="font-medium">{person.company}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                    <MapPin className="w-4 h-4" />
                    <span>{person.location}</span>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Mail className="w-4 h-4 mr-2" />
                      Email
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Linkedin className="w-4 h-4 mr-2" />
                      LinkedIn
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAlumni.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-600">No alumni found matching your criteria</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
