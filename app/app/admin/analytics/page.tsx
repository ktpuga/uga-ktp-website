'use client';


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, Users, Calendar, Target, Award } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function AdminAnalytics() {
  const membershipData = [
    { month: 'Sep', members: 142 },
    { month: 'Oct', members: 145 },
    { month: 'Nov', members: 148 },
    { month: 'Dec', members: 150 },
    { month: 'Jan', members: 152 },
    { month: 'Feb', members: 156 },
  ];

  const eventAttendanceData = [
    { event: 'GBM', attendance: 92 },
    { event: 'Tech Talk', attendance: 78 },
    { event: 'Social', attendance: 85 },
    { event: 'Workshop', attendance: 65 },
    { event: 'Service', attendance: 45 },
  ];

  const engagementData = [
    { name: 'Highly Active', value: 35, color: '#7f1d1d' },
    { name: 'Active', value: 45, color: '#dc2626' },
    { name: 'Moderately Active', value: 15, color: '#f87171' },
    { name: 'Inactive', value: 5, color: '#fca5a5' },
  ];

  const recruitmertData = [
    { semester: 'Fall 2024', pledges: 22, initiated: 20 },
    { semester: 'Spring 2025', pledges: 18, initiated: 17 },
    { semester: 'Fall 2025', pledges: 25, initiated: 24 },
    { semester: 'Spring 2026', pledges: 20, initiated: 19 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics</h1>
          <p className="text-gray-600">Track chapter metrics and engagement</p>
        </div>
        <Select defaultValue="semester">
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Last Week</SelectItem>
            <SelectItem value="month">Last Month</SelectItem>
            <SelectItem value="semester">This Semester</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Total Members</CardTitle>
              <Users className="w-4 h-4 text-red-800" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <div className="flex items-center gap-1 mt-1 text-sm">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-green-600">+4</span>
              <span className="text-gray-500">this month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Avg. Attendance</CardTitle>
              <Calendar className="w-4 h-4 text-red-800" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85%</div>
            <div className="flex items-center gap-1 mt-1 text-sm">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-green-600">+3%</span>
              <span className="text-gray-500">from last semester</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Events Hosted</CardTitle>
              <Target className="w-4 h-4 text-red-800" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <div className="flex items-center gap-1 mt-1 text-sm">
              <span className="text-gray-500">8 this month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Retention Rate</CardTitle>
              <Award className="w-4 h-4 text-red-800" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94%</div>
            <div className="flex items-center gap-1 mt-1 text-sm">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-green-600">+2%</span>
              <span className="text-gray-500">from last year</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="membership" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="membership">Membership</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="recruitment">Recruitment</TabsTrigger>
        </TabsList>

        <TabsContent value="membership" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Membership Growth</CardTitle>
              <CardDescription>Active member count over the past 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={membershipData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="members"
                    stroke="#7f1d1d"
                    strokeWidth={2}
                    name="Active Members"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Event Attendance</CardTitle>
              <CardDescription>Average attendance by event type</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={eventAttendanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="event" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="attendance" fill="#7f1d1d" name="Attendance %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="mt-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Member Engagement</CardTitle>
                <CardDescription>Distribution of member activity levels</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={engagementData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {engagementData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Engagement Insights</CardTitle>
                <CardDescription>Key metrics and recommendations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <h4 className="font-semibold text-green-900">High Engagement</h4>
                  </div>
                  <p className="text-sm text-green-800">
                    80% of members are active or highly active - exceeding our target of 75%
                  </p>
                </div>
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-5 h-5 text-amber-600" />
                    <h4 className="font-semibold text-amber-900">Re-engagement Needed</h4>
                  </div>
                  <p className="text-sm text-amber-800">
                    5% of members are inactive. Consider reaching out with personalized engagement.
                  </p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-blue-900">Recognition Opportunity</h4>
                  </div>
                  <p className="text-sm text-blue-800">
                    35% highly active members could be candidates for leadership positions.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recruitment" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Recruitment & Retention</CardTitle>
              <CardDescription>Pledge class size and initiation rates</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={recruitmertData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="semester" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="pledges" fill="#7f1d1d" name="Pledges" />
                  <Bar dataKey="initiated" fill="#dc2626" name="Initiated" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
