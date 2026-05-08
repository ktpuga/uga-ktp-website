import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Search, UserPlus, Mail, MoreVertical, Shield, UserCog } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu';
export default function AdminUsers() {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const members = [
        {
            id: 1,
            name: 'Alex Thompson',
            email: 'alex.t@uga.edu',
            role: 'President',
            status: 'active',
            joinDate: 'Fall 2023',
            year: 'Senior',
            major: 'Computer Science',
            initials: 'AT',
        },
        {
            id: 2,
            name: 'Jordan Lee',
            email: 'jordan.l@uga.edu',
            role: 'Vice President',
            status: 'active',
            joinDate: 'Fall 2023',
            year: 'Senior',
            major: 'Information Systems',
            initials: 'JL',
        },
        {
            id: 3,
            name: 'Sam Martinez',
            email: 'sam.m@uga.edu',
            role: 'Member',
            status: 'active',
            joinDate: 'Spring 2024',
            year: 'Junior',
            major: 'Computer Science',
            initials: 'SM',
        },
        {
            id: 4,
            name: 'Casey Nguyen',
            email: 'casey.n@uga.edu',
            role: 'Tech Chair',
            status: 'active',
            joinDate: 'Fall 2024',
            year: 'Sophomore',
            major: 'Computer Engineering',
            initials: 'CN',
        },
        {
            id: 5,
            name: 'Riley Johnson',
            email: 'riley.j@uga.edu',
            role: 'Member',
            status: 'active',
            joinDate: 'Fall 2024',
            year: 'Sophomore',
            major: 'MIS',
            initials: 'RJ',
        },
        {
            id: 6,
            name: 'Morgan Davis',
            email: 'morgan.d@uga.edu',
            role: 'Member',
            status: 'inactive',
            joinDate: 'Spring 2024',
            year: 'Junior',
            major: 'Computer Science',
            initials: 'MD',
        },
    ];
    const alumni = [
        {
            id: 1,
            name: 'Sarah Chen',
            email: 's.chen@example.com',
            status: 'active',
            graduationYear: '2023',
            company: 'Google',
            initials: 'SC',
        },
        {
            id: 2,
            name: 'Michael Rodriguez',
            email: 'm.rodriguez@example.com',
            status: 'active',
            graduationYear: '2022',
            company: 'Amazon',
            initials: 'MR',
        },
        {
            id: 3,
            name: 'Emily Johnson',
            email: 'e.johnson@example.com',
            status: 'active',
            graduationYear: '2024',
            company: 'Microsoft',
            initials: 'EJ',
        },
    ];
    const getRoleBadgeColor = (role) => {
        const colors = {
            President: 'bg-red-100 text-red-800',
            'Vice President': 'bg-amber-100 text-amber-800',
            'Tech Chair': 'bg-blue-100 text-blue-800',
            Member: 'bg-gray-100 text-gray-800',
        };
        return colors[role] || 'bg-gray-100 text-gray-800';
    };
    const getStatusBadgeColor = (status) => {
        return status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
    };
    const filteredMembers = members.filter(member => {
        const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            member.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = filterRole === 'all' || member.role === filterRole;
        const matchesStatus = filterStatus === 'all' || member.status === filterStatus;
        return matchesSearch && matchesRole && matchesStatus;
    });
    return (<div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
          <p className="text-gray-600">Manage member and alumni accounts</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-red-800 hover:bg-red-900">
              <UserPlus className="w-4 h-4 mr-2"/>
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>Create a new member or alumni account</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="Enter full name"/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="email@uga.edu"/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="user-type">User Type</Label>
                  <Select defaultValue="member">
                    <SelectTrigger id="user-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="alumni">Alumni</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select defaultValue="member-role">
                    <SelectTrigger id="role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member-role">Member</SelectItem>
                      <SelectItem value="president">President</SelectItem>
                      <SelectItem value="vp">Vice President</SelectItem>
                      <SelectItem value="tech-chair">Tech Chair</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="w-full bg-red-800 hover:bg-red-900">Create Account</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Members</CardDescription>
            <CardTitle className="text-2xl">{members.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active Members</CardDescription>
            <CardTitle className="text-2xl">
              {members.filter(m => m.status === 'active').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Alumni</CardDescription>
            <CardTitle className="text-2xl">{alumni.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Leadership</CardDescription>
            <CardTitle className="text-2xl">
              {members.filter(m => m.role !== 'Member').length}
            </CardTitle>
          </CardHeader>
        </Card>
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
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
                  <Input placeholder="Search members..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10"/>
                </div>
                <Select value={filterRole} onValueChange={setFilterRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by role"/>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="President">President</SelectItem>
                    <SelectItem value="Vice President">Vice President</SelectItem>
                    <SelectItem value="Tech Chair">Tech Chair</SelectItem>
                    <SelectItem value="Member">Member</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status"/>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Members List */}
          <div className="grid gap-4">
            {filteredMembers.map((member) => (<Card key={member.id} className="hover:shadow-md transition-shadow">
                <CardContent className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-red-800 text-white">
                        {member.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{member.name}</h3>
                        <Badge className={getRoleBadgeColor(member.role)}>{member.role}</Badge>
                        <Badge className={getStatusBadgeColor(member.status)}>
                          {member.status}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                        <span>{member.email}</span>
                        <span>•</span>
                        <span>{member.year}</span>
                        <span>•</span>
                        <span>{member.major}</span>
                        <span>•</span>
                        <span>Joined {member.joinDate}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button variant="outline" size="sm">
                      <Mail className="w-4 h-4"/>
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MoreVertical className="w-4 h-4"/>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <UserCog className="w-4 h-4 mr-2"/>
                          Edit Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Shield className="w-4 h-4 mr-2"/>
                          Change Role
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          Deactivate
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>))}
          </div>
        </TabsContent>

        <TabsContent value="alumni" className="mt-6 space-y-4">
          {/* Alumni List */}
          <div className="grid gap-4">
            {alumni.map((person) => (<Card key={person.id} className="hover:shadow-md transition-shadow">
                <CardContent className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-amber-800 text-white">
                        {person.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{person.name}</h3>
                        <Badge className={getStatusBadgeColor(person.status)}>
                          {person.status}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                        <span>{person.email}</span>
                        <span>•</span>
                        <span>Graduated {person.graduationYear}</span>
                        <span>•</span>
                        <span>{person.company}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button variant="outline" size="sm">
                      <Mail className="w-4 h-4"/>
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MoreVertical className="w-4 h-4"/>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <UserCog className="w-4 h-4 mr-2"/>
                          Edit Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          Deactivate
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>))}
          </div>
        </TabsContent>
      </Tabs>
    </div>);
}
