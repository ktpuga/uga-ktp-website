'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, UserPlus, Mail, MoreVertical, UserCog, Shield, X } from 'lucide-react';

const roleBadge = (role) => ({ President: 'bg-red-100 text-red-800', 'Vice President': 'bg-amber-100 text-amber-800', 'Tech Chair': 'bg-blue-100 text-blue-800' }[role] ?? 'bg-gray-100 text-gray-800');
const statusBadge = (s) => s === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';

const initialMembers = [
  { id: 1, name: 'Alex Thompson', email: 'alex.t@uga.edu', role: 'President', status: 'active', joinDate: 'Fall 2023', year: 'Senior', major: 'Computer Science', initials: 'AT' },
  { id: 2, name: 'Jordan Lee', email: 'jordan.l@uga.edu', role: 'Vice President', status: 'active', joinDate: 'Fall 2023', year: 'Senior', major: 'Information Systems', initials: 'JL' },
  { id: 3, name: 'Sam Martinez', email: 'sam.m@uga.edu', role: 'Member', status: 'active', joinDate: 'Spring 2024', year: 'Junior', major: 'Computer Science', initials: 'SM' },
  { id: 4, name: 'Casey Nguyen', email: 'casey.n@uga.edu', role: 'Tech Chair', status: 'active', joinDate: 'Fall 2024', year: 'Sophomore', major: 'Computer Engineering', initials: 'CN' },
  { id: 5, name: 'Riley Johnson', email: 'riley.j@uga.edu', role: 'Member', status: 'active', joinDate: 'Fall 2024', year: 'Sophomore', major: 'MIS', initials: 'RJ' },
  { id: 6, name: 'Morgan Davis', email: 'morgan.d@uga.edu', role: 'Member', status: 'inactive', joinDate: 'Spring 2024', year: 'Junior', major: 'Computer Science', initials: 'MD' },
];

const alumni = [
  { id: 1, name: 'Sarah Chen', email: 's.chen@example.com', status: 'active', graduationYear: '2023', company: 'Google', initials: 'SC' },
  { id: 2, name: 'Michael Rodriguez', email: 'm.rodriguez@example.com', status: 'active', graduationYear: '2022', company: 'Amazon', initials: 'MR' },
  { id: 3, name: 'Emily Johnson', email: 'e.johnson@example.com', status: 'active', graduationYear: '2024', company: 'Microsoft', initials: 'EJ' },
];

export default function AdminUsers() {
  const [members, setMembers] = useState(initialMembers);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isAdding, setIsAdding] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [newUser, setNewUser] = useState({ name: '', email: '', type: 'member', role: 'Member' });

  const filteredMembers = members.filter((m) => {
    const q = searchQuery.toLowerCase();
    return (
      (m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)) &&
      (filterRole === 'all' || m.role === filterRole) &&
      (filterStatus === 'all' || m.status === filterStatus)
    );
  });

  const handleAddUser = () => {
    setMembers([
      ...members,
      { id: Date.now(), ...newUser, status: 'active', joinDate: 'Spring 2026', year: '', major: '', initials: newUser.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) },
    ]);
    setNewUser({ name: '', email: '', type: 'member', role: 'Member' });
    setIsAdding(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
          <p className="text-gray-600">Manage member and alumni accounts</p>
        </div>
        <Button className="bg-blue-900 hover:bg-blue-800" onClick={() => setIsAdding(true)}>
          <UserPlus className="w-4 h-4 mr-2" /> Add User
        </Button>
      </div>

      {/* Add User inline form */}
      {isAdding && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Add New User</CardTitle>
              <button onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <CardDescription>Create a new member or alumni account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Full Name</label>
              <Input placeholder="Enter full name" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Email</label>
              <Input type="email" placeholder="email@uga.edu" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">User Type</label>
                <select
                  value={newUser.type}
                  onChange={(e) => setNewUser({ ...newUser, type: e.target.value })}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="member">Member</option>
                  <option value="alumni">Alumni</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Member">Member</option>
                  <option value="President">President</option>
                  <option value="Vice President">Vice President</option>
                  <option value="Tech Chair">Tech Chair</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button className="flex-1 bg-blue-900 hover:bg-blue-800" onClick={handleAddUser} disabled={!newUser.name || !newUser.email}>
                Create Account
              </Button>
              <Button variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Members', value: members.length },
          { label: 'Active Members', value: members.filter((m) => m.status === 'active').length },
          { label: 'Alumni', value: alumni.length },
          { label: 'Leadership', value: members.filter((m) => m.role !== 'Member').length },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardHeader className="pb-3">
              <CardDescription>{label}</CardDescription>
              <CardTitle className="text-2xl">{value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="members" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="members">Members ({members.length})</TabsTrigger>
          <TabsTrigger value="alumni">Alumni ({alumni.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="mt-6 space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input placeholder="Search members..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
                </div>
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Roles</option>
                  <option value="President">President</option>
                  <option value="Vice President">Vice President</option>
                  <option value="Tech Chair">Tech Chair</option>
                  <option value="Member">Member</option>
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Members list */}
          <div className="grid gap-4">
            {filteredMembers.map((member) => (
              <Card key={member.id} className="hover:shadow-md transition-shadow">
                <CardContent className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-blue-900 text-white">{member.initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-gray-900">{member.name}</h3>
                        <Badge className={roleBadge(member.role)}>{member.role}</Badge>
                        <Badge className={statusBadge(member.status)}>{member.status}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                        <span>{member.email}</span>
                        {member.year && <><span>•</span><span>{member.year}</span></>}
                        {member.major && <><span>•</span><span>{member.major}</span></>}
                        <span>•</span><span>Joined {member.joinDate}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0 relative">
                    <Button variant="outline" size="sm"><Mail className="w-4 h-4" /></Button>
                    <div className="relative">
                      <Button variant="outline" size="sm" onClick={() => setOpenMenuId(openMenuId === member.id ? null : member.id)}>
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                      {openMenuId === member.id && (
                        <div className="absolute right-0 top-9 z-10 w-44 bg-white rounded-lg border border-slate-200 shadow-lg py-1">
                          <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-slate-50 w-full text-left" onClick={() => setOpenMenuId(null)}>
                            <UserCog className="w-4 h-4" /> Edit Profile
                          </button>
                          <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-slate-50 w-full text-left" onClick={() => setOpenMenuId(null)}>
                            <Shield className="w-4 h-4" /> Change Role
                          </button>
                          <button
                            className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-slate-50 w-full text-left"
                            onClick={() => { setMembers(members.map((m) => m.id === member.id ? { ...m, status: 'inactive' } : m)); setOpenMenuId(null); }}
                          >
                            Deactivate
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="alumni" className="mt-6 space-y-4">
          <div className="grid gap-4">
            {alumni.map((person) => (
              <Card key={person.id} className="hover:shadow-md transition-shadow">
                <CardContent className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-amber-700 text-white">{person.initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{person.name}</h3>
                        <Badge className={statusBadge(person.status)}>{person.status}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                        <span>{person.email}</span>
                        <span>•</span>
                        <span>Graduated {person.graduationYear}</span>
                        <span>•</span>
                        <span>{person.company}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button variant="outline" size="sm"><Mail className="w-4 h-4" /></Button>
                    <Button variant="outline" size="sm"><MoreVertical className="w-4 h-4" /></Button>
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
